require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UAParser = require('ua-parser-js');
const http = require('http');
const { Server } = require('socket.io');
const reminderService = require('./reminderService');
const recurringTaskService = require('./recurringTaskService');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
const frontendUrl = process.env.FRONTEND_URL || 'https://activity-tracker-gold.vercel.app';
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://activity-tracker-client-phi.vercel.app',
    'https://activity-tracker-gold.vercel.app',
    frontendUrl
].filter(Boolean);


app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 🔥 THIS IS THE MOST IMPORTANT LINE
app.options("*", (req, res) => {
    res.sendStatus(200);
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }

});




// Store user socket connections if needed (simple map for now, or just broadcast to room)
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register

app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashed],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: 'User already exists' });
                }
                res.json({ message: 'Registration successful' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// app.post('/api/auth/register', async (req, res) => {
//     const { username, password } = req.body;
//     if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
//         db.run(query, [username, hashedPassword], function (err) {
//             if (err) {
//                 if (err.message.includes('UNIQUE constraint failed')) {
//                     return res.status(400).json({ error: 'Username already exists' });
//                 }
//                 return res.status(500).json({ error: err.message });
//             }
//             res.status(201).json({ id: this.lastID, username });
//         });
//     } catch (e) {
//         res.status(500).json({ error: e.message });
//     }
// });

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const deviceInfo = `${result.browser.name} on ${result.os.name} (${result.device.type || 'Desktop'})`;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Get geolocation from IP (free service)
        let latitude = null, longitude = null, city = 'Unknown', country = 'Unknown';

        try {
            // Clean IP address (remove ::ffff: prefix for IPv4-mapped IPv6)
            const cleanIp = ip.replace('::ffff:', '');

            // Skip geolocation for localhost
            if (cleanIp !== '127.0.0.1' && cleanIp !== '::1' && !cleanIp.startsWith('192.168.')) {
                const axios = require('axios');
                const geoResponse = await axios.get(`https://ipapi.co/${cleanIp}/json/`, { timeout: 3000 });

                if (geoResponse.data) {
                    latitude = geoResponse.data.latitude;
                    longitude = geoResponse.data.longitude;
                    city = geoResponse.data.city || 'Unknown';
                    country = geoResponse.data.country_name || 'Unknown';
                }
            } else {
                // Default for localhost/local IPs - use a sample location
                latitude = 0;
                longitude = 0;
                city = 'Local Development';
                country = 'Localhost';
            }
        } catch (geoError) {
            console.log('Geolocation lookup failed, using defaults:', geoError.message);
        }

        // Log Activity with geolocation
        db.run('INSERT INTO activity_logs (user_id, ip_address, user_agent, device_info, latitude, longitude, city, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, ip, userAgent, deviceInfo, latitude, longitude, city, country],
            function (err) {
                if (err) console.error("Error logging activity", err);

                // Real-time update for activity
                const newActivity = {
                    id: this.lastID,
                    user_id: user.id,
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), // Approximate sqlite format match
                    ip_address: ip,
                    user_agent: userAgent,
                    device_info: deviceInfo
                };
                io.to(`user_${user.id}`).emit('new_activity', newActivity);

                // Check for new device logic
                db.get('SELECT * FROM activity_logs WHERE user_id = ? AND device_info = ? AND id != ?',
                    [user.id, deviceInfo, this.lastID],
                    (err, row) => {
                        if (!row) {
                            // New Device Detected!
                            const message = `New login detected from ${deviceInfo}`;
                            db.run('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
                                [user.id, message, 'security_alert'], function () {
                                    const notif = {
                                        id: this.lastID,
                                        user_id: user.id,
                                        message: message,
                                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                                        is_read: 0,
                                        type: 'security_alert'
                                    };
                                    io.to(`user_${user.id}`).emit('new_notification', notif);
                                });
                        }
                    }
                );

                // Login Success Notification
                const successMsg = `Login successful from ${deviceInfo}`;
                db.run('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
                    [user.id, successMsg, 'info'], function () {
                        const notif = {
                            id: this.lastID,
                            user_id: user.id,
                            message: successMsg,
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                            is_read: 0,
                            type: 'info'
                        };
                        io.to(`user_${user.id}`).emit('new_notification', notif);
                    });
            }
        );

        res.json({ token, user: { id: user.id, username: user.username } });
    });
});

// Get Activity History
app.get('/api/user/activity', authenticateToken, (req, res) => {
    db.all('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Notifications
app.get('/api/user/notifications', authenticateToken, (req, res) => {
    db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Mark Notification as Read
app.post('/api/user/notifications/:id/read', authenticateToken, (req, res) => {
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ============ TASK MANAGEMENT ENDPOINTS ============

// Create new task
app.post('/api/tasks', authenticateToken, (req, res) => {
    const { title, description, scheduled_time, task_date } = req.body;

    if (!title || !task_date) {
        return res.status(400).json({ error: 'Title and task_date are required' });
    }

    db.run(
        'INSERT INTO tasks (user_id, title, description, scheduled_time, task_date) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, title, description || null, scheduled_time || null, task_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const taskId = this.lastID;
            db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
                if (err) return res.status(500).json({ error: err.message });

                // Emit real-time event
                io.to(`user_${req.user.id}`).emit('task_created', task);

                res.status(201).json(task);
            });
        }
    );
});

// Get tasks for a specific date (default: today)
app.get('/api/tasks', authenticateToken, (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    db.all(
        'SELECT * FROM tasks WHERE user_id = ? AND task_date = ? ORDER BY scheduled_time ASC',
        [req.user.id, date],
        (err, tasks) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(tasks);
        }
    );
});

// Get single task
app.get('/api/tasks /: id', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, task) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!task) return res.status(404).json({ error: 'Task not found' });
            res.json(task);
        }
    );
});

// Update task
app.put('/api/tasks /: id', authenticateToken, (req, res) => {
    const { title, description, scheduled_time, task_date } = req.body;

    db.run(
        'UPDATE tasks SET title = ?, description = ?, scheduled_time = ?, task_date = ? WHERE id = ? AND user_id = ?',
        [title, description, scheduled_time, task_date, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });

            db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
                if (err) return res.status(500).json({ error: err.message });

                // Emit real-time event
                io.to(`user_${req.user.id}`).emit('task_updated', task);

                res.json(task);
            });
        }
    );
});

// Mark task as completed
app.patch('/api/tasks /: id / complete', authenticateToken, (req, res) => {
    const completedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.run(
        'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND user_id = ?',
        ['completed', completedAt, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });

            db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
                if (err) return res.status(500).json({ error: err.message });

                // Emit real-time event
                io.to(`user_${req.user.id}`).emit('task_completed', task);

                res.json(task);
            });
        }
    );
});

// Delete task
app.delete('/api/tasks /: id', authenticateToken, (req, res) => {
    db.run(
        'DELETE FROM tasks WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });

            // Emit real-time event
            io.to(`user_${req.user.id}`).emit('task_deleted', { id: req.params.id });

            res.json({ success: true, message: 'Task deleted' });
        }
    );
});

// Get timeline (all tasks for today in chronological order)
app.get('/api/tasks/timeline/today', authenticateToken, (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    db.all(
        `SELECT * FROM tasks
         WHERE user_id = ? AND task_date = ?
         ORDER BY
            CASE WHEN scheduled_time IS NULL THEN 1 ELSE 0 END,
            scheduled_time ASC`,
        [req.user.id, today],
        (err, tasks) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(tasks);
        }
    );
});

// Get today's summary
app.get('/api / tasks / summary / today', authenticateToken, (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    db.all(
        'SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? AND task_date = ? GROUP BY status',
        [req.user.id, today],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            const summary = {
                total: 0,
                completed: 0,
                pending: 0,
                missed: 0,
                completion_rate: 0
            };

            results.forEach(row => {
                summary[row.status] = row.count;
                summary.total += row.count;
            });

            if (summary.total > 0) {
                summary.completion_rate = ((summary.completed / summary.total) * 100).toFixed(2);
            }

            res.json(summary);
        }
    );
});

// Get summary for specific date
app.get('/api / tasks / summary /: date', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM daily_summaries WHERE user_id = ? AND summary_date = ?',
        [req.user.id, req.params.date],
        (err, summary) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!summary) return res.status(404).json({ error: 'Summary not found' });
            res.json(summary);
        }
    );
});

// Get user preferences
app.get('/api/user/preferences', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [req.user.id],
        (err, prefs) => {
            if (err) return res.status(500).json({ error: err.message });

            // If no preferences exist, return defaults
            if (!prefs) {
                return res.json({
                    user_id: req.user.id,
                    email: null,
                    phone_number: null,
                    enable_browser_notif: 1,
                    enable_email_notif: 0,
                    enable_sms_notif: 0,
                    reminder_before_minutes: 15,
                    reminder_interval_minutes: 10
                });
            }

            res.json(prefs);
        }
    );
});

// Update user preferences
app.put('/api/user/preferences', authenticateToken, (req, res) => {
    const {
        email,
        phone_number,
        enable_browser_notif,
        enable_email_notif,
        enable_sms_notif,
        reminder_before_minutes,
        reminder_interval_minutes
    } = req.body;

    db.run(
        `INSERT INTO user_preferences
         (user_id, email, phone_number, enable_browser_notif, enable_email_notif,
          enable_sms_notif, reminder_before_minutes, reminder_interval_minutes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
            email = excluded.email,
            phone_number = excluded.phone_number,
            enable_browser_notif = excluded.enable_browser_notif,
            enable_email_notif = excluded.enable_email_notif,
            enable_sms_notif = excluded.enable_sms_notif,
            reminder_before_minutes = excluded.reminder_before_minutes,
            reminder_interval_minutes = excluded.reminder_interval_minutes,
            updated_at = CURRENT_TIMESTAMP`,
        [
            req.user.id,
            email || null,
            phone_number || null,
            enable_browser_notif !== undefined ? enable_browser_notif : 1,
            enable_email_notif !== undefined ? enable_email_notif : 0,
            enable_sms_notif !== undefined ? enable_sms_notif : 0,
            reminder_before_minutes || 15,
            reminder_interval_minutes || 10
        ],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            db.get(
                'SELECT * FROM user_preferences WHERE user_id = ?',
                [req.user.id],
                (err, prefs) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json(prefs);
                }
            );
        }
    );
});

// Toggle recurring task ON/OFF
app.patch('/api/ tasks /: id / toggle - recurring', authenticateToken, async (req, res) => {
    const { is_active } = req.body;

    try {
        await recurringTaskService.toggleRecurringTask(req.params.id, is_active);

        db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(task);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get progress analytics
app.get('/api/tasks/analytics/progress', authenticateToken, (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of day

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    if (!req.user || !req.user.id) {
        console.error('Analytics error: User not authenticated');
        return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Analytics query:', { userId: req.user.id, startStr, endStr });

    // Get daily completion data - simplified query first
    db.all(
        `SELECT
            task_date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
         FROM tasks
         WHERE user_id = ?
           AND task_date >= ?
           AND task_date <= ?
         GROUP BY task_date
         ORDER BY task_date ASC`,
        [req.user.id, startStr, endStr],
        (err, dailyData) => {
            if (err) {
                console.error('Analytics DB error:', err);
                return res.status(500).json({ error: err.message });
            }

            try {
                console.log('Daily data rows:', dailyData ? dailyData.length : 0);

                // Handle empty data case
                if (!dailyData || dailyData.length === 0) {
                    console.log('No data found, returning empty analytics');
                    return res.json({
                        daily: [],
                        summary: {
                            total_tasks: 0,
                            completed: 0,
                            overall_completion_rate: 0,
                            days_tracked: 0
                        }
                    });
                }

                // Calculate completion rates
                const chartData = dailyData.map(day => ({
                    date: day.task_date,
                    total: day.total,
                    completed: day.completed,
                    missed: day.missed,
                    pending: day.pending,
                    completion_rate: day.total > 0 ? parseFloat(((day.completed / day.total) * 100).toFixed(1)) : 0
                }));

                // Calculate overall stats
                const totalTasks = dailyData.reduce((sum, day) => sum + day.total, 0);
                const totalCompleted = dailyData.reduce((sum, day) => sum + day.completed, 0);
                const overallRate = totalTasks > 0 ? ((totalCompleted / totalTasks) * 100).toFixed(1) : 0;

                const response = {
                    daily: chartData,
                    summary: {
                        total_tasks: totalTasks,
                        completed: totalCompleted,
                        overall_completion_rate: parseFloat(overallRate),
                        days_tracked: dailyData.length
                    }
                };

                console.log('Analytics response summary:', response.summary);
                res.json(response);
            } catch (processingError) {
                console.error('Analytics processing error:', processingError);
                return res.status(500).json({ error: 'Failed to process analytics data: ' + processingError.message });
            }
        }
    );
});

// Get login locations for globe
app.get('/api/activities/locations', authenticateToken, (req, res) => {
    db.all(
        `SELECT DISTINCT
            latitude as lat,
            longitude as lon,
            city,
            country,
            COUNT(*) as login_count
         FROM activity_logs
         WHERE user_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
         GROUP BY latitude, longitude, city, country
         ORDER BY login_count DESC
         LIMIT 50`,
        [req.user.id],
        (err, locations) => {
            if (err) {
                console.error('Failed to fetch locations:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(locations || []);
        }
    );
});


app.get('/', (req, res) => {
    res.send('Activity Tracker API is running');
});


// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)

    // Initialize reminder service with Socket.io
    reminderService.initialize(io);
    console.log('Reminder service started - checking tasks every minute');
});





















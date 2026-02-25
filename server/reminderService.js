const cron = require('node-cron');
const db = require('./database');
const emailService = require('./emailService');
const smsService = require('./smsService');

// Store for Socket.io instance (will be set from index.js)
let io = null;

/**
 * Initialize reminder service with Socket.io instance
 * @param {object} socketIo - Socket.io server instance
 */
function initialize(socketIo) {
    io = socketIo;
    console.log('Reminder service initialized');
    
    // Run reminder check every minute
    cron.schedule('* * * * *', () => {
        checkAndSendReminders();
    });

    // Run daily reset at midnight
    cron.schedule('0 0 * * *', () => {
        performDailyReset();
    });

    // Generate recurring tasks daily at 1 AM
    cron.schedule('0 1 * * *', () => {
        const recurringService = require('./recurringTaskService');
        recurringService.generateRecurringTasks();
    });

    console.log('Scheduled jobs: Reminder checker (every minute), Daily reset (midnight), Recurring tasks (1 AM)');
}

/**
 * Check for tasks that need reminders and send them
 */
async function checkAndSendReminders() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Get all pending tasks for today
    db.all(
        `SELECT t.*, u.username, p.email, p.phone_number, 
                p.enable_browser_notif, p.enable_email_notif, p.enable_sms_notif,
                p.reminder_before_minutes, p.reminder_interval_minutes
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         LEFT JOIN user_preferences p ON t.user_id = p.user_id
         WHERE t.task_date = ? AND t.status = 'pending' AND t.scheduled_time IS NOT NULL`,
        [currentDate],
        (err, tasks) => {
            if (err) {
                console.error('Error fetching tasks for reminders:', err);
                return;
            }

            tasks.forEach(task => {
                processTaskReminders(task, now, currentTime);
            });
        }
    );
}

/**
 * Process reminders for a single task
 */
function processTaskReminders(task, now, currentTime) {
    const scheduledTime = task.scheduled_time; // HH:MM format
    const beforeMinutes = task.reminder_before_minutes || 15;
    const intervalMinutes = task.reminder_interval_minutes || 10;

    // Parse scheduled time
    const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(now);
    scheduledDateTime.setHours(schedHours, schedMinutes, 0, 0);

    // Calculate time until task
    const minutesUntilTask = Math.floor((scheduledDateTime - now) / (1000 * 60));
    
    // DEBUG
    // console.log(`Task: ${task.title}, Current: ${now.toLocaleTimeString()}, Scheduled: ${scheduledTime}, Minutes until: ${minutesUntilTask}`);

    let reminderType = null;

    // Pre-start reminder (X minutes before)
    if (minutesUntilTask <= beforeMinutes && minutesUntilTask > beforeMinutes - 1) {
        reminderType = 'pre_start';
    }
    // On-time reminder (at exact time or within same minute)
    else if (minutesUntilTask <= 0 && minutesUntilTask > -1) {
        reminderType = 'on_time';
    }
    // Overdue reminder (every Y minutes after)
    else if (minutesUntilTask < 0 && Math.abs(minutesUntilTask) % intervalMinutes === 0) {
        reminderType = 'overdue';
    }

    if (reminderType) {
        // Check if reminder already sent for this exact time
        const scheduledFor = now.toISOString().slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:MM
        
        db.get(
            'SELECT * FROM reminders WHERE task_id = ? AND scheduled_for LIKE ? AND reminder_type = ?',
            [task.id, `${scheduledFor}%`, reminderType],
            (err, existingReminder) => {
                if (!existingReminder) {
                    sendReminder(task, reminderType, scheduledFor);
                }
            }
        );
    }
}

/**
 * Send reminder through all enabled channels
 */
function sendReminder(task, reminderType, scheduledFor) {
    console.log(`Sending ${reminderType} reminder for task: ${task.title}`);

    // Prepare notification message
    const notificationMessage = formatReminderMessage(task, reminderType);

    // 1. Browser notification (Socket.io)
    if (task.enable_browser_notif !== 0 && io) {
        io.to(`user_${task.user_id}`).emit('task_reminder', {
            task_id: task.id,
            title: task.title,
            description: task.description,
            scheduled_time: task.scheduled_time,
            reminder_type: reminderType,
            message: notificationMessage
        });

        // Also add to notifications table
        db.run(
            'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
            [task.user_id, notificationMessage, 'task_reminder'],
            function(err) {
                if (!err && io) {
                    const notif = {
                        id: this.lastID,
                        user_id: task.user_id,
                        message: notificationMessage,
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                        is_read: 0,
                        type: 'task_reminder'
                    };
                    io.to(`user_${task.user_id}`).emit('new_notification', notif);
                }
            }
        );
    }

    // 2. Email notification
    if (task.enable_email_notif === 1 && task.email) {
        emailService.sendTaskReminder(task.email, task, reminderType)
            .catch(err => console.error('Email send error:', err));
    }

    // 3. SMS notification
    if (task.enable_sms_notif === 1 && task.phone_number) {
        smsService.sendTaskReminder(task.phone_number, task, reminderType)
            .catch(err => console.error('SMS send error:', err));
    }

    // Record reminder in database
    db.run(
        'INSERT INTO reminders (task_id, scheduled_for, sent_at, reminder_type) VALUES (?, ?, ?, ?)',
        [task.id, scheduledFor, new Date().toISOString().replace('T', ' ').slice(0, 19), reminderType],
        (err) => {
            if (err) console.error('Error recording reminder:', err);
        }
    );
}

function formatReminderMessage(task, reminderType) {
    const time = task.scheduled_time;
    switch(reminderType) {
        case 'pre_start':
            return `⏰ Upcoming: "${task.title}" at ${time}`;
        case 'on_time':
            return `🔔 Time to start: "${task.title}"`;
        case 'overdue':
            return `❗ Overdue: "${task.title}" (${time}) - Still pending!`;
        default:
            return `Task reminder: ${task.title}`;
    }
}

/**
 * Daily reset - mark incomplete tasks from previous days as "missed"
 */
function performDailyReset() {
    console.log('Running daily reset...');
    const today = new Date().toISOString().split('T')[0];

    db.run(
        `UPDATE tasks SET status = 'missed' WHERE task_date < ? AND status = 'pending'`,
        [today],
        function(err) {
            if (err) {
                console.error('Error during daily reset:', err);
            } else {
                console.log(`Daily reset complete. ${this.changes} tasks marked as missed.`);
            }
        }
    );

    // Generate daily summaries for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    
    generateDailySummary(yesterdayDate);
}

/**
 * Generate daily summary for a specific date
 */
function generateDailySummary(date) {
    db.all(
        'SELECT user_id, status, COUNT(*) as count FROM tasks WHERE task_date = ? GROUP BY user_id, status',
        [date],
        (err, results) => {
            if (err) {
                console.error('Error generating daily summary:', err);
                return;
            }

            // Group by user
            const userStats = {};
            results.forEach(row => {
                if (!userStats[row.user_id]) {
                    userStats[row.user_id] = { completed: 0, missed: 0, pending: 0 };
                }
                userStats[row.user_id][row.status] = row.count;
            });

            // Insert summaries
            Object.keys(userStats).forEach(userId => {
                const stats = userStats[userId];
                const total = stats.completed + stats.missed + stats.pending;
                const completionRate = total > 0 ? (stats.completed / total) * 100 : 0;

                db.run(
                    `INSERT OR REPLACE INTO daily_summaries 
                     (user_id, summary_date, total_tasks, completed_tasks, missed_tasks, completion_rate)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, date, total, stats.completed, stats.missed, completionRate.toFixed(2)],
                    (err) => {
                        if (err) console.error('Error saving daily summary:', err);
                        else console.log(`Daily summary saved for user ${userId} on ${date}`);
                    }
                );
            });
        }
    );
}

module.exports = { initialize, generateDailySummary };

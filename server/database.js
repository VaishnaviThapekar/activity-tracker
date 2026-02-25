const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require("bcryptjs");


const dbPath = path.resolve(__dirname, 'activity_tracker.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Activity Logs table
        db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            device_info TEXT,
            latitude REAL,
            longitude REAL,
            city TEXT,
            country TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Notifications table
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            type TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Tasks table for daily to-do items
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            scheduled_time TEXT,
            duration_minutes INTEGER DEFAULT 30,
            task_date DATE NOT NULL,
            status TEXT DEFAULT 'pending',
            completed_at DATETIME,
            is_recurring INTEGER DEFAULT 0,
            recurrence_pattern TEXT,
            parent_task_id INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(parent_task_id) REFERENCES tasks(id)
        )`);

        // Reminders table for tracking reminder state
        db.run(`CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            scheduled_for DATETIME NOT NULL,
            sent_at DATETIME,
            reminder_type TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )`);

        // Daily summary for performance tracking
        db.run(`CREATE TABLE IF NOT EXISTS daily_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            summary_date DATE NOT NULL,
            total_tasks INTEGER,
            completed_tasks INTEGER,
            missed_tasks INTEGER,
            completion_rate REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(user_id, summary_date)
        )`);

        // User notification preferences
        db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            email TEXT,
            phone_number TEXT,
            enable_browser_notif INTEGER DEFAULT 1,
            enable_email_notif INTEGER DEFAULT 0,
            enable_sms_notif INTEGER DEFAULT 0,
            reminder_before_minutes INTEGER DEFAULT 15,
            reminder_interval_minutes INTEGER DEFAULT 10,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        console.log('Database tables initialized successfully');
    });
}

module.exports = db;

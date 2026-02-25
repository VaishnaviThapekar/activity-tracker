const nodemailer = require('nodemailer');

// Email service configuration
let transporter = null;

// Initialize email service only if credentials are provided
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'pro.eu.turbo-smtp.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        console.log('Email service initialized successfully');
    } catch (error) {
        console.error('Failed to initialize email service:', error.message);
    }
} else {
    console.log('Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD env vars to enable email notifications.');
}

/**
 * Send task reminder email
 */
async function sendTaskReminder(to, task, reminderType) {
    if (!transporter) {
        return false;
    }

    if (!to || !to.includes('@')) {
        return false;
    }

    const subject = getReminderSubject(task, reminderType);
    const html = getReminderEmailTemplate(task, reminderType);

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Task Tracker <noreply@tasktracker.com>',
            to: to,
            subject: subject,
            html: html
        });
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error(`Failed to send email:`, error.message);
        return false;
    }
}

function getReminderSubject(task, reminderType) {
    switch(reminderType) {
        case 'pre_start':
            return `⏰ Upcoming Task: ${task.title}`;
        case 'on_time':
            return `🔔 Task Now: ${task.title}`;
        case 'overdue':
            return `❗ Overdue Task: ${task.title}`;
        default:
            return `Task Reminder: ${task.title}`;
    }
}

function getReminderEmailTemplate(task, reminderType) {
    const time = task.scheduled_time || 'No time set';
    const desc = task.description || 'No description';
    
    let message = '';
    switch(reminderType) {
        case 'pre_start':
            message = 'Your task is coming up soon!';
            break;
        case 'on_time':
            message = 'It\'s time to start this task!';
            break;
        case 'overdue':
            message = 'This task is still incomplete.';
            break;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px; }
                .task-card { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
                .task-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #667eea; }
                .task-time { color: #666; font-size: 14px; margin-bottom: 10px; }
                .task-desc { color: #444; }
                .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 Task Reminder</h1>
                    <p>${message}</p>
                </div>
                <div class="content">
                    <div class="task-card">
                        <div class="task-title">${task.title}</div>
                        <div class="task-time">⏰ Scheduled Time: ${time}</div>
                        <div class="task-desc">${desc}</div>
                    </div>
                    <p>Open your Task Tracker app to mark this task as complete.</p>
                </div>
                <div class="footer">
                    <p>Daily To-Do Tracker | Stay productive, stay consistent 🚀</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { sendTaskReminder };

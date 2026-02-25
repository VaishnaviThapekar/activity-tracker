const twilio = require('twilio');

// Twilio configuration
// IMPORTANT: Set these environment variables or update with your Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

let client;

// Initialize Twilio client only if credentials are provided
function initTwilioClient() {
    if (accountSid && accountSid !== 'your_account_sid' && authToken && authToken !== 'your_auth_token') {
        try {
            client = twilio(accountSid, authToken);
            console.log('Twilio SMS service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Twilio:', error.message);
            return false;
        }
    } else {
        console.log('Twilio credentials not configured. SMS notifications disabled.');
        return false;
    }
}

initTwilioClient();

/**
 * Send task reminder SMS
 * @param {string} to - Recipient phone number (E.164 format, e.g., +1234567890)
 * @param {object} task - Task object with title, scheduled_time
 * @param {string} reminderType - Type of reminder (pre_start, on_time, overdue)
 */
async function sendTaskReminder(to, task, reminderType) {
    if (!client) {
        console.log('Twilio client not initialized. Cannot send SMS.');
        return false;
    }

    if (!to || !to.startsWith('+')) {
        console.log(`Invalid phone number format: ${to}. Must use E.164 format (e.g., +1234567890)`);
        return false;
    }

    const message = getReminderMessage(task, reminderType);

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioPhone,
            to: to
        });
        console.log(`SMS sent to ${to}: ${result.sid}`);
        return true;
    } catch (error) {
        console.error(`Failed to send SMS to ${to}:`, error.message);
        return false;
    }
}

function getReminderMessage(task, reminderType) {
    const time = task.scheduled_time || 'No time';
    
    switch(reminderType) {
        case 'pre_start':
            return `⏰ Task Reminder: "${task.title}" is coming up at ${time}. Get ready!`;
        case 'on_time':
            return `🔔 It's time! Task: "${task.title}" scheduled for ${time}. Start now!`;
        case 'overdue':
            return `❗ Overdue: Task "${task.title}" (${time}) is still incomplete. Complete it now!`;
        default:
            return `📋 Task Reminder: ${task.title} at ${time}`;
    }
}

module.exports = { sendTaskReminder };

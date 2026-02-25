# Email & SMS Notification Setup Guide

## 📧 Gmail Email Notifications

### Step 1: Generate Gmail App Password

1. **Visit**: https://myaccount.google.com/apppasswords
2. **Enable 2-Step Verification** (if not already):
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification
3. **Generate App Password**:
   - Select app: **Mail**
   - Select device: **Windows Computer**
   - Click **Generate**
   - **Copy the 16-character password** (format: `abcd efgh ijkl mnop`)

### Step 2: Edit the .env File

**File location**: `server/.env`

Open the file and replace these lines:

```env
EMAIL_USER=your-email@gmail.com        ← Replace with your Gmail
EMAIL_PASSWORD=your-app-password-here  ← Replace with 16-char app password (no spaces)
```

**Example**:

```env
EMAIL_USER=johndoe@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 3: Restart the Server

Stop the current server (Ctrl+C in terminal) and restart:

```bash
cd server
node index.js
```

You should see:

```
✅ Email service initialized successfully
```

---

## 📱 SMS Notifications (Optional - Twilio)

### Step 1: Sign Up for Twilio

1. Visit: https://www.twilio.com/
2. Create a free trial account
3. Get a free phone number

### Step 2: Get Your Credentials

From Twilio Console:

- **Account SID**: Starts with "AC..."
- **Auth Token**: Your authentication token
- **Phone Number**: Your Twilio number (format: +1234567890)

### Step 3: Edit the .env File

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 4: Restart Server

Same as email setup - restart with `node index.js`

---

## ✅ Testing Notifications

1. **Open app**: http://localhost:5173
2. **Go to Settings tab**
3. **Enable Email** (toggle ON) and enter your email
4. **Enable SMS** (toggle ON) and enter phone (+1234567890 format)
5. **Click Save**
6. **Create a task** scheduled for 2 minutes in the future
7. **Wait** - you'll receive notifications via enabled channels!

---

## 🔒 Security Notes

- ✅ `.env` file is gitignored (your credentials won't be committed)
- ✅ Never share your `.env` file
- ✅ Use App Password, not your regular Gmail password
- ✅ `.env.example` is the template (safe to commit)

---

## 🚀 Quick Start (Summary)

```bash
# 1. Get Gmail App Password from Google
# 2. Edit server/.env file with your credentials
# 3. Restart server
cd server
node index.js

# Server will show:
# ✅ Email service initialized successfully
# ✅ Server running on port 3001
```

**That's it!** Your task reminders will now be sent via email (and SMS if configured).

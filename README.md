# Activity Tracker

A full-stack task management application with real-time notifications, analytics, and interactive visualizations. Track your daily activities, set reminders, and visualize your productivity with beautiful 3D globe and charts.

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure JWT-based login and registration
- **Task Management** - Create, edit, complete, and delete daily tasks
- **Smart Scheduling** - Set scheduled times and duration for tasks
- **Recurring Tasks** - Auto-generate tasks with daily, weekday, or weekend patterns
- **Real-time Updates** - Live task synchronization via Socket.IO
- **Task Status Tracking** - Automatic status updates (pending, completed, overdue, missed)

### Analytics & Visualization
- **Progress Charts** - Track completion rates with interactive line and bar charts
- **Daily Summaries** - View total tasks, completion rates, and trends
- **Task Breakdown** - Pie charts showing task distribution
- **3D Globe Visualization** - See login activity plotted on an interactive 3D globe
- **Activity Logs** - Track IP addresses, locations, and device information

### Notifications & Reminders
- **Browser Notifications** - Desktop notifications for task reminders
- **Email Notifications** - Optional email reminders for tasks
- **SMS Notifications** - Optional SMS reminders via Twilio
- **Smart Reminders** - Pre-start, on-time, and overdue reminders
- **Customizable Settings** - Configure reminder timing and channels

### UI/UX
- **Modern Design** - Built with Tailwind CSS and custom gradients
- **Dark/Light Mode** - Theme switcher with persistent preferences
- **Responsive Layout** - Works seamlessly on desktop and mobile
- **3D Visualizations** - Spline models and particle effects
- **Smooth Animations** - Framer Motion powered interactions

## 🚀 Live Demo

- **Frontend**: [https://activity-tracker-gold.vercel.app](https://activity-tracker-gold.vercel.app)
- **Backend API**: Deploy to Render (see deployment instructions)

## 📋 Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Three.js** - 3D graphics and globe
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP requests
- **Spline** - Interactive 3D models

### Backend
- **Node.js & Express** - REST API server
- **SQLite** - Lightweight database
- **Socket.IO** - WebSocket server
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **node-cron** - Scheduled jobs
- **Nodemailer** - Email service
- **Twilio** - SMS service

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Clone Repository
```bash
git clone https://github.com/<your-username>/activity-tracker.git
cd activity-tracker
```

### Install Dependencies

**Root dependencies:**
```bash
npm install
```

**Client dependencies:**
```bash
cd client
npm install
cd ..
```

**Server dependencies:**
```bash
cd server
npm install
cd ..
```

## 🔧 Configuration

### Backend Environment Variables

Create `server/.env`:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:5173

# Optional: Email notifications (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Optional: SMS notifications (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend Environment Variables

Create `client/.env`:
```env
VITE_API_URL=http://localhost:3001
```

## 🏃 Running Locally

### Development Mode

**Start both client and server concurrently:**
```bash
npm run dev
```

This runs:
- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3001`

**Or run separately:**

**Backend only:**
```bash
cd server
npm start
```

**Frontend only:**
```bash
cd client
npm run dev
```

### Production Build

**Build frontend:**
```bash
npm run build
```

**Preview production build:**
```bash
cd client
npm run preview
```

## 🌐 Deployment

### Frontend Deployment (Vercel)

The frontend is already configured with `vercel.json`.

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to production:
```bash
vercel --prod
```

### Backend Deployment (Render)

The project includes `render.yaml` for one-click deployment.

#### Method 1: Blueprint Deployment (Recommended)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Blueprint**
4. Connect your GitHub repository
5. Select the repository and branch
6. Render will detect `render.yaml` and create the service automatically

#### Method 2: Manual Deployment

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=<generate-strong-secret>
   FRONTEND_URL=https://activity-tracker-gold.vercel.app
   ```
6. Deploy

#### After Backend Deployment

1. Copy your Render backend URL (e.g., `https://activity-tracker-api.onrender.com`)
2. Update Vercel environment variables:
   - Go to Vercel project settings
   - Add `VITE_API_URL` = `https://your-render-url.onrender.com`
3. Redeploy frontend:
   ```bash
   vercel --prod
   ```

### Alternative Backend Hosts

The backend can also be deployed to:
- **Railway** - Great for full-stack apps
- **Fly.io** - Global edge deployment
- **Heroku** - Classic PaaS platform
- **DigitalOcean App Platform** - Managed containers

Update the CORS settings in `server/index.js` to match your frontend URL.

## 📁 Project Structure

```
activity-tracker/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Globe3D.jsx         # 3D globe visualization
│   │   │   ├── TaskManager.jsx     # Task CRUD operations
│   │   │   ├── ProgressCharts.jsx  # Analytics charts
│   │   │   ├── UserSettings.jsx    # Notification preferences
│   │   │   └── ui/                 # Reusable UI components
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                  # Node.js backend
│   ├── index.js             # Express server & Socket.IO
│   ├── database.js          # SQLite setup & schema
│   ├── reminderService.js   # Cron jobs for reminders
│   ├── recurringTaskService.js  # Recurring task logic
│   ├── emailService.js      # Nodemailer config
│   ├── smsService.js        # Twilio SMS
│   ├── activity_tracker.sqlite  # SQLite database
│   └── package.json
├── render.yaml              # Render deployment config
├── vercel.json              # Vercel deployment config
├── package.json             # Root package (dev scripts)
└── README.md
```

## 🗄️ Database Schema

### Tables
- **users** - User accounts (username, hashed password)
- **tasks** - Daily tasks with scheduling and recurrence
- **activity_logs** - Login tracking with geolocation
- **notifications** - In-app notification history
- **reminders** - Reminder send history
- **daily_summaries** - Cached daily statistics
- **user_preferences** - Notification settings per user

## 🔔 Notification Setup

### Browser Notifications
Automatically enabled. Browser will prompt for permission on first use.

### Email Notifications (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Add to `server/.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

### SMS Notifications (Twilio)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your credentials from Twilio Console
3. Add to `server/.env`:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Tasks
- `GET /api/tasks?date=YYYY-MM-DD` - Get tasks for date
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/complete` - Mark task complete
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle-recurring` - Activate/deactivate recurring task

### Analytics
- `GET /api/tasks/summary/today` - Today's summary
- `GET /api/tasks/analytics/progress?days=30` - Progress data

### User
- `GET /api/user/preferences` - Get notification preferences
- `PUT /api/user/preferences` - Update preferences
- `GET /api/activities/locations` - Get login locations for globe

### Notifications
- `GET /api/user/notifications` - Get user notifications
- `POST /api/user/notifications/:id/read` - Mark as read

## 🔌 Socket.IO Events

### Client → Server
- `join_user` - Join user-specific room

### Server → Client
- `task_created` - New task added
- `task_updated` - Task modified
- `task_completed` - Task marked complete
- `task_deleted` - Task removed
- `task_reminder` - Reminder notification
- `new_notification` - New in-app notification

## 🎨 Theme Customization

The app uses Tailwind CSS with custom gradients and themes.

**Gradients** are defined in `client/src/gradients.css`

**Dark/Light mode** toggles dynamically and persists in localStorage.

## 🛠️ Development

### Available Scripts

**Root:**
- `npm run dev` - Start both client and server
- `npm run build` - Build frontend for production

**Client:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Server:**
- `npm start` - Start Express server
- `npm run dev` - Start with nodemon (auto-restart)

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

**CORS errors:**
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check `allowedOrigins` in `server/index.js`

**Socket.IO not connecting:**
- Verify frontend `VITE_API_URL` matches backend URL
- Check browser console for WebSocket errors
- Ensure backend CORS allows your frontend origin

**Database locked:**
- Stop all running server instances
- Delete `server/activity_tracker.sqlite` and restart server (fresh DB)

**Email/SMS not sending:**
- Verify credentials in `.env`
- Check Twilio account balance
- Review server logs for specific errors

## 📝 License

MIT License - feel free to use this project for learning or production.

## 👤 Author

Built with ❤️ by [Your Name]

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Tailwind CSS for styling
- Vercel for frontend hosting
- Render for backend hosting
- Three.js community for 3D libraries
- Recharts for visualization components
#   a c t i v i t y - t r a c k e r  
 
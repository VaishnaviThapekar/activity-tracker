# Activity Tracker

A full-stack task management application with real-time notifications, analytics, and interactive visualizations. Track your daily activities, set reminders, and visualize your productivity with beautiful 3D globe and charts.

## ✨ Features

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
- **Backend API**: [https://activity-tracker-api-fm7d.onrender.com](https://activity-tracker-api-fm7d.onrender.com)

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
git clone https://github.com/VaishnaviThapekar/activity-tracker.git
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

Create `server/.env` file:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-key-here-min-32-chars
FRONTEND_URL=https://activity-tracker-gold.vercel.app
```

See `server/.env.example` for all available options.

### Frontend Environment Variables

On Vercel, set in Project Settings → Environment Variables:

```
VITE_API_URL=https://activity-tracker-api-fm7d.onrender.com
```

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect GitHub to Vercel
3. Select `activity-tracker` repository
4. Build settings auto-configured
5. Set environment variable `VITE_API_URL` to backend URL
6. Deploy!

**Live URL**: [https://activity-tracker-gold.vercel.app](https://activity-tracker-gold.vercel.app)

### Backend Deployment (Render)

The project includes `render.yaml` for easy deployment:

1. Go to [render.com](https://render.com)
2. Create new Blueprint from GitHub repository
3. Connect your GitHub account
4. Select `activity-tracker` repository
5. Choose `main` branch
6. Render auto-detects `render.yaml`
7. Configure environment variables (JWT_SECRET auto-generates)
8. Deploy!

**Live URL**: [https://activity-tracker-api-fm7d.onrender.com](https://activity-tracker-api-fm7d.onrender.com)

## 📚 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securepassword123"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securepassword123"
}
```

Response includes JWT token for future requests.

### Tasks Endpoints

#### Get All Tasks
```
GET /api/tasks?date=2024-02-25
Headers: Authorization: Bearer <JWT_TOKEN>
```

#### Create Task
```
POST /api/tasks
Headers: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Morning Meeting",
  "description": "Team standup",
  "scheduled_time": "09:00",
  "duration_minutes": 30,
  "task_date": "2024-02-25",
  "is_recurring": false
}
```

#### Update Task
```
PUT /api/tasks/:id
Headers: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Complete Task
```
PATCH /api/tasks/:id/complete
Headers: Authorization: Bearer <JWT_TOKEN>
```

#### Delete Task
```
DELETE /api/tasks/:id
Headers: Authorization: Bearer <JWT_TOKEN>
```

### User Preferences

#### Get Preferences
```
GET /api/user/preferences
Headers: Authorization: Bearer <JWT_TOKEN>
```

#### Update Preferences
```
PUT /api/user/preferences
Headers: Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "enable_email_notif": true,
  "enable_sms_notif": false,
  "enable_browser_notif": true,
  "reminder_before_minutes": 15
}
```

### Analytics

#### Get Progress Analytics
```
GET /api/tasks/analytics/progress?days=7
Headers: Authorization: Bearer <JWT_TOKEN>
```

#### Get Activity Locations
```
GET /api/activities/locations
Headers: Authorization: Bearer <JWT_TOKEN>
```

## 🔌 Socket.IO Events

### Client Events (Emit)
- `join_user` - Connect to server with user ID

### Server Events (Listen)
- `task_created` - New task created
- `task_updated` - Task updated
- `task_completed` - Task marked complete
- `task_deleted` - Task deleted
- `notification` - General notifications received

## 🐛 Troubleshooting

### Frontend Cannot Reach Backend

**Issue**: API calls fail with 404 or CORS errors

**Solutions**:
1. Verify `VITE_API_URL` environment variable is set in Vercel
2. Check backend is running on Render dashboard
3. Ensure backend URL matches exactly (no trailing slash)
4. Check browser console for specific error messages
5. Verify JWT token is being sent in Authorization header

### Backend Not Starting Locally

**Issue**: Port already in use or dependencies missing

**Solutions**:
1. Run `npm install` in server directory
2. Create `.env` file with `PORT=3001`
3. Kill process on port 3001: `lsof -ti:3001 | xargs kill -9`
4. Check Node.js version: `node --version` (requires 18+)

### Socket.IO Connection Issues

**Issue**: Real-time updates not working

**Solutions**:
1. Verify backend Socket.IO CORS includes frontend URL
2. Check browser console for WebSocket connection errors
3. Ensure JWT token is valid (not expired)
4. Try opening browser DevTools → Network → WS tab to see connections

### Database Errors

**Issue**: SQLite database not found or schema errors

**Solutions**:
1. Database auto-creates on first run - wait for "Database tables initialized"
2. Check server logs for initialization messages
3. Delete `server/activity_tracker.sqlite` and restart to reset
4. Verify write permissions in server directory

## 🔒 Security Notes

- JWT tokens expire after 1 hour
- Passwords are hashed with bcrypt (10 salt rounds)
- Socket.IO configured with CORS whitelist
- Environment variables contain sensitive data - never commit `.env` files
- Use strong JWT_SECRET in production (minimum 32 characters)
- All API endpoints require valid JWT authentication

## 📄 Project Structure

```
activity-tracker/
├── README.md                 # This file
├── render.yaml              # Render deployment blueprint
├── vercel.json             # Vercel deployment config
├── package.json            # Root package config
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Styles
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite build config
│   └── index.html         # HTML template
│
└── server/                # Node.js backend
    ├── index.js           # Express app & API routes
    ├── database.js        # SQLite setup & queries
    ├── emailService.js    # Email notifications
    ├── smsService.js      # SMS notifications
    ├── reminderService.js # Task reminders & cron jobs
    ├── recurringTaskService.js # Recurring task generation
    ├── package.json       # Backend dependencies
    └── .env.example       # Environment variables template
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 💬 Support

For issues and questions:
- Open an issue on GitHub: [GitHub Issues](https://github.com/VaishnaviThapekar/activity-tracker/issues)
- Check existing issues for solutions
- Provide detailed error messages and logs when reporting issues

## 🎉 Acknowledgments

- React, Vite, Tailwind CSS, and all amazing open-source libraries
- Render for free backend hosting
- Vercel for frontend deployment
- GitHub for version control

---

**Status**: ✅ Fully Deployed and Production Ready

- Frontend: Live on Vercel
- Backend: Live on Render  
- Real-time: Socket.IO Connected
- Database: SQLite Active

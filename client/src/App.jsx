import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bell, Shield, Smartphone, User, Moon, Sun, Activity, LogOut, Monitor, CheckSquare, Settings, TrendingUp } from 'lucide-react';

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Three.js Components
import Globe3D from '@/components/Globe3D';
import ParticlesBackground from '@/components/ParticlesBackground';

// Task Components
import TaskManager from '@/components/TaskManager';
import UserSettings from '@/components/UserSettings';
import LiveClock from '@/components/LiveClock';
import ProgressCharts from '@/components/ProgressCharts';
import { SplineSceneActivity } from '@/components/SplineDemo';
import { GlowingFeatureGrid } from '@/components/GlowingDemo';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";



const socket = io(API_URL, {
    transports: ["websocket"],
    withCredentials: true
});




// --- Login Component ---

function Login({ onLogin, isDarkMode, toggleTheme }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const endpoint = isRegistering
            ? '/api/auth/register'
            : '/api/auth/login';

        // const endpoint = isRegistering ? '/auth/register' : '/auth/login';

        try {
            const res = await axios.post(`${API_URL}${endpoint}`, { username, password });

            if (isRegistering) {
                setSuccess('Registration successful! Please sign in.');
                setIsRegistering(false);
                setPassword('');
            } else {
                onLogin(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || (isRegistering ? 'Registration failed' : 'Login failed'));
        } finally {
            // Clear both fields after every submission
            setUsername('');
            setPassword('');
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background transition-colors duration-200">
            {/* 3D Background */}
            <ParticlesBackground />

            <div className="absolute top-4 right-4 z-20">
                <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
                    {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
                </Button>
            </div>

            <Card className="z-10 w-full max-w-md border-opacity-50 shadow-2xl backdrop-blur-sm bg-card/90 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        Activity Tracker
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isRegistering ? "Create a new account" : "Enter your credentials to access the secure dashboard"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 animate-in fade-in slide-in-from-top-2 duration-300">{error}</div>}
                    {success && <div className="bg-green-500/15 text-green-600 text-sm p-3 rounded-md mb-4 animate-in fade-in slide-in-from-top-2 duration-300">{success}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: '100ms' }}>
                            <Input
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                className="transition-all duration-200 focus:scale-[1.01]"
                            />
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: '200ms' }}>
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="transition-all duration-200 focus:scale-[1.01]"
                            />
                        </div>
                        <Button type="submit" className="w-full transition-all duration-200 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '300ms' }}>{isRegistering ? 'Sign Up' : 'Sign In'}</Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center flex-col gap-2">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                            setSuccess('');
                            setUsername('');
                            setPassword('');
                        }}
                        className="text-sm text-primary hover:underline transition-all duration-300 hover:scale-105"
                    >
                        {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">Secure System Access</p>
                </CardFooter>
            </Card>
        </div>
    );
}

// --- Dashboard Component ---

function Dashboard({ user, token, onLogout, isDarkMode, toggleTheme }) {
    const [activities, setActivities] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({ daily: [], browser: [] });
    const [activeTab, setActiveTab] = useState('tasks'); // 'activity', 'tasks', 'settings'
    const [notificationPermission, setNotificationPermission] = useState('default');

    useEffect(() => {
        socket.emit('join_user', user.id);

        socket.on('new_activity', (newLog) => {
            setActivities(prev => [newLog, ...prev]);
        });

        socket.on('new_notification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
        });

        // Task reminder handler with browser notification
        socket.on('task_reminder', (reminder) => {
            setNotifications(prev => [{
                id: Date.now(),
                user_id: user.id,
                message: reminder.message,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                is_read: 0,
                type: 'task_reminder'
            }, ...prev]);

            // Show browser notification
            showBrowserNotification(reminder);
        });

        return () => {
            socket.off('new_activity');
            socket.off('new_notification');
            socket.off('task_reminder');
        };
    }, [user.id]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
            });
        }
    }, []);

    const showBrowserNotification = (reminder) => {
        if (notificationPermission === 'granted') {
            new Notification('Task Reminder', {
                body: reminder.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `task-${reminder.task_id}`,
                requireInteraction: true
            });
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    useEffect(() => {
        calculateStats();
    }, [activities]);

    const fetchData = async () => {
        try {
            const [actRes, notifRes] = await Promise.all([
                axios.get(`${API_URL}/api/user/activity`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/user/notifications`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setActivities(actRes.data);
            setNotifications(notifRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const calculateStats = () => {
        const last7Days = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days[d.toISOString().split('T')[0]] = 0;
        }

        activities.forEach(act => {
            const date = act.timestamp.split(' ')[0];
            if (last7Days.hasOwnProperty(date)) {
                last7Days[date]++;
            }
        });

        const dailyData = Object.keys(last7Days).sort().map(date => ({
            date: date.slice(5),
            logins: last7Days[date]
        }));

        const browsers = {};
        activities.forEach(act => {
            const browserName = act.device_info.split(' on ')[0] || 'Unknown';
            browsers[browserName] = (browsers[browserName] || 0) + 1;
        });

        const browserData = Object.keys(browsers).map(b => ({
            name: b,
            value: browsers[b]
        }));

        setStats({ daily: dailyData, browser: browserData });
    };

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border text-popover-foreground p-2 rounded shadow-sm text-sm">
                    <p className="font-semibold">{`${label} : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Activity<span className="text-primary">Tracker</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <LiveClock />
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4" /> {user.username}
                        </div>
                        <Button variant="destructive" size="sm" onClick={onLogout} className="gap-2">
                            <LogOut className="h-4 w-4" /> Sign Out
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-7xl mx-auto px-4 border-t">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${activeTab === 'activity'
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Activity className="h-4 w-4" />
                            Activity Tracker
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${activeTab === 'tasks'
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <CheckSquare className="h-4 w-4" />
                            Daily Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${activeTab === 'settings'
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('progress')}
                            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${activeTab === 'progress'
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Progress
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Conditional Based on Active Tab */}
            {activeTab === 'tasks' && (
                <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
                    {/* 3D Interactive Showcase */}
                    <div className="mb-8">
                        <SplineSceneActivity />
                    </div>

                    {/* Glowing Feature Grid */}
                    <div className="mb-8">
                        <GlowingFeatureGrid />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Task Area - 2 columns */}
                        <div className="lg:col-span-2">
                            <TaskManager token={token} onTaskUpdate={() => setActiveTab('tasks')} socket={socket} />
                        </div>
                        {/* Live Progress Sidebar - 1 column */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Live Progress
                                        </span>
                                        <button
                                            onClick={() => setActiveTab('progress')}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            View Full Analytics →
                                        </button>
                                    </CardTitle>
                                    <CardDescription className="text-xs">Updates in real-time</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ProgressCharts token={token} compact={true} socket={socket} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            )}

            {activeTab === 'settings' && (
                <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
                    <UserSettings token={token} />
                </main>
            )}

            {activeTab === 'progress' && (
                <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
                    <ProgressCharts token={token} socket={socket} />
                </main>
            )}

            {activeTab === 'activity' && (
                <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Top Row: KPIs and 3D Globe */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activities.length}</div>
                                    <p className="text-xs text-muted-foreground">All time activity</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Last Login</CardTitle>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm font-bold truncate">{activities[0]?.timestamp || 'N/A'}</div>
                                    <p className="text-xs text-muted-foreground">Most recent activity</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                                    <Monitor className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.browser.length}</div>
                                    <p className="text-xs text-muted-foreground">Unique sources</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 3D Globe Section */}
                        <Card className="overflow-hidden border-primary/20 bg-slate-950/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Global Threat Map</CardTitle>
                                <CardDescription>Real-time visualization of login origins</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 h-[300px] relative">
                                <Globe3D token={token} />
                                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur px-3 py-1 rounded text-xs font-mono border">
                                    LIVE DATA FEED :: CONNECTED
                                </div>
                            </CardContent>
                        </Card>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Login Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.daily}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="logins" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Device Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.browser}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.browser.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {activities.map((act) => (
                                        <div key={act.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                                <div>
                                                    <p className="text-sm font-medium">{act.device_info}</p>
                                                    <p className="text-xs text-muted-foreground">{act.ip_address}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground">{act.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Mobile View */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                                <Smartphone className="w-5 h-5" /> Mobile Notification Access
                            </h3>

                            {/* Phone Mockup */}
                            <div className="mx-auto border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[650px] w-[320px] shadow-2xl overflow-hidden relative ring-1 ring-gray-950/50">
                                <div className="h-[32px] bg-gray-800 absolute top-0 left-[50%] -translate-x-1/2 w-[120px] rounded-b-[1rem] z-20"></div>

                                <div className={`h-full w-full pt-12 px-4 pb-6 overflow-y-auto hide-scrollbar ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                                    {/* Mobile Status Bar Mock */}
                                    <div className="flex justify-between items-center mb-6 px-2 opacity-50">
                                        <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>9:41</span>
                                        <div className="flex gap-1">
                                            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                                            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
                                        </div>
                                    </div>

                                    <h4 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h4>

                                    <div className="space-y-3">
                                        {notifications.map((notif) => (
                                            <div key={notif.id}
                                                className={`p-4 rounded-2xl shadow-sm border-l-4 transition-all hover:scale-[1.02] cursor-pointer
                                        ${notif.type === 'security_alert'
                                                        ? 'bg-red-500/10 border-red-500'
                                                        : (isDarkMode ? 'bg-slate-900 border-blue-500' : 'bg-white border-blue-500')}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {notif.type === 'security_alert'
                                                            ? <Shield className="w-4 h-4 text-red-500" />
                                                            : <Bell className="w-4 h-4 text-blue-500" />
                                                        }
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tracker</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{notif.timestamp.split(' ')[1].slice(0, 5)}</span>
                                                </div>
                                                <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    {notif.message}
                                                </p>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                                <Bell className="w-8 h-8 mb-2 opacity-20" />
                                                <span className="text-sm">No new notifications</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}

function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const handleLogin = (data) => {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <div>
            {!user
                ? <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                : <Dashboard user={user} token={token} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            }
        </div>
    );
}

export default App;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ProgressCharts({ token, compact = false, socket }) {
    const [analytics, setAnalytics] = useState({ daily: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(compact ? 7 : 30); // Shorter range for compact view

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    // Real-time updates via Socket.IO
    useEffect(() => {
        if (socket) {
            const handleTaskUpdate = () => {
                fetchAnalytics(); // Refresh charts on any task change
            };

            socket.on('task_created', handleTaskUpdate);
            socket.on('task_completed', handleTaskUpdate);
            socket.on('task_deleted', handleTaskUpdate);
            socket.on('task_updated', handleTaskUpdate);

            return () => {
                socket.off('task_created', handleTaskUpdate);
                socket.off('task_completed', handleTaskUpdate);
                socket.off('task_deleted', handleTaskUpdate);
                socket.off('task_updated', handleTaskUpdate);
            };
        }
    }, [socket]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/tasks/analytics/progress?days=${timeRange}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Analytics data:', res.data);
            setAnalytics(res.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setAnalytics({ daily: [], summary: {} });
        } finally {
            setLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">
                        {new Date(payload[0].payload.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                            {entry.name.includes('Rate') ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>;
    }

    // Compact Mode for Sidebar
    if (compact) {
        return (
            <div className="space-y-3">
                {/* Mini Summary */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Completed</div>
                        <div className="text-xl font-bold text-green-600">{analytics.summary.completed || 0}</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Rate</div>
                        <div className="text-xl font-bold text-primary">{analytics.summary.overall_completion_rate || 0}%</div>
                    </div>
                </div>

                {/* Mini Chart */}
                {analytics.daily && analytics.daily.length > 0 && (
                    <div className="h-[120px] bg-muted/30 rounded-lg p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.daily}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    hide
                                />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#4F46E5', strokeWidth: 1 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completion_rate"
                                    stroke="#4F46E5"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                        <span>Total Tasks:</span>
                        <span className="font-medium">{analytics.summary.total_tasks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Days Tracked:</span>
                        <span className="font-medium">{analytics.summary.days_tracked || 0}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Full Mode (original layout)
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Days Tracked
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.summary.days_tracked || 0}</div>
                        <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Total Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{analytics.summary.completed || 0}</div>
                        <p className="text-xs text-muted-foreground">Out of {analytics.summary.total_tasks || 0} tasks</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Completion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{analytics.summary.overall_completion_rate || 0}%</div>
                        <p className="text-xs text-muted-foreground">Average</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Time Range</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md bg-background"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </CardContent>
                </Card>
            </div>

            {/* Completion Rate Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Completion Rate Trend
                    </CardTitle>
                    <CardDescription>Daily completion percentage over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.daily}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tickLine={false}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    domain={[0, 100]}
                                    label={{ value: 'Completion %', angle: -90, position: 'insideLeft', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="completion_rate"
                                    stroke="#4F46E5"
                                    strokeWidth={2}
                                    dot={{ fill: '#4F46E5', r: 4 }}
                                    name="Completion Rate (%)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Task Status Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Task Status Breakdown
                    </CardTitle>
                    <CardDescription>Completed vs Missed vs Pending over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.daily}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tickLine={false}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis fontSize={12} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="missed" fill="#EF4444" name="Missed" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Plus, Trash2, Edit2, CheckCircle2, Circle, X, TrendingUp, Timer } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TaskManager({ token, onTaskUpdate, socket }) {
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [summary, setSummary] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        missed: 0,
        completion_rate: 0
    });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduled_time: '',
        duration_minutes: 30,
        task_date: selectedDate,
        is_recurring: false,
        recurrence_pattern: 'daily'
    });

    useEffect(() => {
        fetchTasks();
        fetchSummary();
    }, [selectedDate]);

    useEffect(() => {
        if (socket) {
            socket.on('task_created', (task) => {
                if (task.task_date === selectedDate) {
                    setTasks(prev => [...prev, task].sort((a, b) =>
                        (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
                    ));
                    fetchSummary();
                }
            });

            socket.on('task_completed', (task) => {
                setTasks(prev => prev.map(t => t.id === task.id ? task : t));
                fetchSummary();
            });

            socket.on('task_updated', (task) => {
                setTasks(prev => prev.map(t => t.id === task.id ? task : t));
            });

            socket.on('task_deleted', ({ id }) => {
                setTasks(prev => prev.filter(t => t.id !== id));
                fetchSummary();
            });

            return () => {
                socket.off('task_created');
                socket.off('task_completed');
                socket.off('task_updated');
                socket.off('task_deleted');
            };
        }
    }, [socket, selectedDate]);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/tasks?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/tasks/summary/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                ...formData,
                task_date: selectedDate,
                duration_minutes: parseInt(formData.duration_minutes) || 30,
                is_recurring: formData.is_recurring ? 1 : 0
            };
            if (editingTask) {
                await axios.put(`${API_URL}/api/tasks/${editingTask.id}`, taskData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/tasks`, taskData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setFormData({ title: '', description: '', scheduled_time: '', duration_minutes: 30, task_date: selectedDate, is_recurring: false, recurrence_pattern: 'daily' });
            setShowTaskForm(false);
            setEditingTask(null);
            fetchTasks();
        } catch (error) {
            console.error('Failed to save task:', error);
        }
    };

    const handleComplete = async (taskId) => {
        try {
            await axios.patch(`${API_URL}/api/tasks/${taskId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const handleDelete = async (taskId) => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const handleEdit = (task) => {
        setFormData({
            title: task.title,
            description: task.description || '',
            scheduled_time: task.scheduled_time || '',
            duration_minutes: task.duration_minutes || 30,
            task_date: task.task_date,
            is_recurring: task.is_recurring === 1,
            recurrence_pattern: task.recurrence_pattern || 'daily'
        });
        setEditingTask(task);
        setShowTaskForm(true);
    };

    const handleToggleRecurring = async (taskId, currentStatus) => {
        try {
            await axios.patch(`${API_URL}/api/tasks/${taskId}/toggle-recurring`,
                { is_active: currentStatus === 1 ? 0 : 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTasks();
        } catch (error) {
            console.error('Failed to toggle recurring task:', error);
        }
    };

    const getStatusIcon = (task) => {
        if (task.status === 'completed') {
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        } else if (task.status === 'missed') {
            return <X className="h-5 w-5 text-red-500" />;
        } else {
            return <Circle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getTimeStatus = (task) => {
        if (task.status === 'completed') return 'completed';
        if (task.status === 'missed') return 'missed';

        const now = new Date();
        const today = new Date().toISOString().split('T')[0];

        if (task.task_date < today) return 'missed';
        if (task.task_date > today) return 'future';

        if (task.scheduled_time) {
            const [hours, minutes] = task.scheduled_time.split(':');
            const taskTime = new Date();
            taskTime.setHours(parseInt(hours), parseInt(minutes), 0);

            if (now > taskTime) return 'overdue';
        }

        return 'pending';
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h`;
        return `${mins}m`;
    };

    const calculateEndTime = (startTime, durationMinutes) => {
        if (!startTime || !durationMinutes) return null;
        const [hours, minutes] = startTime.split(':');
        const start = new Date();
        start.setHours(parseInt(hours), parseInt(minutes), 0);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        return end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Prepare data for pie chart
    const pieData = [
        { name: 'Completed', value: summary.completed, color: '#10B981' },
        { name: 'Pending', value: summary.pending, color: '#F59E0B' },
        { name: 'Missed', value: summary.missed, color: '#EF4444' }
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.completion_rate}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Visualization */}
            {summary.total > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Today's Progress
                        </CardTitle>
                        <CardDescription>Visual breakdown of your task completion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={70}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Progress Bars */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-green-600 font-medium">Completed</span>
                                        <span>{summary.completed}/{summary.total}</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${summary.total > 0 ? (summary.completed / summary.total * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-yellow-600 font-medium">Pending</span>
                                        <span>{summary.pending}/{summary.total}</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 transition-all duration-500"
                                            style={{ width: `${summary.total > 0 ? (summary.pending / summary.total * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-red-600 font-medium">Missed</span>
                                        <span>{summary.missed}/{summary.total}</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all duration-500"
                                            style={{ width: `${summary.total > 0 ? (summary.missed / summary.total * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">{summary.completion_rate}%</div>
                                        <div className="text-sm text-muted-foreground">Overall Completion Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Header with Date Picker */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Daily Tasks
                            </CardTitle>
                            <CardDescription>Manage your tasks for {selectedDate}</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-auto"
                            />
                            <Button onClick={() => setShowTaskForm(!showTaskForm)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Task
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Task Form */}
                {showTaskForm && (
                    <CardContent className="border-t pt-6">
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Task title *"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Input
                                    placeholder="Description (optional)"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="time"
                                    value={formData.scheduled_time}
                                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                                    className="w-auto"
                                />
                                <span className="text-sm text-muted-foreground">(optional)</span>
                            </div>

                            {/* Duration Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Timer className="h-4 w-4" />
                                    Estimated Duration
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="23"
                                            value={Math.floor((formData.duration_minutes || 0) / 60)}
                                            onChange={(e) => {
                                                const hours = parseInt(e.target.value) || 0;
                                                const minutes = (formData.duration_minutes || 0) % 60;
                                                setFormData({ ...formData, duration_minutes: hours * 60 + minutes });
                                            }}
                                            className="w-20"
                                        />
                                        <span className="text-sm">hours</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="59"
                                            step="5"
                                            value={(formData.duration_minutes || 0) % 60}
                                            onChange={(e) => {
                                                const hours = Math.floor((formData.duration_minutes || 0) / 60);
                                                const minutes = parseInt(e.target.value) || 0;
                                                setFormData({ ...formData, duration_minutes: hours * 60 + minutes });
                                            }}
                                            className="w-20"
                                        />
                                        <span className="text-sm">min</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_recurring"
                                        checked={formData.is_recurring}
                                        onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <label htmlFor="is_recurring" className="text-sm font-medium">
                                        Make this a recurring task (auto-creates for multiple days)
                                    </label>
                                </div>
                                {formData.is_recurring && (
                                    <div className="ml-6 space-y-2">
                                        <label className="text-sm text-muted-foreground">Recurrence Pattern:</label>
                                        <select
                                            value={formData.recurrence_pattern}
                                            onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                                            className="w-full p-2 border rounded-md bg-background"
                                        >
                                            <option value="daily">Daily (every day)</option>
                                            <option value="weekdays">Weekdays (Mon-Fri)</option>
                                            <option value="weekends">Weekends (Sat-Sun)</option>
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            This task will automatically appear on scheduled days for the next week
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">{editingTask ? 'Update' : 'Create'} Task</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowTaskForm(false);
                                        setEditingTask(null);
                                        setFormData({ title: '', description: '', scheduled_time: '', duration_minutes: 30, task_date: selectedDate, is_recurring: false, recurrence_pattern: 'daily' });
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                )}

                {/* Tasks List */}
                <CardContent className={showTaskForm ? 'border-t pt-6' : ''}>
                    {tasks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No tasks for this date. Click "Add Task" to create one!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => {
                                const status = getTimeStatus(task);
                                const endTime = task.scheduled_time && task.duration_minutes
                                    ? calculateEndTime(task.scheduled_time, task.duration_minutes)
                                    : null;

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${status === 'completed'
                                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                                            : status === 'missed'
                                                ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                                                : status === 'overdue'
                                                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                                                    : 'bg-card border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <button
                                            onClick={() => task.status !== 'completed' && handleComplete(task.id)}
                                            disabled={task.status === 'completed'}
                                            className="mt-0.5"
                                        >
                                            {getStatusIcon(task)}
                                        </button>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.title}
                                                </h4>
                                                {task.is_recurring === 1 && task.parent_task_id === null && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                                        🔁 Recurring
                                                    </span>
                                                )}
                                                {task.duration_minutes && (
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                        <Timer className="h-3 w-3" />
                                                        {formatDuration(task.duration_minutes)}
                                                    </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                {task.scheduled_time && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {task.scheduled_time}
                                                        {endTime && ` → ${endTime}`}
                                                    </span>
                                                )}
                                                {task.completed_at && (
                                                    <span className="text-green-600">
                                                        Completed: {new Date(task.completed_at).toLocaleTimeString()}
                                                    </span>
                                                )}
                                                {task.is_recurring === 1 && task.parent_task_id === null && (
                                                    <label className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={task.is_active === 1}
                                                            onChange={() => handleToggleRecurring(task.id, task.is_active)}
                                                            className="w-3 h-3"
                                                        />
                                                        <span className={task.is_active === 1 ? 'text-green-600' : 'text-red-600'}>
                                                            {task.is_active === 1 ? 'ON' : 'OFF'}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(task)}
                                                disabled={task.status === 'completed'}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Mail, Smartphone, Clock, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function UserSettings({ token }) {
    const [preferences, setPreferences] = useState({
        email: '',
        phone_number: '',
        enable_browser_notif: 1,
        enable_email_notif: 0,
        enable_sms_notif: 0,
        reminder_before_minutes: 15,
        reminder_interval_minutes: 10
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/user/preferences`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPreferences(res.data);
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        try {
            await axios.put(`${API_URL}/api/user/preferences`, preferences, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (field) => {
        setPreferences(prev => ({
            ...prev,
            [field]: prev[field] ? 0 : 1
        }));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Configure how and when you receive task reminders
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Notification Channels */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Notification Channels</h3>

                            {/* Browser Notifications */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">Browser Notifications</p>
                                        <p className="text-sm text-muted-foreground">Get notified in your browser</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle('enable_browser_notif')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.enable_browser_notif
                                            ? 'bg-primary'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.enable_browser_notif ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Email Notifications */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3 flex-grow">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                    <div className="flex-grow">
                                        <p className="font-medium">Email Notifications</p>
                                        <Input
                                            type="email"
                                            placeholder="your-email@example.com"
                                            value={preferences.email || ''}
                                            onChange={(e) => setPreferences({ ...preferences, email: e.target.value })}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle('enable_email_notif')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 ${preferences.enable_email_notif
                                            ? 'bg-primary'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.enable_email_notif ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* SMS Notifications */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3 flex-grow">
                                    <Smartphone className="h-5 w-5 text-green-500" />
                                    <div className="flex-grow">
                                        <p className="font-medium">SMS Notifications</p>
                                        <Input
                                            type="tel"
                                            placeholder="+1234567890 (E.164 format)"
                                            value={preferences.phone_number || ''}
                                            onChange={(e) => setPreferences({ ...preferences, phone_number: e.target.value })}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Use international format (e.g., +1234567890)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle('enable_sms_notif')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 ${preferences.enable_sms_notif
                                            ? 'bg-primary'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.enable_sms_notif ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Reminder Timing */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Reminder Timing
                            </h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Remind me before task starts
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={preferences.reminder_before_minutes}
                                        onChange={(e) => setPreferences({
                                            ...preferences,
                                            reminder_before_minutes: parseInt(e.target.value)
                                        })}
                                        className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">minutes before</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Reminder interval for overdue tasks
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="5"
                                        max="60"
                                        value={preferences.reminder_interval_minutes}
                                        onChange={(e) => setPreferences({
                                            ...preferences,
                                            reminder_interval_minutes: parseInt(e.target.value)
                                        })}
                                        className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">minutes</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    How often to remind you about incomplete tasks after their scheduled time
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-2 pt-4">
                            <Button type="submit" disabled={loading} className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                {loading ? 'Saving...' : 'Save Preferences'}
                            </Button>
                            {saved && (
                                <span className="text-sm text-green-600 font-medium">
                                    ✓ Saved successfully!
                                </span>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p className="font-medium mb-1">📧 Email Notifications</p>
                        <p className="text-muted-foreground">
                            Server admin must configure EMAIL_USER and EMAIL_PASSWORD environment variables with Gmail app password.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">📱 SMS Notifications</p>
                        <p className="text-muted-foreground">
                            Server admin must configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.
                        </p>
                    </div>
                    <div>
                        <p className="font-medium mb-1">🔔 Browser Notifications</p>
                        <p className="text-muted-foreground">
                            Allow notifications when prompted by your browser for best experience.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

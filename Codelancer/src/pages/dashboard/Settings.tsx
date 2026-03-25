
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    Shield,
    Moon,
    Trash2,
    Save,
    CheckCircle,
    Smartphone,
    Mail,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

const Settings = () => {
    const { userProfile } = useAuth();
    const { theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState({
        emailProjects: true,
        emailOpps: true,
        pushMessages: true,
        pushReminders: false
    });

    // Security State
    const [twoFactor, setTwoFactor] = useState(false);

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success('Notification preferences updated');
    };

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            toast.success('Password updated successfully');
        }, 1500);
    };

    return (
        <DashboardLayout role={userProfile?.role || 'developer'}>
            <div className="space-y-8 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </motion.div>

                <Tabs defaultValue="notifications" className="space-y-6">
                    <TabsList className="bg-card border border-border p-1 rounded-xl">
                        <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Appearance
                        </TabsTrigger>
                        <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Account
                        </TabsTrigger>
                    </TabsList>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid gap-6"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-primary" />
                                        Email Notifications
                                    </CardTitle>
                                    <CardDescription>Choose what updates you want to receive via email.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">New Projects</Label>
                                            <p className="text-sm text-muted-foreground">Get notified when new projects match your skills</p>
                                        </div>
                                        <Switch
                                            checked={notifications.emailProjects}
                                            onCheckedChange={() => handleNotificationChange('emailProjects')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Job Opportunities</Label>
                                            <p className="text-sm text-muted-foreground">Receive updates about relevant job opportunities</p>
                                        </div>
                                        <Switch
                                            checked={notifications.emailOpps}
                                            onCheckedChange={() => handleNotificationChange('emailOpps')}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Smartphone className="h-5 w-5 text-primary" />
                                        Push Notifications
                                    </CardTitle>
                                    <CardDescription>Manage notifications sent to your device.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Direct Messages</Label>
                                            <p className="text-sm text-muted-foreground">Get notified when you receive a new message</p>
                                        </div>
                                        <Switch
                                            checked={notifications.pushMessages}
                                            onCheckedChange={() => handleNotificationChange('pushMessages')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Project Reminders</Label>
                                            <p className="text-sm text-muted-foreground">Receive reminders about upcoming deadlines</p>
                                        </div>
                                        <Switch
                                            checked={notifications.pushReminders}
                                            onCheckedChange={() => handleNotificationChange('pushReminders')}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid gap-6"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-primary" />
                                        Change Password
                                    </CardTitle>
                                    <CardDescription>Update your password to keep your account secure.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSavePassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current">Current Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="current"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="new"
                                                    type={showNewPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Two-Factor Authentication
                                    </CardTitle>
                                    <CardDescription>Add an extra layer of security to your account.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Enable 2FA</Label>
                                            <p className="text-sm text-muted-foreground">Secure your account with two-factor authentication</p>
                                        </div>
                                        <Switch
                                            checked={twoFactor}
                                            onCheckedChange={setTwoFactor}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Moon className="h-5 w-5 text-primary" />
                                        Theme Preferences
                                    </CardTitle>
                                    <CardDescription>Customize how the application looks on your device.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 pt-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-border/80'
                                                }`}
                                        >
                                            <div className="w-full h-24 bg-[#ffffff] rounded-lg border border-gray-200 mb-3 shadow-sm flex items-center justify-center text-gray-900">
                                                Light
                                            </div>
                                            <span className="text-sm font-medium">Light</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-border/80'
                                                }`}
                                        >
                                            <div className="w-full h-24 bg-[#09090b] rounded-lg border border-gray-800 mb-3 shadow-sm flex items-center justify-center text-white">
                                                Dark
                                            </div>
                                            <span className="text-sm font-medium">Dark</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('system')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system'
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-border/80'
                                                }`}
                                        >
                                            <div className="w-full h-24 bg-gradient-to-r from-[#ffffff] to-[#09090b] rounded-lg border border-gray-200 mb-3 shadow-sm flex items-center justify-center text-gray-500 font-bold">
                                                Auto
                                            </div>
                                            <span className="text-sm font-medium">System</span>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Account Tab */}
                    <TabsContent value="account">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="border-destructive/20 bg-destructive/5">
                                <CardHeader>
                                    <CardTitle className="text-destructive flex items-center gap-2">
                                        <Trash2 className="h-5 w-5" />
                                        Danger Zone
                                    </CardTitle>
                                    <CardDescription className="text-destructive/80">
                                        Irreversible actions related to your account.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Delete Account</Label>
                                            <p className="text-sm text-foreground/60">Permanently delete your account and all data</p>
                                        </div>
                                        <Button variant="destructive">Delete Account</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Settings;

import { useState } from 'react';
import GlassCard from '../../../app/components/GlassCard';
import { Button } from '../../../app/components/ui/button';
import { Label } from '../../../app/components/ui/label';
import { Switch } from '../../../app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Shield, Database, Moon, Sun, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../../app/contexts/ThemeContext';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    appointmentReminders: true,
    systemUpdates: true,
    marketingEmails: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    allowAnalytics: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '90',
    sessionTimeout: '30',
  });

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handlePrivacyChange = (key) => {
    setPrivacy({ ...privacy, [key]: !privacy[key] });
  };

  const handleSystemChange = (key) => {
    setSystemSettings({ ...systemSettings, [key]: !systemSettings[key] });
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your application preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">General Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <div>
                    <Label className="text-gray-900 dark:text-white">Dark Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark theme</p>
                  </div>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="utc">UTC</option>
                  <option value="est">Eastern Time (ET)</option>
                  <option value="cst">Central Time (CT)</option>
                  <option value="mst">Mountain Time (MT)</option>
                  <option value="pst">Pacific Time (PT)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <select
                  id="dateFormat"
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                  <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="notifications">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notification Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Email Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <Switch checked={notifications.emailNotifications} onCheckedChange={() => handleNotificationChange('emailNotifications')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Push Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
                </div>
                <Switch checked={notifications.pushNotifications} onCheckedChange={() => handleNotificationChange('pushNotifications')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">SMS Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via SMS</p>
                </div>
                <Switch checked={notifications.smsNotifications} onCheckedChange={() => handleNotificationChange('smsNotifications')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Appointment Reminders</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get reminders for upcoming appointments</p>
                </div>
                <Switch checked={notifications.appointmentReminders} onCheckedChange={() => handleNotificationChange('appointmentReminders')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">System Updates</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications about system updates</p>
                </div>
                <Switch checked={notifications.systemUpdates} onCheckedChange={() => handleNotificationChange('systemUpdates')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Marketing Emails</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive marketing and promotional emails</p>
                </div>
                <Switch checked={notifications.marketingEmails} onCheckedChange={() => handleNotificationChange('marketingEmails')} />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="privacy">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Privacy & Security</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileVisibility">Profile Visibility</Label>
                <select
                  id="profileVisibility"
                  value={privacy.profileVisibility}
                  onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="team">Team Only</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Show Email Address</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Make your email visible to other users</p>
                </div>
                <Switch checked={privacy.showEmail} onCheckedChange={() => handlePrivacyChange('showEmail')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Show Phone Number</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Make your phone number visible to other users</p>
                </div>
                <Switch checked={privacy.showPhone} onCheckedChange={() => handlePrivacyChange('showPhone')} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Analytics Collection</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow collection of usage analytics</p>
                </div>
                <Switch checked={privacy.allowAnalytics} onCheckedChange={() => handlePrivacyChange('allowAnalytics')} />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="system">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Configuration</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">Automatic Backup</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable automatic data backups</p>
                </div>
                <Switch checked={systemSettings.autoBackup} onCheckedChange={() => handleSystemChange('autoBackup')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <select
                  id="backupFrequency"
                  value={systemSettings.backupFrequency}
                  onChange={(e) => setSystemSettings({ ...systemSettings, backupFrequency: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={!systemSettings.autoBackup}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <select
                  id="dataRetention"
                  value={systemSettings.dataRetention}
                  onChange={(e) => setSystemSettings({ ...systemSettings, dataRetention: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <select
                  id="sessionTimeout"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;


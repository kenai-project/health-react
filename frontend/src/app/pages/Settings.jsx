import { useState } from 'react';
import { Bell, Lock, Globe, Palette, Shield, Database, Save } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const Settings = () => {
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: true,
    weeklyReports: true,

    // Privacy
    profileVisibility: 'public',
    dataSharing: false,
    activityTracking: true,

    // Appearance
    language: 'en',
    timezone: 'UTC-5',
    dateFormat: 'MM/DD/YYYY',

    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    // Handle save logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application preferences</p>
      </div>

      {/* Notifications Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage how you receive notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div>
              <p className="text-gray-800 dark:text-white font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive notifications via email
              </p>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.emailNotifications
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div>
              <p className="text-gray-800 dark:text-white font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive push notifications on your device
              </p>
            </div>
            <button
              onClick={() => handleToggle('pushNotifications')}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.pushNotifications
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.pushNotifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div>
              <p className="text-gray-800 dark:text-white font-medium">SMS Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive notifications via SMS
              </p>
            </div>
            <button
              onClick={() => handleToggle('smsNotifications')}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.smsNotifications
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.smsNotifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div>
              <p className="text-gray-800 dark:text-white font-medium">Weekly Reports</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive weekly summary reports
              </p>
            </div>
            <button
              onClick={() => handleToggle('weeklyReports')}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.weeklyReports
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.weeklyReports ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Security Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Security</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your security preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div>
              <p className="text-gray-800 dark:text-white font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security
              </p>
            </div>
            <button
              onClick={() => handleToggle('twoFactorAuth')}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.twoFactorAuth
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.twoFactorAuth ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div className="mb-3">
              <p className="text-gray-800 dark:text-white font-medium">Session Timeout</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically log out after inactivity (minutes)
              </p>
            </div>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Appearance Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Appearance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize your display preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div className="mb-3">
              <p className="text-gray-800 dark:text-white font-medium">Language</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your preferred language
              </p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div className="mb-3">
              <p className="text-gray-800 dark:text-white font-medium">Timezone</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your timezone
              </p>
            </div>
            <select
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
            >
              <option value="UTC-5">UTC-5 (EST)</option>
              <option value="UTC-6">UTC-6 (CST)</option>
              <option value="UTC-7">UTC-7 (MST)</option>
              <option value="UTC-8">UTC-8 (PST)</option>
            </select>
          </div>

          <div className="p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all">
            <div className="mb-3">
              <p className="text-gray-800 dark:text-white font-medium">Date Format</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how dates are displayed
              </p>
            </div>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import GlassCard from '../components/GlassCard';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings as SettingsIcon, Bell, Shield, Database, Moon, Sun, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, language, languages, changeLanguage } = useLanguage();
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    appointmentReminders: true,
    systemUpdates: true,
    marketingEmails: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    allowAnalytics: true
  });

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '90',
    sessionTimeout: '30'
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
    toast.success(t('settings.saved'));
  };

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="privacy">{t('settings.privacy')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.system')}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('settings.generalSettings')}
              </h3>
            </div>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <div>
                    <Label className="text-gray-900 dark:text-white">{t('settings.darkMode')}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('settings.darkModeDesc')}
                    </p>
                  </div>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  {t('settings.language')}
                </Label>
                <select
                  id="language"
                  value={language}
                  onChange={handleLanguageChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {Object.entries(languages).map(([code, { label, flag }]) => (
                    <option key={code} value={code}>
                      {flag} {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('languagePopup.subtitle')}
                </p>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('settings.timezone')}</Label>
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

              {/* Date Format */}
              <div className="space-y-2">
                <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
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
                {t('common.save')}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('settings.notificationPrefs')}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.emailNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.emailNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.pushNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.pushNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={() => handleNotificationChange('pushNotifications')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.smsNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.smsNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={() => handleNotificationChange('smsNotifications')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.appointmentReminders')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.appointmentRemindersDesc')}
                  </p>
                </div>
                <Switch
                  checked={notifications.appointmentReminders}
                  onCheckedChange={() => handleNotificationChange('appointmentReminders')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.systemUpdates')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.systemUpdatesDesc')}
                  </p>
                </div>
                <Switch
                  checked={notifications.systemUpdates}
                  onCheckedChange={() => handleNotificationChange('systemUpdates')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.marketingEmails')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.marketingEmailsDesc')}
                  </p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={() => handleNotificationChange('marketingEmails')}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('settings.privacySecurity')}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileVisibility">{t('settings.profileVisibility')}</Label>
                <select
                  id="profileVisibility"
                  value={privacy.profileVisibility}
                  onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="public">{t('settings.visibilityPublic')}</option>
                  <option value="private">{t('settings.visibilityPrivate')}</option>
                  <option value="team">{t('settings.visibilityTeam')}</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.showEmail')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.showEmailDesc')}
                  </p>
                </div>
                <Switch
                  checked={privacy.showEmail}
                  onCheckedChange={() => handlePrivacyChange('showEmail')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.showPhone')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.showPhoneDesc')}
                  </p>
                </div>
                <Switch
                  checked={privacy.showPhone}
                  onCheckedChange={() => handlePrivacyChange('showPhone')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.analyticsCollection')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.analyticsCollectionDesc')}
                  </p>
                </div>
                <Switch
                  checked={privacy.allowAnalytics}
                  onCheckedChange={() => handlePrivacyChange('allowAnalytics')}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('settings.systemConfig')}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <Label className="text-gray-900 dark:text-white">{t('settings.autoBackup')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.autoBackupDesc')}
                  </p>
                </div>
                <Switch
                  checked={systemSettings.autoBackup}
                  onCheckedChange={() => handleSystemChange('autoBackup')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupFrequency">{t('settings.backupFrequency')}</Label>
                <select
                  id="backupFrequency"
                  value={systemSettings.backupFrequency}
                  onChange={(e) => setSystemSettings({ ...systemSettings, backupFrequency: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={!systemSettings.autoBackup}
                >
                  <option value="hourly">{t('settings.hourly')}</option>
                  <option value="daily">{t('settings.daily')}</option>
                  <option value="weekly">{t('settings.weekly')}</option>
                  <option value="monthly">{t('settings.monthly')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataRetention">{t('settings.dataRetention')}</Label>
                <select
                  id="dataRetention"
                  value={systemSettings.dataRetention}
                  onChange={(e) => setSystemSettings({ ...systemSettings, dataRetention: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="30">30</option>
                  <option value="60">60</option>
                  <option value="90">90</option>
                  <option value="180">180</option>
                  <option value="365">365</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">{t('settings.sessionTimeout')}</Label>
                <select
                  id="sessionTimeout"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                  <option value="120">120</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
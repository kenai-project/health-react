import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import GlassCard from '../components/GlassCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Save } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@health.com',
    phone: '+1 (555) 123-4567',
    address: '123 Health Street, Medical City, MC 12345',
    dateOfBirth: '1990-01-15',
    role: user?.role || 'admin',
    department: 'Administration',
    employeeId: 'EMP001',
    joinDate: '2020-01-01'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateUser({ ...user, ...profileData });
    toast.success(t('profile.updated'));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }

    // In a real app, this would call an API
    toast.success(t('profile.passwordUpdated'));
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl">
              {getInitials(profileData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profileData.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{profileData.role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {t('profile.employeeId', { id: profileData.employeeId })}
            </p>
          </div>
          <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
            {t('profile.changePhoto')}
          </Button>
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
          <TabsTrigger value="personal">{t('profile.personalInfo')}</TabsTrigger>
          <TabsTrigger value="security">{t('profile.security')}</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <GlassCard className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">{t('profile.dateOfBirth')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('profile.address')}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">{t('profile.department')}</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">{t('profile.joinDate')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="joinDate"
                      type="date"
                      value={profileData.joinDate}
                      onChange={(e) => setProfileData({ ...profileData, joinDate: e.target.value })}
                      className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </GlassCard>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <GlassCard className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('profile.passwordHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('profile.confirmNewPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('profile.updatePassword')}
                </Button>
              </div>
            </form>

            {/* Additional Security Options */}
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('profile.additionalSecurity')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('profile.twoFactor')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.twoFactorDesc')}</p>
                  </div>
                  <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                    {t('profile.enable')}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('profile.loginActivity')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.loginActivityDesc')}</p>
                  </div>
                  <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                    {t('common.view')}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
import { useState } from 'react';
import { useAuth } from '../../../app/contexts/AuthContext';
import GlassCard from '../../../app/components/GlassCard';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Avatar, AvatarFallback } from '../../../app/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Save } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@health.com',
    phone: '+1 (555) 123-4567',
    address: '123 Health Street, Medical City, MC 12345',
    dateOfBirth: '1990-01-15',
    role: user?.role || 'admin',
    department: 'Administration',
    employeeId: 'EMP001',
    joinDate: '2020-01-01',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = (name) =>
    (name || '')
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateUser({ ...user, ...profileData });
    toast.success('Profile updated successfully');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    toast.success('Password updated successfully');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information</p>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl">
              {getInitials(profileData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{profileData.role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Employee ID: {profileData.employeeId}</p>
          </div>
          <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
            Change Photo
          </Button>
        </div>
      </GlassCard>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <GlassCard className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
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
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Phone</Label>
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
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                  <Label htmlFor="address">Address</Label>
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
                  <Label htmlFor="department">Department</Label>
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
                  <Label htmlFor="joinDate">Join Date</Label>
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
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </GlassCard>
        </TabsContent>

        <TabsContent value="security">
          <GlassCard className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
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
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Additional Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">Enable</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Login Activity</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View your recent login history</p>
                  </div>
                  <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">View</Button>
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


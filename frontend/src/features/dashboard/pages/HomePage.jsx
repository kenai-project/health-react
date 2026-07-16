import { useNavigate } from 'react-router';
import GlassCard from '../../../app/components/GlassCard';
import { useAuth } from '../../../app/contexts/AuthContext';
import { Button } from '../../../app/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  UserCircle,
  LogOut,
  ArrowRight,
  Activity,
  Clock,
} from 'lucide-react';
import {
  useState,
} from 'react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuCards = [
    {
      title: 'Dashboard',
      description: 'View statistics and overview',
      icon: LayoutDashboard,
      path: '/dashboard',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Records',
      description: 'Manage health records',
      icon: FileText,
      path: '/records',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Users',
      description: 'Manage system users',
      icon: Users,
      path: '/admin/users',
      color: 'from-orange-500 to-indigo-600',
    },
    {
      title: 'Profile',
      description: 'Update your profile',
      icon: UserCircle,
      path: '/profile',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const recentActivities = [
    { id: 1, action: 'New patient record added', time: '5 minutes ago', type: 'create' },
    { id: 2, action: 'User profile updated', time: '1 hour ago', type: 'update' },
    { id: 3, action: 'Report generated', time: '2 hours ago', type: 'report' },
    { id: 4, action: 'System backup completed', time: '3 hours ago', type: 'system' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <GlassCard className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {user?.name || user?.username || 'Admin'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your health management system today
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </GlassCard>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCards.map((card) => (
          <GlassCard
            key={card.path}
            hover
            className="p-6 cursor-pointer group"
            onClick={() => navigate(card.path)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{card.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
          </GlassCard>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.action}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            onClick={() => navigate('/analytics')}
          >
            View All Activity
          </Button>
        </GlassCard>

        {/* Quick Stats */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Records</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">856</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">342</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default HomePage;


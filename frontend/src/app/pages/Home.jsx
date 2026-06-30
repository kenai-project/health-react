import { Link } from 'react-router';
import { LayoutDashboard, FileText, BarChart3, Users, User, Activity, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/GlassCard';

export const Home = () => {
  const { user } = useAuth();

  const quickLinks = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'View statistics and analytics',
      color: 'from-blue-500 to-blue-600',
    },
    {
      to: '/records',
      icon: FileText,
      title: 'Records',
      description: 'Manage patient records',
      color: 'from-green-500 to-green-600',
    },
    {
      to: '/analytics',
      icon: BarChart3,
      title: 'Analytics',
      description: 'View detailed analytics',
      color: 'from-purple-500 to-purple-600',
    },
    {
      to: '/admin/users',
      icon: Users,
      title: 'User Management',
      description: 'Manage system users',
      color: 'from-orange-500 to-orange-600',
      adminOnly: true,
    },
    {
      to: '/profile',
      icon: User,
      title: 'Profile',
      description: 'Manage your profile',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const recentActivities = [
    { id: 1, action: 'New patient record created', user: 'Dr. Smith', time: '5 minutes ago', icon: FileText },
    { id: 2, action: 'User profile updated', user: 'Admin', time: '1 hour ago', icon: User },
    { id: 3, action: 'Analytics report generated', user: 'System', time: '2 hours ago', icon: BarChart3 },
    { id: 4, action: 'New user registered', user: 'Admin', time: '3 hours ago', icon: Users },
    { id: 5, action: 'Record updated', user: 'Dr. Johnson', time: '5 hours ago', icon: FileText },
  ];

  const filteredLinks = quickLinks.filter(link => !link.adminOnly || user?.role === 'admin');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <GlassCard className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Here's what's happening with your health management system today.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Activity className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <GlassCard hover className="p-6 h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {link.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {link.description}
                </p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Recent Activity</h2>
        <GlassCard className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all"
              >
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <activity.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-white font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">by {activity.user}</p>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

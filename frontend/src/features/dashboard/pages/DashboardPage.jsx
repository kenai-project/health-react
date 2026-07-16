import { useState } from 'react';
import GlassCard from '../../../app/components/GlassCard';
import StatCard from '../../../app/components/StatCard';
import { Users, FileText, Activity, TrendingUp, Calendar, Clock } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('week');

  // Mock data for charts
  const lineChartData = [
    { name: 'Mon', patients: 40, records: 24 },
    { name: 'Tue', patients: 55, records: 38 },
    { name: 'Wed', patients: 45, records: 29 },
    { name: 'Thu', patients: 67, records: 48 },
    { name: 'Fri', patients: 72, records: 52 },
    { name: 'Sat', patients: 35, records: 21 },
    { name: 'Sun', patients: 28, records: 15 },
  ];

  const barChartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 700 },
  ];

  const pieChartData = [
    { name: 'Cardiology', value: 400 },
    { name: 'Neurology', value: 300 },
    { name: 'Orthopedics', value: 300 },
    { name: 'Pediatrics', value: 200 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const recentActivities = [
    { id: 1, user: 'Dr. Smith', action: 'Added new patient record', time: '5 min ago' },
    { id: 2, user: 'Dr. Johnson', action: 'Updated treatment plan', time: '12 min ago' },
    { id: 3, user: 'Nurse Williams', action: 'Scheduled appointment', time: '25 min ago' },
    { id: 4, user: 'Dr. Brown', action: 'Completed consultation', time: '1 hour ago' },
    { id: 5, user: 'Admin', action: 'Generated monthly report', time: '2 hours ago' },
  ];

  const quickActions = [
    { id: 1, title: 'Add Patient', icon: Users, color: 'blue' },
    { id: 2, title: 'New Record', icon: FileText, color: 'green' },
    { id: 3, title: 'Schedule', icon: Calendar, color: 'purple' },
    { id: 4, title: 'Reports', icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your health management system</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'backdrop-blur-md bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-800/90'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value="1,234" icon={Users} trend="up" trendValue="+12.5%" color="blue" />
        <StatCard title="Active Records" value="856" icon={FileText} trend="up" trendValue="+8.2%" color="green" />
        <StatCard title="Appointments" value="342" icon={Calendar} trend="down" trendValue="-3.1%" color="purple" />
        <StatCard title="Activities" value="1,892" icon={Activity} trend="up" trendValue="+15.3%" color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Weekly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="records" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Pie Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bar Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Records</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{activity.user}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{activity.action}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600',
              green: 'from-green-500 to-green-600',
              purple: 'from-purple-500 to-purple-600',
              orange: 'from-orange-500 to-orange-600',
            };

            return (
              <button
                key={action.id}
                className="p-4 rounded-xl backdrop-blur-md bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all hover:scale-105"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[action.color]} flex items-center justify-center mb-3 mx-auto`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardPage;


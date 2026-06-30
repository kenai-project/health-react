import { useState, useEffect } from 'react';
import { Users, FileText, Activity, TrendingUp, Plus, Search, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/StatCard';
import { GlassCard } from '../components/GlassCard';

export const Dashboard = () => {
  const [stats] = useState({
    totalUsers: 1245,
    totalRecords: 3847,
    activePatients: 892,
    avgVisits: 24.5,
  });

  const [chartData] = useState([
    { name: 'Jan', patients: 400, records: 240 },
    { name: 'Feb', patients: 300, records: 139 },
    { name: 'Mar', patients: 200, records: 980 },
    { name: 'Apr', patients: 278, records: 390 },
    { name: 'May', patients: 189, records: 480 },
    { name: 'Jun', patients: 239, records: 380 },
  ]);

  const [pieData] = useState([
    { name: 'Cardiology', value: 400 },
    { name: 'Neurology', value: 300 },
    { name: 'Orthopedics', value: 200 },
    { name: 'Pediatrics', value: 278 },
  ]);

  const [recentActions] = useState([
    { id: 1, user: 'Dr. Smith', action: 'Created new patient record', time: '2 mins ago' },
    { id: 2, user: 'Dr. Johnson', action: 'Updated patient vitals', time: '15 mins ago' },
    { id: 3, user: 'Admin', action: 'Added new staff member', time: '1 hour ago' },
    { id: 4, user: 'Dr. Williams', action: 'Completed patient checkup', time: '2 hours ago' },
  ]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your health management system</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all">
          <Plus className="w-5 h-5" />
          <span>New Record</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          trend="up"
          trendValue="12%"
          color="blue"
        />
        <StatCard
          icon={FileText}
          title="Total Records"
          value={stats.totalRecords.toLocaleString()}
          trend="up"
          trendValue="8%"
          color="green"
        />
        <StatCard
          icon={Activity}
          title="Active Patients"
          value={stats.activePatients.toLocaleString()}
          trend="down"
          trendValue="3%"
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Visits/Day"
          value={stats.avgVisits}
          trend="up"
          trendValue="5%"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Patients & Records Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="patients" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="records" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Pie Chart */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Department Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Recent Actions and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Actions */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Recent Actions</h3>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all"
                >
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium">{action.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">by {action.user}</p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{action.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-800 dark:text-white font-medium">New Patient</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-gray-800 dark:text-white font-medium">Add Record</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all">
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-800 dark:text-white font-medium">Search Records</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-all">
              <Filter className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-gray-800 dark:text-white font-medium">Filter Data</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

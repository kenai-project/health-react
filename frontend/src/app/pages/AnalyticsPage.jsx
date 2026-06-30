import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import { Users, FileText, TrendingUp, Activity, Calendar, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('month');

  const monthlyData = [
    { month: 'Jan', patients: 120, records: 450, revenue: 12000 },
    { month: 'Feb', patients: 150, records: 520, revenue: 15000 },
    { month: 'Mar', patients: 180, records: 680, revenue: 18000 },
    { month: 'Apr', patients: 165, records: 590, revenue: 16500 },
    { month: 'May', patients: 200, records: 750, revenue: 20000 },
    { month: 'Jun', patients: 220, records: 820, revenue: 22000 }
  ];

  const departmentData = [
    { name: 'Cardiology', value: 400, color: '#3b82f6' },
    { name: 'Neurology', value: 300, color: '#10b981' },
    { name: 'Orthopedics', value: 300, color: '#f59e0b' },
    { name: 'Pediatrics', value: 200, color: '#8b5cf6' },
    { name: 'Others', value: 150, color: '#ec4899' }
  ];

  const weeklyActivityData = [
    { day: 'Mon', appointments: 45, consultations: 38, emergencies: 5 },
    { day: 'Tue', appointments: 52, consultations: 42, emergencies: 8 },
    { day: 'Wed', appointments: 49, consultations: 40, emergencies: 6 },
    { day: 'Thu', appointments: 63, consultations: 51, emergencies: 7 },
    { day: 'Fri', appointments: 58, consultations: 48, emergencies: 4 },
    { day: 'Sat', appointments: 35, consultations: 28, emergencies: 9 },
    { day: 'Sun', appointments: 28, consultations: 22, emergencies: 12 }
  ];

  const ageDistribution = [
    { age: '0-18', count: 120 },
    { age: '19-35', count: 280 },
    { age: '36-50', count: 350 },
    { age: '51-65', count: 240 },
    { age: '65+', count: 180 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights and reports
          </p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((range) => (
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
          <Button variant="outline" className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value="1,234"
          icon={Users}
          trend="up"
          trendValue="+12.5%"
          color="blue"
        />
        <StatCard
          title="Total Records"
          value="4,562"
          icon={FileText}
          trend="up"
          trendValue="+8.2%"
          color="green"
        />
        <StatCard
          title="Monthly Growth"
          value="18.5%"
          icon={TrendingUp}
          trend="up"
          trendValue="+2.4%"
          color="purple"
        />
        <StatCard
          title="Active Cases"
          value="342"
          icon={Activity}
          trend="down"
          trendValue="-3.1%"
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends - Area Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Monthly Patient Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorPatients)"
              />
              <Area
                type="monotone"
                dataKey="records"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRecords)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Department Distribution - Pie Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Department Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity - Bar Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Weekly Activity Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="appointments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="consultations" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="emergencies" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Age Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Patient Age Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="age" type="category" stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Performance Metrics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Patient Satisfaction</span>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">94.5%</div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94.5%' }}></div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Treatment Success</span>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">87.2%</div>
            <div className="w-full bg-green-200 dark:bg-green-900/40 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '87.2%' }}></div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Wait Time</span>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">12 min</div>
            <div className="w-full bg-purple-200 dark:bg-purple-900/40 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AnalyticsPage;

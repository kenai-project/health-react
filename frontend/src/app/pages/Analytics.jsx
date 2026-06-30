import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, Activity, FileText, Calendar } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month');

  const [monthlyData] = useState([
    { month: 'Jan', visits: 450, patients: 320, records: 240 },
    { month: 'Feb', visits: 380, patients: 280, records: 190 },
    { month: 'Mar', visits: 520, patients: 390, records: 280 },
    { month: 'Apr', visits: 470, patients: 350, records: 310 },
    { month: 'May', visits: 590, patients: 420, records: 350 },
    { month: 'Jun', visits: 650, patients: 480, records: 420 },
  ]);

  const [departmentData] = useState([
    { department: 'Cardiology', patients: 450, revenue: 45000 },
    { department: 'Neurology', patients: 380, revenue: 38000 },
    { department: 'Orthopedics', patients: 520, revenue: 52000 },
    { department: 'Pediatrics', patients: 320, revenue: 32000 },
    { department: 'General', patients: 280, revenue: 28000 },
  ]);

  const [performanceMetrics] = useState([
    { metric: 'Patient Satisfaction', value: 94, target: 90 },
    { metric: 'Wait Time (mins)', value: 15, target: 20 },
    { metric: 'Treatment Success Rate', value: 89, target: 85 },
    { metric: 'Staff Efficiency', value: 92, target: 90 },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Detailed insights and performance metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Activity}
          title="Total Visits"
          value="2,650"
          trend="up"
          trendValue="15%"
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Active Patients"
          value="1,840"
          trend="up"
          trendValue="8%"
          color="green"
        />
        <StatCard
          icon={FileText}
          title="Records Created"
          value="1,290"
          trend="up"
          trendValue="12%"
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Response Time"
          value="12 min"
          trend="down"
          trendValue="5%"
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Monthly Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" />
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
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorVisits)"
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#8B5CF6"
                fillOpacity={1}
                fill="url(#colorPatients)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bar Chart */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Department Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="department" stroke="#6B7280" angle={-45} textAnchor="end" height={80} />
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
              <Bar dataKey="patients" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Performance Metrics */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {metric.metric}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800 dark:text-white font-bold">
                    {metric.value}{metric.metric.includes('Rate') || metric.metric.includes('Satisfaction') ? '%' : ''}
                  </span>
                  {metric.value >= metric.target ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.value >= metric.target
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}
                  style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Target: {metric.target}{metric.metric.includes('Rate') || metric.metric.includes('Satisfaction') ? '%' : ''}</span>
                <span>
                  {metric.value >= metric.target ? 'Above Target' : 'Below Target'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Records Timeline */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Records Creation Timeline
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="month" stroke="#6B7280" />
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
            <Line
              type="monotone"
              dataKey="records"
              stroke="#EC4899"
              strokeWidth={3}
              dot={{ fill: '#EC4899', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};

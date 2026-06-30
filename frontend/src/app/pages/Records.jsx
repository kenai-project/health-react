import { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const Records = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [records] = useState([
    {
      id: 'REC001',
      patientName: 'John Doe',
      age: 45,
      department: 'Cardiology',
      doctor: 'Dr. Smith',
      date: '2026-06-20',
      status: 'Active',
    },
    {
      id: 'REC002',
      patientName: 'Jane Smith',
      age: 32,
      department: 'Neurology',
      doctor: 'Dr. Johnson',
      date: '2026-06-21',
      status: 'Completed',
    },
    {
      id: 'REC003',
      patientName: 'Bob Wilson',
      age: 58,
      department: 'Orthopedics',
      doctor: 'Dr. Williams',
      date: '2026-06-19',
      status: 'Active',
    },
    {
      id: 'REC004',
      patientName: 'Alice Brown',
      age: 28,
      department: 'Pediatrics',
      doctor: 'Dr. Davis',
      date: '2026-06-18',
      status: 'Pending',
    },
    {
      id: 'REC005',
      patientName: 'Charlie Green',
      age: 41,
      department: 'Cardiology',
      doctor: 'Dr. Smith',
      date: '2026-06-22',
      status: 'Active',
    },
  ]);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' || record.status.toLowerCase() === selectedFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    Active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    Pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Medical Records</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all patient records</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all">
          <Plus className="w-5 h-5" />
          <span>New Record</span>
        </button>
      </div>

      {/* Search and Filter */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, ID, or department..."
              className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Records Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Record ID
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Patient Name
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Age
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Department
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Doctor
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Date
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all"
                >
                  <td className="py-4 px-4 text-gray-800 dark:text-white font-medium">
                    {record.id}
                  </td>
                  <td className="py-4 px-4 text-gray-800 dark:text-white">
                    {record.patientName}
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{record.age}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {record.department}
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{record.doctor}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{record.date}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[record.status]
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all">
                        <Edit className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </button>
                      <button className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all">
                        <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </button>
                      <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No records found</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

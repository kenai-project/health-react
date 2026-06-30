import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Shield, UserX, UserCheck } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const [users] = useState([
    {
      id: 1,
      name: 'John Admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2026-06-22 10:30 AM',
    },
    {
      id: 2,
      name: 'Dr. Sarah Smith',
      email: 'sarah.smith@example.com',
      role: 'doctor',
      status: 'active',
      lastLogin: '2026-06-22 09:15 AM',
    },
    {
      id: 3,
      name: 'Nurse Johnson',
      email: 'nurse.johnson@example.com',
      role: 'staff',
      status: 'active',
      lastLogin: '2026-06-21 04:45 PM',
    },
    {
      id: 4,
      name: 'Dr. Mike Williams',
      email: 'mike.williams@example.com',
      role: 'doctor',
      status: 'active',
      lastLogin: '2026-06-22 08:00 AM',
    },
    {
      id: 5,
      name: 'Staff Member',
      email: 'staff@example.com',
      role: 'staff',
      status: 'inactive',
      lastLogin: '2026-06-15 02:20 PM',
    },
  ]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const roleColors = {
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    doctor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    staff: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  };

  const statusColors = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    inactive: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and permissions</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all">
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{users.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inactive Users</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {users.filter((u) => u.status === 'inactive').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900/30">
              <UserX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </GlassCard>
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
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Name
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Email
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Role
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Last Login
                </th>
                <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all"
                >
                  <td className="py-4 px-4 text-gray-800 dark:text-white font-medium">
                    {user.name}
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        roleColors[user.role]
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[user.status]
                      }`}
                    >
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.lastLogin}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

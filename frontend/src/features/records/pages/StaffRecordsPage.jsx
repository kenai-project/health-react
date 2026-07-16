import { useState } from 'react';
import GlassCard from '../../../app/components/GlassCard';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../app/components/ui/table';
import { Badge } from '../../../app/components/ui/badge';
import { Search, Filter, Download, Eye } from 'lucide-react';

const StaffRecordsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for staff records
  const records = [
    {
      id: 1,
      recordId: 'REC001',
      patientName: 'John Doe',
      patientId: 'P001',
      type: 'Consultation',
      date: '2026-06-20',
      status: 'completed',
      assignedTo: 'Dr. Smith',
    },
    {
      id: 2,
      recordId: 'REC002',
      patientName: 'Jane Smith',
      patientId: 'P002',
      type: 'Follow-up',
      date: '2026-06-19',
      status: 'pending',
      assignedTo: 'Dr. Johnson',
    },
    {
      id: 3,
      recordId: 'REC003',
      patientName: 'Bob Williams',
      patientId: 'P003',
      type: 'Lab Results',
      date: '2026-06-18',
      status: 'completed',
      assignedTo: 'Lab Tech',
    },
    {
      id: 4,
      recordId: 'REC004',
      patientName: 'Alice Johnson',
      patientId: 'P004',
      type: 'Prescription',
      date: '2026-06-17',
      status: 'completed',
      assignedTo: 'Dr. Brown',
    },
    {
      id: 5,
      recordId: 'REC005',
      patientName: 'Charlie Brown',
      patientId: 'P005',
      type: 'Emergency',
      date: '2026-06-16',
      status: 'in-progress',
      assignedTo: 'Dr. Davis',
    },
  ];

  const filteredRecords = records.filter(
    (record) =>
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Records</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage assigned patient records</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
          <Download className="w-4 h-4 mr-2" />
          Export Records
        </Button>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by record ID, patient name, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            />
          </div>
          <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Records</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{records.length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{records.filter((r) => r.status === 'completed').length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{records.filter((r) => r.status === 'pending').length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{records.filter((r) => r.status === 'in-progress').length}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200/50 dark:border-gray-700/50">
                <TableHead>Record ID</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="border-gray-200/50 dark:border-gray-700/50">
                  <TableCell className="font-medium">{record.recordId}</TableCell>
                  <TableCell>{record.patientId}</TableCell>
                  <TableCell>{record.patientName}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.assignedTo}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(record.status)}>{record.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
};

export default StaffRecordsPage;


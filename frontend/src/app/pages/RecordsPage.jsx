import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

const RecordsPage = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Mock data
  const [records, setRecords] = useState([
    {
      id: 1,
      patientName: 'John Doe',
      patientId: 'P001',
      diagnosis: 'Hypertension',
      date: '2026-06-20',
      doctor: 'Dr. Smith',
      status: 'active',
      notes: 'Patient responding well to treatment'
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      patientId: 'P002',
      diagnosis: 'Diabetes Type 2',
      date: '2026-06-19',
      doctor: 'Dr. Johnson',
      status: 'active',
      notes: 'Regular monitoring required'
    },
    {
      id: 3,
      patientName: 'Bob Williams',
      patientId: 'P003',
      diagnosis: 'Common Cold',
      date: '2026-06-18',
      doctor: 'Dr. Brown',
      status: 'completed',
      notes: 'Prescribed medication for 5 days'
    },
    {
      id: 4,
      patientName: 'Alice Johnson',
      patientId: 'P004',
      diagnosis: 'Migraine',
      date: '2026-06-17',
      doctor: 'Dr. Davis',
      status: 'active',
      notes: 'Stress-related symptoms'
    },
    {
      id: 5,
      patientName: 'Charlie Brown',
      patientId: 'P005',
      diagnosis: 'Allergic Reaction',
      date: '2026-06-16',
      doctor: 'Dr. Smith',
      status: 'completed',
      notes: 'Allergic to peanuts'
    }
  ]);

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    diagnosis: '',
    date: '',
    doctor: '',
    status: 'active',
    notes: ''
  });

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData(record);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setFormData(record);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setRecords(records.filter(r => r.id !== id));
    toast.success(t('records.deleted'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRecord) {
      setRecords(records.map(r => r.id === selectedRecord.id ? { ...formData, id: r.id } : r));
      toast.success(t('records.updated'));
    } else {
      setRecords([...records, { ...formData, id: Date.now() }]);
      toast.success(t('records.created'));
    }
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRecord(null);
    setIsViewMode(false);
    setFormData({
      patientName: '',
      patientId: '',
      diagnosis: '',
      date: '',
      doctor: '',
      status: 'active',
      notes: ''
    });
  };

  const filteredRecords = records.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('records.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('records.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('records.addRecord')}
        </Button>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={t('records.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
            />
          </div>
          <Button variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
            <Filter className="w-4 h-4 mr-2" />
            {t('common.filters')}
          </Button>
        </div>
      </GlassCard>

      {/* Records Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200/50 dark:border-gray-700/50">
                <TableHead>{t('records.patientId')}</TableHead>
                <TableHead>{t('records.patientName')}</TableHead>
                <TableHead>{t('records.diagnosis')}</TableHead>
                <TableHead>{t('records.date')}</TableHead>
                <TableHead>{t('records.doctor')}</TableHead>
                <TableHead>{t('records.status')}</TableHead>
                <TableHead className="text-right">{t('records.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="border-gray-200/50 dark:border-gray-700/50">
                  <TableCell className="font-medium">{record.patientId}</TableCell>
                  <TableCell>{record.patientName}</TableCell>
                  <TableCell>{record.diagnosis}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.doctor}</TableCell>
                  <TableCell>
                    <Badge
                      variant={record.status === 'active' ? 'default' : 'secondary'}
                      className={
                        record.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }
                    >
                      {record.status === 'active' ? t('records.statusActive') : t('records.statusCompleted')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(record)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(record)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(record.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="backdrop-blur-md bg-white/95 dark:bg-gray-800/95 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? t('records.viewRecord') : selectedRecord ? t('records.editRecord') : t('records.addNewRecord')}
            </DialogTitle>
            <DialogDescription>
              {isViewMode
                ? t('records.viewRecordDesc')
                : selectedRecord
                ? t('records.editRecordDesc')
                : t('records.addRecordDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">{t('records.patientId')}</Label>
                  <Input
                    id="patientId"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    disabled={isViewMode}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientName">{t('records.patientName')}</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">{t('records.diagnosis')}</Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  disabled={isViewMode}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t('records.date')}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    disabled={isViewMode}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor">{t('records.doctor')}</Label>
                  <Input
                    id="doctor"
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('records.status')}</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="active">{t('records.statusActive')}</option>
                  <option value="completed">{t('records.statusCompleted')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('records.notes')}</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              {!isViewMode && (
                <>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    {selectedRecord ? t('common.update') : t('common.create')}
                  </Button>
                </>
              )}
              {isViewMode && (
                <Button type="button" onClick={handleCloseDialog}>
                  {t('common.close')}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordsPage;
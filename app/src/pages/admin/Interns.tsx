import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search, UserCheck, UserX, ArrowUpDown, Filter, Download } from 'lucide-react';
import { api } from '@/services/api';
import type { Intern } from '@/types';
import { toast } from 'sonner';

type SortField = 'name' | 'intern_code' | 'department' | 'created_at' | 'approval_status';
type SortOrder = 'asc' | 'desc';

export default function AdminInterns() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      
      const response = await api.getInterns(params);
      setInterns(response.interns || []);
    } catch (error) {
      toast.error('Failed to load interns');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchInterns();
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveIntern(id);
      toast.success('Intern approved successfully');
      fetchInterns();
    } catch (error) {
      toast.error('Failed to approve intern');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this intern?')) return;
    
    try {
      await api.rejectIntern(id);
      toast.success('Intern rejected');
      fetchInterns();
    } catch (error) {
      toast.error('Failed to reject intern');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Intern Code', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Status', 'Approval', 'Phone'];
    const rows = filteredAndSortedInterns.map(i => [
      i.intern_code,
      i.first_name,
      i.last_name,
      i.email,
      i.department || '',
      i.position || '',
      i.user_status,
      i.approval_status,
      i.phone || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  // Get unique departments for filter
  const departments = [...new Set(interns.map(i => i.department).filter((d): d is string => !!d))];

  // Filter and sort interns
  let filteredAndSortedInterns = interns.filter(intern => {
    // Status filter
    if (statusFilter !== 'all' && intern.approval_status !== statusFilter) return false;
    
    // Department filter
    if (departmentFilter !== 'all' && intern.department !== departmentFilter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        intern.first_name?.toLowerCase().includes(searchLower) ||
        intern.last_name?.toLowerCase().includes(searchLower) ||
        intern.intern_code?.toLowerCase().includes(searchLower) ||
        intern.email?.toLowerCase().includes(searchLower) ||
        intern.department?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Sort interns
  filteredAndSortedInterns.sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        break;
      case 'intern_code':
        comparison = (a.intern_code || '').localeCompare(b.intern_code || '');
        break;
      case 'department':
        comparison = (a.department || '').localeCompare(b.department || '');
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'approval_status':
        comparison = (a.approval_status || '').localeCompare(b.approval_status || '');
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-slate-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-slate-400'}`} />
      </div>
    </TableHead>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">All Interns</h1>
            <p className="text-slate-600">View and manage all interns in the system</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or intern code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{interns.length}</div>
              <p className="text-sm text-slate-500">Total Interns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{interns.filter(i => i.approval_status === 'pending').length}</div>
              <p className="text-sm text-slate-500">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{interns.filter(i => i.approval_status === 'approved').length}</div>
              <p className="text-sm text-slate-500">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{interns.filter(i => i.user_status === 'active').length}</div>
              <p className="text-sm text-slate-500">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Interns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Interns ({filteredAndSortedInterns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredAndSortedInterns.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No interns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHeader field="intern_code">Intern Code</SortHeader>
                      <SortHeader field="name">Name</SortHeader>
                      <TableHead>Email</TableHead>
                      <SortHeader field="department">Department</SortHeader>
                      <SortHeader field="approval_status">Status</SortHeader>
                      <SortHeader field="created_at">Registered</SortHeader>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedInterns.map((intern) => (
                      <TableRow key={intern.id}>
                        <TableCell className="font-mono">{intern.intern_code}</TableCell>
                        <TableCell>
                          {intern.first_name} {intern.last_name}
                        </TableCell>
                        <TableCell>{intern.email}</TableCell>
                        <TableCell>{intern.department || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(intern.approval_status)}</TableCell>
                        <TableCell>{new Date(intern.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/admin/interns/${intern.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {intern.approval_status === 'pending' && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleApprove(intern.id)}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleReject(intern.id)}
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Edit, 
  Power, 
  PowerOff, 
  Printer, 
  FileText, 
  Download, 
  Loader2,
  UserPlus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Intern {
  id: number;
  user_id: number;
  intern_code: string;
  first_name: string;
  last_name: string;
  email: string;
  sa_id: string;
  date_of_birth: string;
  gender: string;
  citizenship: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  department: string;
  position: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  user_status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface UploadedFile {
  id: number;
  intern_id: number;
  intern_name: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string;
  uploaded_at: string;
}

export default function AdminAdvancedFeatures() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewFilesDialogOpen, setViewFilesDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Form states for adding new intern
  const [newInternForm, setNewInternForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    saId: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    department: '',
    position: ''
  });

  // Form states for editing intern
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const internsRes = await api.getInterns();
      setInterns(internsRes.interns || []);
      
      // Collect all files from interns
      const allFiles: UploadedFile[] = [];
      for (const intern of internsRes.interns || []) {
        try {
          const details = await api.getInternDetails(intern.id);
          if (details.files) {
            details.files.forEach((file: any) => {
              allFiles.push({
                ...file,
                intern_name: `${intern.first_name} ${intern.last_name}`,
                intern_id: intern.id
              });
            });
          }
        } catch (e) {
          console.error('Error fetching intern files:', e);
        }
      }
      setFiles(allFiles);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.register({
        ...newInternForm,
        // Auto-generate password if not provided
        password: newInternForm.password || 'TempPass@123'
      });
      toast.success('Intern added successfully');
      setAddDialogOpen(false);
      setNewInternForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        saId: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        department: '',
        position: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add intern');
    } finally {
      setSaving(false);
    }
  };

  const handleEditIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern) return;
    
    setSaving(true);
    try {
      await api.updateIntern(selectedIntern.id, editForm);
      toast.success('Intern profile updated successfully');
      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update intern');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (intern: Intern) => {
    try {
      await api.updateIntern(intern.id, { user_status: 'active' });
      toast.success('Intern profile activated');
      fetchData();
    } catch (error) {
      toast.error('Failed to activate intern');
    }
  };

  const handleSuspend = async (intern: Intern) => {
    if (!confirm('Are you sure you want to suspend this intern?')) return;
    try {
      await api.updateIntern(intern.id, { user_status: 'inactive' });
      toast.success('Intern profile suspended');
      fetchData();
    } catch (error) {
      toast.error('Failed to suspend intern');
    }
  };

  const handlePrint = (intern: Intern) => {
    setSelectedIntern(intern);
    setTimeout(() => {
      const printContent = printRef.current;
      if (printContent) {
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
      }
    }, 100);
  };

  const openEditDialog = (intern: Intern) => {
    setSelectedIntern(intern);
    setEditForm({
      first_name: intern.first_name || '',
      last_name: intern.last_name || '',
      phone: intern.phone || '',
      address: intern.address || '',
      city: intern.city || '',
      province: intern.province || '',
      postal_code: intern.postal_code || '',
      emergency_contact_name: intern.emergency_contact_name || '',
      emergency_contact_phone: intern.emergency_contact_phone || '',
      department: intern.department || '',
      position: intern.position || ''
    });
    setEditDialogOpen(true);
  };

  const openViewFilesDialog = (intern: Intern) => {
    setSelectedIntern(intern);
    setViewFilesDialogOpen(true);
  };

  const getInternFiles = (internId: number) => {
    return files.filter(f => f.intern_id === internId);
  };

  const filteredInterns = interns.filter(intern => 
    intern.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.intern_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Advanced Admin Features</h1>
            <p className="text-slate-600">Manage interns with advanced tools</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Intern Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Intern</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddIntern} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input 
                      value={newInternForm.firstName} 
                      onChange={e => setNewInternForm({...newInternForm, firstName: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input 
                      value={newInternForm.lastName} 
                      onChange={e => setNewInternForm({...newInternForm, lastName: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={newInternForm.email} 
                    onChange={e => setNewInternForm({...newInternForm, email: e.target.value})}
                    required 
                  />
                </div>
                <div>
                  <Label>Password (auto-generated if empty)</Label>
                  <Input 
                    type="password"
                    value={newInternForm.password} 
                    onChange={e => setNewInternForm({...newInternForm, password: e.target.value})}
                    placeholder="Leave empty for auto-generation"
                  />
                </div>
                <div>
                  <Label>SA ID Number *</Label>
                  <Input 
                    value={newInternForm.saId} 
                    onChange={e => setNewInternForm({...newInternForm, saId: e.target.value})}
                    placeholder="13 digit SA ID"
                    required 
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={newInternForm.phone} 
                    onChange={e => setNewInternForm({...newInternForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input 
                    value={newInternForm.address} 
                    onChange={e => setNewInternForm({...newInternForm, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input 
                      value={newInternForm.city} 
                      onChange={e => setNewInternForm({...newInternForm, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Province</Label>
                    <Select 
                      value={newInternForm.province} 
                      onValueChange={v => setNewInternForm({...newInternForm, province: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input 
                    value={newInternForm.postalCode} 
                    onChange={e => setNewInternForm({...newInternForm, postalCode: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Emergency Contact Name</Label>
                    <Input 
                      value={newInternForm.emergencyContactName} 
                      onChange={e => setNewInternForm({...newInternForm, emergencyContactName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Phone</Label>
                    <Input 
                      value={newInternForm.emergencyContactPhone} 
                      onChange={e => setNewInternForm({...newInternForm, emergencyContactPhone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Input 
                      value={newInternForm.department} 
                      onChange={e => setNewInternForm({...newInternForm, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Input 
                      value={newInternForm.position} 
                      onChange={e => setNewInternForm({...newInternForm, position: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Intern'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="interns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="interns">All Interns</TabsTrigger>
            <TabsTrigger value="uploads">Uploaded Files ({files.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="interns" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, email, intern code, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interns Table */}
            <Card>
              <CardHeader>
                <CardTitle>Intern Management ({filteredInterns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Intern Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInterns.map((intern) => (
                        <TableRow key={intern.id}>
                          <TableCell className="font-mono">{intern.intern_code}</TableCell>
                          <TableCell>{intern.first_name} {intern.last_name}</TableCell>
                          <TableCell>{intern.email}</TableCell>
                          <TableCell>{intern.department || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={intern.user_status === 'active' ? 'default' : 'destructive'}>
                              {intern.user_status === 'active' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              intern.approval_status === 'approved' ? 'default' :
                              intern.approval_status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {intern.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(intern)} title="Edit Profile">
                                <Edit className="w-4 h-4" />
                              </Button>
                              {intern.user_status !== 'active' ? (
                                <Button variant="ghost" size="icon" onClick={() => handleActivate(intern)} title="Activate">
                                  <Power className="w-4 h-4 text-green-500" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" onClick={() => handleSuspend(intern)} title="Suspend">
                                  <PowerOff className="w-4 h-4 text-orange-500" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => handlePrint(intern)} title="Print Profile">
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openViewFilesDialog(intern)} title="View Uploads">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads">
            <Card>
              <CardHeader>
                <CardTitle>All Uploaded Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Intern</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>{file.intern_name}</TableCell>
                          <TableCell>{file.original_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{file.category || 'general'}</Badge>
                          </TableCell>
                          <TableCell>{formatFileSize(file.file_size)}</TableCell>
                          <TableCell>{new Date(file.uploaded_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Intern Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditIntern} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input 
                    value={editForm.first_name} 
                    onChange={e => setEditForm({...editForm, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    value={editForm.last_name} 
                    onChange={e => setEditForm({...editForm, last_name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={editForm.phone} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input 
                  value={editForm.address} 
                  onChange={e => setEditForm({...editForm, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input 
                    value={editForm.city} 
                    onChange={e => setEditForm({...editForm, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Province</Label>
                  <Select 
                    value={editForm.province} 
                    onValueChange={v => setEditForm({...editForm, province: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input 
                  value={editForm.postal_code} 
                  onChange={e => setEditForm({...editForm, postal_code: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input 
                    value={editForm.emergency_contact_name} 
                    onChange={e => setEditForm({...editForm, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input 
                    value={editForm.emergency_contact_phone} 
                    onChange={e => setEditForm({...editForm, emergency_contact_phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Input 
                    value={editForm.department} 
                    onChange={e => setEditForm({...editForm, department: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input 
                    value={editForm.position} 
                    onChange={e => setEditForm({...editForm, position: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Files Dialog */}
        <Dialog open={viewFilesDialogOpen} onOpenChange={setViewFilesDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Files for {selectedIntern?.first_name} {selectedIntern?.last_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedIntern && getInternFiles(selectedIntern.id).length === 0 ? (
                <p className="text-center text-slate-500 py-8">No files uploaded</p>
              ) : (
                <div className="space-y-2">
                  {selectedIntern && getInternFiles(selectedIntern.id).map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium">{file.original_name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.file_size)} • {file.category}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Print Template (Hidden) */}
        <div ref={printRef} className="hidden">
          {selectedIntern && (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Intern Profile</h1>
                <p className="text-slate-500">{selectedIntern.intern_code}</p>
              </div>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-lg font-semibold mb-3">Personal Information</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedIntern.first_name} {selectedIntern.last_name}</div>
                    <div><span className="font-medium">Email:</span> {selectedIntern.email}</div>
                    <div><span className="font-medium">SA ID:</span> {selectedIntern.sa_id}</div>
                    <div><span className="font-medium">Date of Birth:</span> {new Date(selectedIntern.date_of_birth).toLocaleDateString()}</div>
                    <div><span className="font-medium">Gender:</span> {selectedIntern.gender}</div>
                    <div><span className="font-medium">Citizenship:</span> {selectedIntern.citizenship}</div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Phone:</span> {selectedIntern.phone || 'N/A'}</div>
                    <div><span className="font-medium">Address:</span> {selectedIntern.address || 'N/A'}</div>
                    <div><span className="font-medium">City:</span> {selectedIntern.city || 'N/A'}</div>
                    <div><span className="font-medium">Province:</span> {selectedIntern.province || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h2 className="text-lg font-semibold mb-3">Work Information</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Department:</span> {selectedIntern.department || 'N/A'}</div>
                    <div><span className="font-medium">Position:</span> {selectedIntern.position || 'N/A'}</div>
                    <div><span className="font-medium">Status:</span> {selectedIntern.user_status}</div>
                    <div><span className="font-medium">Approval:</span> {selectedIntern.approval_status}</div>
                  </div>
                </div>
                
                <div className="text-center text-xs text-slate-400 mt-8">
                  <p>Printed on {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

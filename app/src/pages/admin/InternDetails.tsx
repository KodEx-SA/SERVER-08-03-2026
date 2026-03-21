import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserCheck, UserX, Calendar, Clock, MapPin, FileText, Briefcase } from 'lucide-react';
import { api } from '@/services/api';
import type { Intern, Task, LoginLog, FileItem } from '@/types';
import { toast } from 'sonner';

export default function AdminInternDetails() {
  const { id } = useParams<{ id: string }>();
  const [intern, setIntern] = useState<Intern | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInternDetails();
    }
  }, [id]);

  const fetchInternDetails = async () => {
    try {
      const response = await api.getInternDetails(parseInt(id!));
      setIntern(response.intern);
      setTasks(response.tasks);
      setLoginLogs(response.loginLogs);
      setFiles(response.files);
    } catch (error) {
      toast.error('Failed to load intern details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.approveIntern(parseInt(id!));
      toast.success('Intern approved successfully');
      fetchInternDetails();
    } catch (error) {
      toast.error('Failed to approve intern');
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this intern?')) return;
    
    try {
      await api.rejectIntern(parseInt(id!));
      toast.success('Intern rejected');
      fetchInternDetails();
    } catch (error) {
      toast.error('Failed to reject intern');
    }
  };

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!intern) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Intern not found</p>
          <Button className="mt-4" onClick={() => window.location.href = '/admin/interns'}>
            Back to Interns
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => window.location.href = '/admin/interns'}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {intern.first_name} {intern.last_name}
              </h1>
              <p className="text-slate-600">
                {intern.intern_code} • {getStatusBadge(intern.approval_status)}
              </p>
            </div>
          </div>
          {intern.approval_status === 'pending' && (
            <div className="flex gap-2">
              <Button onClick={handleApprove}>
                <UserCheck className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <UserX className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Contact</h4>
                <div className="space-y-1">
                  <p><span className="text-slate-500">Email:</span> {intern.email}</p>
                  <p><span className="text-slate-500">Phone:</span> {intern.phone || 'N/A'}</p>
                  <p><span className="text-slate-500">SA ID:</span> {intern.sa_id}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">ID Information</h4>
                <div className="space-y-1">
                  <p><span className="text-slate-500">Date of Birth:</span> {new Date(intern.date_of_birth).toLocaleDateString()}</p>
                  <p><span className="text-slate-500">Gender:</span> {intern.gender}</p>
                  <p><span className="text-slate-500">Citizenship:</span> {intern.citizenship}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Work Information</h4>
                <div className="space-y-1">
                  <p><span className="text-slate-500">Department:</span> {intern.department || 'N/A'}</p>
                  <p><span className="text-slate-500">Position:</span> {intern.position || 'N/A'}</p>
                  <p><span className="text-slate-500">Registered:</span> {new Date(intern.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">
              <Briefcase className="w-4 h-4 mr-2" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="logins">
              <MapPin className="w-4 h-4 mr-2" />
              Login History ({loginLogs.length})
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="w-4 h-4 mr-2" />
              Files ({files.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No tasks logged yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{new Date(task.task_date).toLocaleDateString()}</TableCell>
                          <TableCell>{task.title}</TableCell>
                          <TableCell>
                            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.hours_spent || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logins">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
              </CardHeader>
              <CardContent>
                {loginLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No login history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loginLogs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{new Date(log.login_time).toLocaleDateString()}</span>
                              <Clock className="w-4 h-4 text-slate-400 ml-2" />
                              <span>{new Date(log.login_time).toLocaleTimeString()}</span>
                              {!log.logout_time && (
                                <Badge className="bg-green-500">Active</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {log.browser} on {log.os}
                            </p>
                            <p className="text-sm text-slate-500">IP: {log.ip_address}</p>
                          </div>
                          {log.login_latitude && (
                            <div className="text-sm">
                              <p className="font-mono text-slate-600">
                                Lat: {log.login_latitude.toFixed(6)}
                              </p>
                              <p className="font-mono text-slate-600">
                                Lng: {log.login_longitude?.toFixed(6)}
                              </p>
                              {log.login_accuracy && (
                                <p className="text-xs text-slate-500">
                                  Accuracy: ±{Math.round(log.login_accuracy)}m
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No files uploaded yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>{file.original_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{file.category || 'general'}</Badge>
                          </TableCell>
                          <TableCell>{(file.file_size / 1024).toFixed(1)} KB</TableCell>
                          <TableCell>{new Date(file.uploaded_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

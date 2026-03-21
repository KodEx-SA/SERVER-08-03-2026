import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InternLayout } from '@/components/layouts/InternLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, MapPin, User, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import type { Task, LoginLog } from '@/types';
import { toast } from 'sonner';

export default function InternDashboard() {
  const { } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, tasksRes, historyRes] = await Promise.all([
        api.getProfile(),
        api.getTasks(),
        api.getLoginHistory()
      ]);

      setProfile(profileRes.profile);
      setTasks(tasksRes.tasks.slice(0, 5));
      setLoginHistory(historyRes.history.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <InternLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </InternLayout>
    );
  }

  const todayTasks = tasks.filter(t => {
    const taskDate = new Date(t.task_date).toDateString();
    const today = new Date().toDateString();
    return taskDate === today;
  });

  const totalHoursThisWeek = tasks
    .filter(t => {
      const taskDate = new Date(t.task_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return taskDate >= weekAgo;
    })
    .reduce((sum, t) => sum + (t.hours_spent || 0), 0);

  return (
    <InternLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {profile?.first_name} {profile?.last_name}!
            </h1>
            <p className="text-slate-600 mt-1">
              Intern Code: <span className="font-mono font-medium">{profile?.intern_code}</span>
            </p>
          </div>
          <Badge variant={profile?.approval_status === 'approved' ? 'default' : 'secondary'}>
            {profile?.approval_status === 'approved' ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> {profile?.approval_status}</>
            )}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Today's Tasks</CardTitle>
              <Calendar className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              <p className="text-xs text-slate-500">tasks logged today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Hours This Week</CardTitle>
              <Clock className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHoursThisWeek.toFixed(1)}</div>
              <p className="text-xs text-slate-500">hours worked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Tasks</CardTitle>
              <Briefcase className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-slate-500">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Department</CardTitle>
              <User className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{profile?.department || 'N/A'}</div>
              <p className="text-xs text-slate-500">{profile?.position || 'No position'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Tasks</CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/tasks'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No tasks logged yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => window.location.href = '/tasks'}
                  >
                    Log Your First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-slate-500">{task.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(task.task_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                        {task.hours_spent && (
                          <p className="text-xs text-slate-500 mt-1">{task.hours_spent}h</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Login Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Login Activity</CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/login-history'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loginHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No login history available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loginHistory.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(log.login_time).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {log.browser} on {log.os}
                        </p>
                        {log.login_latitude && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {log.login_latitude.toFixed(6)}, {log.login_longitude?.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(log.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {log.logout_time && (
                          <p className="text-xs text-slate-500">
                            to {new Date(log.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center" onClick={() => window.location.href = '/tasks'}>
                <Briefcase className="w-6 h-6 mb-2" />
                <span>Log Task</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center" onClick={() => window.location.href = '/files'}>
                <FileText className="w-6 h-6 mb-2" />
                <span>Upload File</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center" onClick={() => window.location.href = '/profile'}>
                <User className="w-6 h-6 mb-2" />
                <span>My Profile</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center" onClick={() => window.location.href = '/login-history'}>
                <MapPin className="w-6 h-6 mb-2" />
                <span>Login History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </InternLayout>
  );
}

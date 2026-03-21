import { useEffect, useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Monitor, Globe, Clock, Calendar, Navigation } from 'lucide-react';
import { api } from '@/services/api';
import type { LoginLog } from '@/types';
import { toast } from 'sonner';

export default function InternLoginHistory() {
  const [history, setHistory] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.getLoginHistory();
      setHistory(response.history);
    } catch (error) {
      toast.error('Failed to load login history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (login: string, logout?: string) => {
    if (!logout) return 'Active';
    const start = new Date(login).getTime();
    const end = new Date(logout).getTime();
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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

  return (
    <InternLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Login History</h1>
          <p className="text-slate-600">View your login activity and location history</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{history.length}</div>
              <p className="text-sm text-slate-500">Total Logins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {history.filter(h => !h.logout_time).length}
              </div>
              <p className="text-sm text-slate-500">Active Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {history.filter(h => h.login_latitude).length}
              </div>
              <p className="text-sm text-slate-500">With GPS Data</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {history.filter(h => new Date(h.login_time).toDateString() === new Date().toDateString()).length}
              </div>
              <p className="text-sm text-slate-500">Today's Logins</p>
            </CardContent>
          </Card>
        </div>

        {/* Login History List */}
        <Card>
          <CardHeader>
            <CardTitle>Login Sessions ({history.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No login history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((log, index) => (
                  <div key={log.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Session Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">Session #{history.length - index}</h4>
                          {!log.logout_time ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Closed</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(log.login_time).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            {new Date(log.login_time).toLocaleTimeString()} 
                            {log.logout_time && ` - ${new Date(log.logout_time).toLocaleTimeString()}`}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Monitor className="w-4 h-4" />
                            {log.browser || 'Unknown'} on {log.os || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Globe className="w-4 h-4" />
                            {log.ip_address || 'Unknown IP'}
                          </div>
                        </div>

                        {log.logout_time && (
                          <div className="mt-2 text-sm text-slate-500">
                            Duration: <span className="font-medium">{formatDuration(log.login_time, log.logout_time)}</span>
                          </div>
                        )}
                      </div>

                      {/* GPS Location */}
                      {log.login_latitude && (
                        <div className="md:w-64 p-3 bg-slate-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Navigation className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Login Location</span>
                          </div>
                          <div className="text-sm space-y-1">
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
                        </div>
                      )}

                      {/* Logout Location */}
                      {log.logout_latitude && (
                        <div className="md:w-64 p-3 bg-slate-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Navigation className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-sm">Logout Location</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="font-mono text-slate-600">
                              Lat: {log.logout_latitude.toFixed(6)}
                            </p>
                            <p className="font-mono text-slate-600">
                              Lng: {log.logout_longitude?.toFixed(6)}
                            </p>
                            {log.logout_accuracy && (
                              <p className="text-xs text-slate-500">
                                Accuracy: ±{Math.round(log.logout_accuracy)}m
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">About GPS Tracking</h4>
                <p className="text-sm text-blue-700 mt-1">
                  For accurate location tracking, please allow location access when prompted during login and logout. 
                  This helps us maintain security and verify your attendance. Your location data is securely stored 
                  and only accessible to authorized administrators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </InternLayout>
  );
}

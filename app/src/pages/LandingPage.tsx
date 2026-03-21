import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Shield, Briefcase } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-6">
            <Briefcase className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Intern Management System
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            A comprehensive platform for managing interns, tracking attendance, and monitoring progress
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Portal */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Admin Portal</h2>
                <p className="text-slate-600 mb-6">
                  For Super Admins and Administrators to manage interns, approve registrations, and view reports
                </p>
                <ul className="text-left text-sm text-slate-500 mb-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Approve or reject intern registrations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    View intern profiles and activity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Monitor login history and GPS tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Access dashboard statistics
                  </li>
                </ul>
                <Link to="/admin/login" className="w-full">
                  <Button className="w-full" size="lg">
                    <Shield className="w-4 h-4 mr-2" />
                    Access Admin Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Intern Portal */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Intern Portal</h2>
                <p className="text-slate-600 mb-6">
                  For interns to log daily tasks, upload documents, and view their profile
                </p>
                <ul className="text-left text-sm text-slate-500 mb-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Log daily tasks and hours worked
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Upload and manage documents
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    View login history with GPS tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Update personal profile
                  </li>
                </ul>
                <Link to="/intern/login" className="w-full">
                  <Button className="w-full" variant="outline" size="lg">
                    <User className="w-4 h-4 mr-2" />
                    Access Intern Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>New intern? <Link to="/register" className="text-primary hover:underline font-medium">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}

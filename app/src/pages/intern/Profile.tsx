import { useEffect, useState } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, MapPin, Briefcase, IdCard, Calendar, Users, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function InternProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.getProfile();
      setProfile(response.profile);
      setFormData({
        phone: response.profile.phone || '',
        address: response.profile.address || '',
        city: response.profile.city || '',
        province: response.profile.province || '',
        postalCode: response.profile.postal_code || '',
        emergencyContactName: response.profile.emergency_contact_name || '',
        emergencyContactPhone: response.profile.emergency_contact_phone || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(formData);
      toast.success('Profile updated successfully');
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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

  return (
    <InternLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Profile</h1>
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
          )}
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="work">Work Information</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Intern Code</Label>
                    <p className="font-mono font-medium text-lg">{profile?.intern_code}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">First Name</Label>
                    <p className="font-medium">{profile?.first_name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Last Name</Label>
                    <p className="font-medium">{profile?.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">SA ID Number</Label>
                    <p className="font-mono font-medium">{profile?.sa_id}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Status</Label>
                    <div>
                      <Badge variant={profile?.approval_status === 'approved' ? 'default' : 'secondary'}>
                        {profile?.approval_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ID Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="w-5 h-5" />
                  ID Information (Auto-extracted)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Date of Birth</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(profile?.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Gender</Label>
                    <p className="font-medium">{profile?.gender}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Citizenship</Label>
                    <p className="font-medium">{profile?.citizenship}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Age</Label>
                    <p className="font-medium">
                      {Math.floor((new Date().getTime() - new Date(profile?.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+27 12 345 6789"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-slate-500">Phone Number</Label>
                    <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Johannesburg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="province">Province</Label>
                        <select
                          id="province"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">Select Province</option>
                          <option value="Eastern Cape">Eastern Cape</option>
                          <option value="Free State">Free State</option>
                          <option value="Gauteng">Gauteng</option>
                          <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                          <option value="Limpopo">Limpopo</option>
                          <option value="Mpumalanga">Mpumalanga</option>
                          <option value="North West">North West</option>
                          <option value="Northern Cape">Northern Cape</option>
                          <option value="Western Cape">Western Cape</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="2000"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-slate-500">Street Address</Label>
                      <p className="font-medium">{profile?.address || 'Not provided'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-slate-500">City</Label>
                        <p className="font-medium">{profile?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Province</Label>
                        <p className="font-medium">{profile?.province || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Postal Code</Label>
                        <p className="font-medium">{profile?.postal_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Work Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Department</Label>
                    <p className="font-medium">{profile?.department || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Position</Label>
                    <p className="font-medium">{profile?.position || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Member Since</Label>
                    <p className="font-medium">
                      {new Date(profile?.user_created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        placeholder="+27 12 345 6789"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-500">Contact Name</Label>
                      <p className="font-medium">{profile?.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Contact Phone</Label>
                      <p className="font-medium">{profile?.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editMode && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        )}
      </div>
    </InternLayout>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, Mail, Lock, Phone, MapPin, IdCard } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface SAIdInfo {
  valid: boolean;
  dateOfBirth?: string;
  gender?: string;
  citizenship?: string;
  age?: number;
  error?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saIdInfo, setSaIdInfo] = useState<SAIdInfo | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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

  const validateSAId = (id: string): SAIdInfo => {
    // Remove spaces and hyphens
    const cleanId = id.replace(/[\s-]/g, '');

    if (cleanId.length !== 13) {
      return { valid: false, error: 'ID number must be 13 digits' };
    }

    if (!/^\d{13}$/.test(cleanId)) {
      return { valid: false, error: 'ID number must contain only digits' };
    }

    // Extract date of birth
    const yearPrefix = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const day = parseInt(cleanId.substring(4, 6));

    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100);
    const year = (yearPrefix > (currentYear % 100)) ? 
      ((currentCentury - 1) * 100 + yearPrefix) : 
      (currentCentury * 100 + yearPrefix);

    const dateOfBirth = new Date(year, month - 1, day);
    
    if (isNaN(dateOfBirth.getTime()) || dateOfBirth.getDate() !== day || dateOfBirth.getMonth() !== month - 1) {
      return { valid: false, error: 'Invalid date of birth in ID number' };
    }

    // Extract gender
    const genderDigit = parseInt(cleanId.charAt(6));
    const gender = genderDigit >= 5 ? 'Male' : 'Female';

    // Extract citizenship
    const citizenshipDigit = parseInt(cleanId.charAt(10));
    const citizenship = citizenshipDigit === 0 ? 'South African Citizen' : 'Permanent Resident';

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    // Format date as YYYY-MM-DD using local timezone (not UTC)
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      valid: true,
      dateOfBirth: formattedDate,
      gender,
      citizenship,
      age
    };
  };

  const handleSAIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, saId: value }));
    
    if (value.length >= 13) {
      const info = validateSAId(value);
      setSaIdInfo(info);
    } else {
      setSaIdInfo(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.firstName || !formData.lastName || !formData.saId) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!saIdInfo?.valid) {
      setError('Please enter a valid South African ID number');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        saId: formData.saId,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        department: formData.department,
        position: formData.position
      });

      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="pl-10"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="saId">South African ID Number *</Label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="saId"
            name="saId"
            placeholder="0000000000000"
            value={formData.saId}
            onChange={handleSAIdChange}
            maxLength={13}
            className="pl-10"
            required
          />
        </div>
        {saIdInfo && (
          <div className={`p-3 rounded-lg text-sm ${saIdInfo.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {saIdInfo.valid ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Valid ID Number</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-green-600">
                  <div>Date of Birth: {saIdInfo.dateOfBirth}</div>
                  <div>Age: {saIdInfo.age}</div>
                  <div>Gender: {saIdInfo.gender}</div>
                  <div>Citizenship: {saIdInfo.citizenship}</div>
                </div>
              </div>
            ) : (
              <span className="text-red-600">{saIdInfo.error}</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="phone"
            name="phone"
            placeholder="+27 12 345 6789"
            value={formData.phone}
            onChange={handleChange}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="address"
            name="address"
            placeholder="123 Main Street"
            value={formData.address}
            onChange={handleChange}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            placeholder="Johannesburg"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
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

      <div className="space-y-2">
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input
          id="postalCode"
          name="postalCode"
          placeholder="2000"
          value={formData.postalCode}
          onChange={handleChange}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Emergency Contact</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              placeholder="Jane Doe"
              value={formData.emergencyContactName}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              placeholder="+27 12 345 6789"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Work Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              placeholder="IT"
              value={formData.department}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              placeholder="Software Developer Intern"
              value={formData.position}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Intern Registration</CardTitle>
              <Badge variant="secondary">Step {step} of 3</Badge>
            </div>
            <CardDescription>
              {step === 1 && 'Create your account credentials'}
              {step === 2 && 'Enter your personal information'}
              {step === 3 && 'Additional details (optional)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {step === 3 ? 'Registering...' : 'Please wait...'}
                    </>
                  ) : (
                    step === 3 ? 'Complete Registration' : 'Continue'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

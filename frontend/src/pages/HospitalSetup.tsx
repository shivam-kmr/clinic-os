import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setupApi } from '@/lib/api';
import { LogOut, Building2, Settings, Users, UserPlus, Plus, UserCheck } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface CreateHospitalData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  subdomain?: string;
  managerEmails?: string[];
}

interface UpdateConfigData {
  queueType?: string;
  tokenPrefix?: string;
  [key: string]: unknown;
}

interface CreateDepartmentData {
  name: string;
  description?: string;
}

interface CreateDoctorData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  departmentId?: string;
}

interface CreateReceptionistData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
}

export default function HospitalSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<'hospital' | 'config' | 'departments' | 'doctors' | 'receptionists'>('hospital');

  // Get current setup data
  const { data: setupData, refetch } = useQuery({
    queryKey: ['hospital-setup'],
    queryFn: async () => {
      const response = await setupApi.getSetup();
      return response.data.data;
    },
    retry: false,
  });

  const hospital = setupData?.hospital;
  const hasHospital = !!hospital;

  // Create hospital mutation
  const createHospitalMutation = useMutation({
    mutationFn: (data: CreateHospitalData) => setupApi.createHospital(data),
    onSuccess: () => {
      // Update user data in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.role = 'HOSPITAL_OWNER';
        localStorage.setItem('user', JSON.stringify(user));
      }
      refetch();
      setActiveStep('config');
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: UpdateConfigData) => setupApi.updateConfig(data),
    onSuccess: () => {
      refetch();
    },
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: (data: CreateDepartmentData) => setupApi.createDepartment(data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup'] });
    },
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: (data: CreateDoctorData) => setupApi.createDoctor(data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup'] });
    },
  });

  // Create receptionist mutation
  const createReceptionistMutation = useMutation({
    mutationFn: (data: CreateReceptionistData) => setupApi.createReceptionist(data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup'] });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Auto-advance steps if hospital exists
  useEffect(() => {
    if (hasHospital && activeStep === 'hospital') {
      setActiveStep('config');
    }
  }, [hasHospital, activeStep]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Hospital Setup</h1>
            <p className="text-gray-600 mt-1">Configure your clinic management system</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Steps Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          <Button
            variant={activeStep === 'hospital' ? 'default' : 'outline'}
            onClick={() => setActiveStep('hospital')}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Hospital
          </Button>
          <Button
            variant={activeStep === 'config' ? 'default' : 'outline'}
            onClick={() => setActiveStep('config')}
            disabled={!hasHospital}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
          <Button
            variant={activeStep === 'departments' ? 'default' : 'outline'}
            onClick={() => setActiveStep('departments')}
            disabled={!hasHospital}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Departments
          </Button>
          <Button
            variant={activeStep === 'doctors' ? 'default' : 'outline'}
            onClick={() => setActiveStep('doctors')}
            disabled={!hasHospital}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Doctors
          </Button>
          <Button
            variant={activeStep === 'receptionists' ? 'default' : 'outline'}
            onClick={() => setActiveStep('receptionists')}
            disabled={!hasHospital}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Receptionists
          </Button>
        </div>

        {/* Step Content */}
        {activeStep === 'hospital' && (
          <HospitalForm
            hospital={hospital}
            onSubmit={(data: CreateHospitalData) => createHospitalMutation.mutate(data)}
            isLoading={createHospitalMutation.isPending}
          />
        )}

        {activeStep === 'config' && hasHospital && (
          <ConfigForm
            config={setupData?.config}
            onSubmit={(data: UpdateConfigData) => updateConfigMutation.mutate(data)}
            isLoading={updateConfigMutation.isPending}
          />
        )}

        {activeStep === 'departments' && hasHospital && (
          <DepartmentsSection
            departments={setupData?.departments || []}
            onCreate={(data: CreateDepartmentData) => createDepartmentMutation.mutate(data)}
            isLoading={createDepartmentMutation.isPending}
          />
        )}

        {activeStep === 'doctors' && hasHospital && (
          <DoctorsSection
            departments={setupData?.departments || []}
            doctors={setupData?.doctors || []}
            onCreate={(data: CreateDoctorData) => createDoctorMutation.mutate(data)}
            isLoading={createDoctorMutation.isPending}
          />
        )}

        {activeStep === 'receptionists' && hasHospital && (
          <ReceptionistsSection
            departments={setupData?.departments || []}
            receptionists={setupData?.receptionists || []}
            onCreate={(data: CreateReceptionistData) => createReceptionistMutation.mutate(data)}
            isLoading={createReceptionistMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// Hospital Form Component
function HospitalForm({ hospital, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: hospital?.name || '',
    address: hospital?.address || '',
    phone: hospital?.phone || '',
    email: hospital?.email || '',
    subdomain: hospital?.subdomain || '',
    managerEmails: hospital?.managerEmails?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const managerEmailsArray = formData.managerEmails
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);
    onSubmit({
      ...formData,
      managerEmails: managerEmailsArray,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Hospital</CardTitle>
        <CardDescription>Enter your hospital information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hospital Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter hospital name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Enter hospital address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Subdomain (for {formData.subdomain || 'yourhospital'}.clinicos.com)
            </label>
            <input
              type="text"
              value={formData.subdomain}
              onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="yourhospital"
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, and hyphens. Will be used for your patient portal URL.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Additional Managers (Optional)
            </label>
            <input
              type="text"
              value={formData.managerEmails}
              onChange={(e) => setFormData({ ...formData, managerEmails: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="manager1@example.com, manager2@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list of email addresses for additional hospital managers
            </p>
          </div>
          <Button type="submit" disabled={isLoading}>
            {hospital ? 'Update Hospital' : 'Create Hospital'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Config Form Component
function ConfigForm({ config, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    bookingMode: config?.bookingMode || 'TOKEN_ONLY',
    defaultConsultationDuration: config?.defaultConsultationDuration || 15,
    bufferTimeBetweenAppointments: config?.bufferTimeBetweenAppointments || 5,
    arrivalWindowBeforeAppointment: config?.arrivalWindowBeforeAppointment || 15,
    tokenResetFrequency: config?.tokenResetFrequency || 'DAILY',
    autoReassignOnLeave: config?.autoReassignOnLeave || false,
    maxQueueLength: config?.maxQueueLength || '',
    businessHours: config?.businessHours || {
      monday: { start: '10:00', end: '18:00', isOpen: true },
      tuesday: { start: '10:00', end: '18:00', isOpen: true },
      wednesday: { start: '10:00', end: '18:00', isOpen: true },
      thursday: { start: '10:00', end: '18:00', isOpen: true },
      friday: { start: '10:00', end: '18:00', isOpen: true },
      saturday: { start: '10:00', end: '18:00', isOpen: true },
      sunday: { start: '10:00', end: '18:00', isOpen: false },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      maxQueueLength: formData.maxQueueLength ? parseInt(formData.maxQueueLength) : undefined,
    });
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      businessHours: {
        ...formData.businessHours,
        [day]: {
          ...formData.businessHours[day],
          [field]: value,
        },
      },
    });
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Configuration</CardTitle>
        <CardDescription>Configure your hospital settings and working hours</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Booking Mode</label>
            <select
              value={formData.bookingMode}
              onChange={(e) => setFormData({ ...formData, bookingMode: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="TOKEN_ONLY">Token Only</option>
              <option value="TIME_SLOT_ONLY">Time Slot Only</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Consultation Duration (min)</label>
              <input
                type="number"
                value={formData.defaultConsultationDuration}
                onChange={(e) => setFormData({ ...formData, defaultConsultationDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Buffer Time (min)</label>
              <input
                type="number"
                value={formData.bufferTimeBetweenAppointments}
                onChange={(e) => setFormData({ ...formData, bufferTimeBetweenAppointments: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Arrival Window (min)</label>
              <input
                type="number"
                value={formData.arrivalWindowBeforeAppointment}
                onChange={(e) => setFormData({ ...formData, arrivalWindowBeforeAppointment: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Token Reset Frequency</label>
            <select
              value={formData.tokenResetFrequency}
              onChange={(e) => setFormData({ ...formData, tokenResetFrequency: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="NEVER">Never</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Queue Length (optional)</label>
            <input
              type="number"
              value={formData.maxQueueLength}
              onChange={(e) => setFormData({ ...formData, maxQueueLength: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Leave empty for no limit"
              min="1"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoReassignOnLeave}
                onChange={(e) => setFormData({ ...formData, autoReassignOnLeave: e.target.checked })}
              />
              Auto-reassign patients when doctor goes on leave
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Business Hours</label>
            <div className="space-y-2">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-4 p-2 border rounded">
                  <div className="w-24 capitalize">{day}</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.businessHours[day]?.isOpen || false}
                      onChange={(e) => updateBusinessHours(day, 'isOpen', e.target.checked)}
                    />
                    Open
                  </label>
                  {formData.businessHours[day]?.isOpen && (
                    <>
                      <input
                        type="time"
                        value={formData.businessHours[day]?.start || '10:00'}
                        onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                        className="px-2 py-1 border rounded"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={formData.businessHours[day]?.end || '18:00'}
                        onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                        className="px-2 py-1 border rounded"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            Save Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Departments Section
function DepartmentsSection({ departments, onCreate, isLoading }: any) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({ name: '', description: '' });
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Manage your hospital departments</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Department Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Cardiology"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                placeholder="Department description"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Create
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {departments.length > 0 ? (
            departments.map((dept: Department) => (
              <div key={dept.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{dept.name}</div>
                  {dept.description && (
                    <div className="text-sm text-gray-500">{dept.description}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No departments yet. Add your first department to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Doctors Section
function DoctorsSection({ departments, doctors, onCreate, isLoading }: any) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    departmentId: '',
    employeeId: '',
    specialization: '',
    consultationDuration: '',
    dailyPatientLimit: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      consultationDuration: formData.consultationDuration ? parseInt(formData.consultationDuration) : undefined,
      dailyPatientLimit: formData.dailyPatientLimit ? parseInt(formData.dailyPatientLimit) : undefined,
    });
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      employeeId: '',
      specialization: '',
      consultationDuration: '',
      dailyPatientLimit: '',
    });
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Doctors</CardTitle>
            <CardDescription>Add doctors to your hospital</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} disabled={departments.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {departments.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Please create at least one department before adding doctors.
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="doctor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Password"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select department</option>
                {departments.map((dept: Department) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Cardiology"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Consultation Duration (min)</label>
                <input
                  type="number"
                  value={formData.consultationDuration}
                  onChange={(e) => setFormData({ ...formData, consultationDuration: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  min="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Daily Patient Limit</label>
                <input
                  type="number"
                  value={formData.dailyPatientLimit}
                  onChange={(e) => setFormData({ ...formData, dailyPatientLimit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Create Doctor
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {doctors.length > 0 ? (
            doctors.map((doctor: any) => (
              <div key={doctor.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {doctor.user?.firstName} {doctor.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {doctor.user?.email} • {doctor.department?.name}
                    {doctor.specialization && ` • ${doctor.specialization}`}
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No doctors yet. Add your first doctor to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Receptionists Section
function ReceptionistsSection({ departments, receptionists, onCreate, isLoading }: any) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    departmentId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      departmentId: formData.departmentId || undefined,
    });
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      departmentId: '',
    });
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Receptionists</CardTitle>
            <CardDescription>Add receptionists to your hospital</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Receptionist
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="receptionist@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Password"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department (Optional)</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Departments (Hospital-wide)</option>
                {departments.map((dept: Department) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for hospital-wide access, or assign to a specific department
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Create Receptionist
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {receptionists.length > 0 ? (
            receptionists.map((receptionist: any) => (
              <div key={receptionist.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {receptionist.firstName} {receptionist.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{receptionist.email}</div>
                </div>
                <Badge variant="default">Receptionist</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No receptionists yet. Add your first receptionist to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


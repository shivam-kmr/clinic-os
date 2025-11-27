import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { patientApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'TOKEN' | 'TIME_SLOT'>('TOKEN');
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await patientApi.getDepartments();
      return response.data;
    },
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors', selectedDepartment],
    queryFn: async () => {
      const response = await patientApi.getDoctors(
        selectedDepartment ? { departmentId: selectedDepartment } : undefined
      );
      return response.data;
    },
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      doctorId?: string;
      departmentId?: string;
      scheduledAt: string;
      type: 'TOKEN' | 'TIME_SLOT';
    }) => patientApi.createAppointment(data),
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment && !selectedDoctor) {
      alert('Please select a department or doctor');
      return;
    }
    if (appointmentType === 'TIME_SLOT' && !scheduledAt) {
      alert('Please select a date and time');
      return;
    }
    createMutation.mutate({
      doctorId: selectedDoctor || undefined,
      departmentId: selectedDepartment || undefined,
      scheduledAt: scheduledAt || new Date().toISOString(),
      type: appointmentType,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Book Appointment</CardTitle>
            <CardDescription>Schedule your visit</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Appointment Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="TOKEN"
                      checked={appointmentType === 'TOKEN'}
                      onChange={(e) => setAppointmentType(e.target.value as 'TOKEN')}
                      className="mr-2"
                    />
                    Token (Walk-in)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="TIME_SLOT"
                      checked={appointmentType === 'TIME_SLOT'}
                      onChange={(e) => setAppointmentType(e.target.value as 'TIME_SLOT')}
                      className="mr-2"
                    />
                    Time Slot
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedDoctor(''); // Reset doctor when department changes
                  }}
                >
                  <option value="">Select Department</option>
                  {departmentsData?.departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Doctor (Optional)</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  disabled={!selectedDepartment}
                >
                  <option value="">Any Available Doctor</option>
                  {doctorsData?.doctors
                    ?.filter((doc: any) => !selectedDepartment || doc.department?.id === selectedDepartment)
                    .map((doctor: any) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                        {doctor.specialization && ` - ${doctor.specialization}`}
                      </option>
                    ))}
                </select>
              </div>

              {appointmentType === 'TIME_SLOT' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required={appointmentType === 'TIME_SLOT'}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


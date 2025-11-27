import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../lib/api';
import { usePatientStore } from '../store/patientStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, LogOut, Plus, History } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const clearPatient = usePatientStore((state) => state.clearPatient);

  const { data: queueData } = useQuery({
    queryKey: ['queue-position'],
    queryFn: async () => {
      const response = await patientApi.getQueuePosition();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await patientApi.getAppointments();
      return response.data;
    },
  });

  const handleLogout = () => {
    clearPatient();
    navigate('/');
  };

  if (!patient) {
    return null;
  }

  const upcomingAppointments = appointmentsData?.appointments?.filter(
    (apt: any) => apt.status === 'CONFIRMED' || apt.status === 'PENDING'
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Patient Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {patient.firstName} {patient.lastName}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Queue Position */}
        {queueData?.inQueue && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Queue Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token Number</span>
                  <Badge variant="default" className="text-lg">
                    {queueData.visit.tokenNumber}
                  </Badge>
                </div>
                {queueData.visit.position && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Position in Queue</span>
                    <span className="text-lg font-semibold">
                      #{queueData.visit.position}
                    </span>
                  </div>
                )}
                {queueData.visit.estimatedWaitTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Wait</span>
                    <span className="text-lg font-semibold">
                      ~{queueData.visit.estimatedWaitTime} minutes
                    </span>
                  </div>
                )}
                {queueData.visit.doctor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Doctor</span>
                    <span>{queueData.visit.doctor.name}</span>
                  </div>
                )}
                {queueData.visit.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Department</span>
                    <span>{queueData.visit.department.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/book')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Book Appointment
              </CardTitle>
              <CardDescription>Schedule a new appointment</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/history')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                View History
              </CardTitle>
              <CardDescription>See your appointment history</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{apt.status}</Badge>
                        {apt.type && (
                          <Badge variant="outline">{apt.type}</Badge>
                        )}
                      </div>
                      <p className="font-semibold">
                        {apt.doctor
                          ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`
                          : apt.department?.name || 'Department Appointment'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.scheduledAt), 'PPp')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle cancel/reschedule
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


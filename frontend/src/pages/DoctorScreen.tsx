import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { queueApi, doctorsApi } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { format } from 'date-fns';
import { User, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';

interface QueueItem {
  id: string;
  tokenNumber: number;
  patientName: string;
  status: string;
  priority: string;
  checkedInAt: string;
  estimatedWaitTime: number | null;
  isCarryover: boolean;
}

export default function DoctorScreen() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [onDuty, setOnDuty] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleOnDuty = useMutation({
    mutationFn: (isOnDuty: boolean) => {
      if (!doctorId) throw new Error('Doctor ID required');
      return doctorsApi.updateOnDuty(doctorId, isOnDuty);
    },
    onSuccess: (_, isOnDuty) => {
      setOnDuty(isOnDuty);
    },
  });

  // Fetch initial on-duty status
  useEffect(() => {
    if (doctorId) {
      // Get doctor status from queue data or fetch separately
      // For now, assume ACTIVE = on duty
      setOnDuty(true);
    }
  }, [doctorId]);

  // SSE for real-time updates
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const sseUrl = `${API_BASE_URL}/sse/doctor/${doctorId}`;
  const { data: sseData } = useSSE(sseUrl, !!doctorId, true); // requireAuth = true

  // Fetch queue
  const { data: queueData, refetch } = useQuery({
    queryKey: ['doctor-queue', doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const response = await queueApi.getDoctorQueue(doctorId);
      return response.data.data;
    },
    enabled: !!doctorId,
    refetchInterval: 5000,
  });

  // Refetch when SSE data arrives
  useEffect(() => {
    if (sseData) {
      refetch();
    }
  }, [sseData, refetch]);

  // Call next patient mutation
  const callNextMutation = useMutation({
    mutationFn: () => {
      if (!doctorId) throw new Error('Doctor ID required');
      return queueApi.callNext(doctorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue', doctorId] });
    },
  });

  // Skip patient mutation
  const skipMutation = useMutation({
    mutationFn: (visitId: string) => {
      if (!doctorId) throw new Error('Doctor ID required');
      return queueApi.skip(doctorId, visitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue', doctorId] });
    },
  });

  // Complete visit mutation
  const completeMutation = useMutation({
    mutationFn: (visitId: string) => {
      if (!doctorId) throw new Error('Doctor ID required');
      return queueApi.complete(doctorId, visitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue', doctorId] });
    },
  });

  const currentPatient = queueData?.queue?.find(
    (q: QueueItem) => q.status === 'IN_PROGRESS'
  );

  const waitingQueue = queueData?.queue?.filter(
    (q: QueueItem) => q.status !== 'IN_PROGRESS' && q.status !== 'COMPLETED'
  ) || [];

  const getPriorityBadge = (priority: string) => {
    if (priority === 'VIP') return <Badge variant="warning">VIP</Badge>;
    if (priority === 'URGENT') return <Badge variant="destructive">URGENT</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Doctor Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your patient queue</p>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={onDuty}
              onChange={(e) => toggleOnDuty.mutate(e.target.checked)}
              label="On Duty"
              disabled={toggleOnDuty.isPending}
            />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Current Patient */}
        {currentPatient ? (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    T{currentPatient.tokenNumber}
                  </div>
                  <div className="text-xl font-medium">{currentPatient.patientName}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Checked in: {format(new Date(currentPatient.checkedInAt), 'HH:mm')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(currentPatient.priority)}
                  {currentPatient.isCarryover && (
                    <Badge variant="warning">Carryover</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => completeMutation.mutate(currentPatient.id)}
                    disabled={completeMutation.isPending}
                    className="flex-1 md:flex-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => skipMutation.mutate(currentPatient.id)}
                    disabled={skipMutation.isPending}
                    className="flex-1 md:flex-none"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 mb-4">No patient in progress</p>
              <Button
                onClick={() => callNextMutation.mutate()}
                disabled={callNextMutation.isPending || waitingQueue.length === 0}
                size="lg"
              >
                <User className="h-4 w-4 mr-2" />
                {callNextMutation.isPending
                  ? 'Calling...'
                  : waitingQueue.length > 0
                  ? 'Call Next Patient'
                  : 'No Patients Waiting'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Waiting Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waiting Queue ({waitingQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {waitingQueue.length > 0 ? (
              <div className="space-y-2">
                {waitingQueue.map((item: QueueItem, index: number) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${
                      index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-primary">
                          T{item.tokenNumber}
                        </div>
                        <div>
                          <div className="font-medium">{item.patientName}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(item.checkedInAt), 'HH:mm')}
                            {item.isCarryover && (
                              <Badge variant="warning" className="ml-2">
                                Carryover
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(item.priority)}
                        <Badge variant="secondary">{item.status}</Badge>
                        {item.estimatedWaitTime !== null && (
                          <div className="text-sm text-gray-600">
                            ~{item.estimatedWaitTime} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No patients waiting
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


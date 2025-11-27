import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { queueApi } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { format } from 'date-fns';
import { Clock, Users, Activity, LogOut, ExternalLink } from 'lucide-react';

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

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const hospitalId = '00000000-0000-0000-0000-000000000001'; // From localStorage or context
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  const openWaitingRoom = (departmentId: string) => {
    window.open(`/waiting-room/${departmentId}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // SSE for real-time updates
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const sseUrl = `${API_BASE_URL}/sse/reception/${hospitalId}`;
  const { data: sseData } = useSSE(sseUrl, true, true); // requireAuth = true

  // Fetch queue data
  const { data: queueData, refetch } = useQuery({
    queryKey: ['queue', selectedDoctor, selectedDepartment],
    queryFn: async () => {
      if (selectedDoctor) {
        const response = await queueApi.getDoctorQueue(selectedDoctor);
        return response.data.data;
      } else if (selectedDepartment) {
        const response = await queueApi.getDepartmentQueue(selectedDepartment);
        return response.data.data;
      }
      return null;
    },
    enabled: !!selectedDoctor || !!selectedDepartment,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  });

  // Refetch when SSE data arrives
  useEffect(() => {
    if (sseData) {
      refetch();
    }
  }, [sseData, refetch]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
      WAITING: 'secondary',
      CHECKED_IN: 'default',
      IN_PROGRESS: 'success',
      ON_HOLD: 'warning',
      CARRYOVER: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'VIP') return <Badge variant="warning">VIP</Badge>;
    if (priority === 'URGENT') return <Badge variant="destructive">URGENT</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Reception Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor all queues in real-time</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueData?.totalCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {queueData?.queue?.filter((q: QueueItem) => q.status === 'IN_PROGRESS').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Wait</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {queueData?.queue?.length > 0
                  ? Math.round(
                      queueData.queue.reduce(
                        (acc: number, q: QueueItem) => acc + (q.estimatedWaitTime || 0),
                        0
                      ) / queueData.queue.length
                    )
                  : 0}
                <span className="text-sm font-normal ml-1">min</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Queue to View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDoctor === '00000000-0000-0000-0000-000000000200' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedDoctor('00000000-0000-0000-0000-000000000200');
                  setSelectedDepartment(null);
                }}
              >
                Doctor 1 (Cardiology)
              </Button>
              <Button
                variant={selectedDoctor === '00000000-0000-0000-0000-000000000201' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedDoctor('00000000-0000-0000-0000-000000000201');
                  setSelectedDepartment(null);
                }}
              >
                Doctor 2 (General)
              </Button>
              <Button
                variant={selectedDepartment === '00000000-0000-0000-0000-000000000010' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedDepartment('00000000-0000-0000-0000-000000000010');
                  setSelectedDoctor(null);
                }}
              >
                Cardiology Department
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Waiting Room Display:</p>
              <Button
                variant="outline"
                onClick={() => openWaitingRoom('00000000-0000-0000-0000-000000000010')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Cardiology Waiting Room
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue List */}
        {queueData && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDoctor ? 'Doctor Queue' : 'Department Queue'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueData.queue && queueData.queue.length > 0 ? (
                <div className="space-y-2">
                  {queueData.queue.map((item: QueueItem) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        item.status === 'IN_PROGRESS' ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-primary">
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
                          {getStatusBadge(item.status)}
                          {item.estimatedWaitTime !== null && (
                            <div className="text-sm text-gray-600">
                              ~{item.estimatedWaitTime} min wait
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No patients in queue
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedDoctor && !selectedDepartment && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Select a doctor or department to view queue
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


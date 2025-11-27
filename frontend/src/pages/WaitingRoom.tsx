import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSSE } from '@/hooks/useSSE';
import { Clock, LogOut } from 'lucide-react';

interface QueueItem {
  id: string;
  tokenNumber: number;
  status: string;
  estimatedWaitTime: number | null;
  isCarryover: boolean;
}

export default function WaitingRoom() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Show error if no departmentId
  if (!departmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">Department ID is required</p>
            <p className="text-sm text-gray-500">
              Please access this page with a valid department ID: /waiting-room/:departmentId
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SSE for real-time updates (public view - no auth required)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const sseUrl = `${API_BASE_URL}/sse/waiting-room/${departmentId}`;
  const { data: sseData } = useSSE(sseUrl, !!departmentId, false); // requireAuth = false for public view

  // Fetch queue (using public endpoint)
  const { data: queueData, refetch } = useQuery({
    queryKey: ['waiting-room', departmentId],
    queryFn: async () => {
      if (!departmentId) return null;
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      // Use public endpoint that doesn't require authentication
      const response = await fetch(`${API_BASE_URL}/public/queue/department/${departmentId}`, {
        headers: {
          'Content-Type': 'application/json',
          // Include token if available (optional)
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!departmentId,
    refetchInterval: 5000,
  });

  // Refetch when SSE data arrives
  useEffect(() => {
    if (sseData) {
      refetch();
    }
  }, [sseData, refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Waiting Room
          </h1>
          <p className="text-gray-600">Please wait for your token to be called</p>
        </div>

        {/* Current Token Display */}
        {queueData?.queue && queueData.queue.length > 0 && (
          <Card className="mb-6 border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center">Currently Serving</CardTitle>
            </CardHeader>
            <CardContent>
              {queueData.queue.find((q: QueueItem) => q.status === 'IN_PROGRESS') ? (
                <div className="text-center">
                  <div className="text-6xl md:text-8xl font-bold text-primary mb-4">
                    T{queueData.queue.find((q: QueueItem) => q.status === 'IN_PROGRESS')?.tokenNumber}
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2 bg-green-500">
                    IN PROGRESS
                  </Badge>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Waiting for next patient...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queueData?.queue && queueData.queue.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {queueData.queue.map((item: QueueItem) => (
                  <div
                    key={item.id}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      item.status === 'IN_PROGRESS'
                        ? 'bg-green-100 border-green-400 scale-105 shadow-lg'
                        : item.status === 'CHECKED_IN'
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
                      T{item.tokenNumber}
                    </div>
                    <Badge
                      variant={
                        item.status === 'IN_PROGRESS'
                          ? 'default'
                          : item.status === 'CHECKED_IN'
                          ? 'default'
                          : 'secondary'
                      }
                      className={`text-xs ${
                        item.status === 'IN_PROGRESS' ? 'bg-green-500' : ''
                      }`}
                    >
                      {item.status}
                    </Badge>
                    {item.isCarryover && (
                      <Badge variant="warning" className="text-xs mt-1 block">
                        Carryover
                      </Badge>
                    )}
                    {item.estimatedWaitTime !== null && item.status !== 'IN_PROGRESS' && (
                      <div className="text-xs text-gray-600 mt-2">
                        ~{item.estimatedWaitTime} min
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patients in queue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-white/80">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Please wait for your token number to be displayed</li>
                <li>When your token is called, proceed to the consultation room</li>
                <li>Estimated wait times are approximate</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


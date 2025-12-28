import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSSE } from '@/hooks/useSSE';
import { addMinutes, format } from 'date-fns';
import { Clock } from 'lucide-react';

interface QueueItem {
  id: string;
  tokenNumber: number;
  status: string;
  estimatedWaitTime: number | null;
  isCarryover: boolean;
  checkedInAt?: string;
  startedAt?: string | null;
}

export default function WaitingRoom() {
  const { departmentId } = useParams<{ departmentId: string }>();

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

  const now = useMemo(() => new Date(), [sseData, queueData]);

  const etaLabel = (mins: number) => {
    const eta = addMinutes(now, mins);
    return `~${format(eta, 'h:mma').toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 md:px-10 py-6 md:py-8">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">Waiting Room</h1>
            <p className="text-gray-600 mt-2 text-base md:text-lg">
              Please wait for your token to be called.
            </p>
            {(queueData?.departmentName || queueData?.servingDoctors?.length) && (
              <div className="mt-3 flex flex-col gap-2 text-sm md:text-base text-gray-700">
                {queueData?.departmentName && (
                  <div>
                    <span className="font-semibold">Department:</span> {queueData.departmentName}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Serving today:</span>{' '}
                  {queueData?.servingDoctors?.length
                    ? queueData.servingDoctors.map((d: any) => d.name).join(', ')
                    : '—'}
                </div>
              </div>
            )}
          </div>
          <div className="text-sm md:text-base text-gray-600">
            {format(now, 'h:mma').toLowerCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Current Token Display */}
          <Card className="xl:col-span-1 border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center text-xl md:text-2xl">Currently Serving</CardTitle>
            </CardHeader>
            <CardContent>
              {queueData?.queue?.find((q: QueueItem) => q.status === 'IN_PROGRESS') ? (
                <div className="text-center">
                  <div className="text-7xl md:text-8xl font-extrabold text-primary mb-4 tracking-tight">
                    T{queueData.queue.find((q: QueueItem) => q.status === 'IN_PROGRESS')?.tokenNumber}
                  </div>
                  <Badge variant="default" className="text-base md:text-lg px-4 py-2 bg-green-600">
                    IN PROGRESS
                  </Badge>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10 text-lg">
                  Waiting for next patient…
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue List */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Clock className="h-6 w-6" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueData?.queue && queueData.queue.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {queueData.queue.map((item: QueueItem) => (
                    <div
                      key={item.id}
                      className={`p-4 border-2 rounded-xl text-center transition-all ${
                        item.status === 'IN_PROGRESS'
                          ? 'bg-green-100 border-green-500 shadow-lg'
                          : item.status === 'CHECKED_IN'
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
                        T{item.tokenNumber}
                      </div>
                      <Badge
                        variant={item.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                        className={`text-xs ${item.status === 'IN_PROGRESS' ? 'bg-green-600' : ''}`}
                      >
                        {item.status}
                      </Badge>
                      {item.isCarryover && (
                        <Badge variant="warning" className="text-xs mt-2 block">
                          Carryover
                        </Badge>
                      )}
                      {item.estimatedWaitTime !== null && item.status !== 'IN_PROGRESS' && (
                        <div className="text-xs text-gray-700 mt-2 font-medium">
                          {etaLabel(item.estimatedWaitTime)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="h-14 w-14 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No patients in queue</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6 bg-white/80">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Please wait for your token number to be displayed</li>
                <li>When your token is called, proceed to the consultation room</li>
                <li>Estimated times are approximate and adjust with live doctor pace</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


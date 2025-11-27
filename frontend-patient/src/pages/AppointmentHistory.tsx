import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function AppointmentHistory() {
  const navigate = useNavigate();

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const response = await patientApi.getHistory();
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Appointment History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : historyData?.visits?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No appointment history
              </div>
            ) : (
              <div className="space-y-4">
                {historyData?.visits?.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Token #{visit.tokenNumber}</Badge>
                        <Badge variant="outline">{visit.status}</Badge>
                      </div>
                      <p className="font-semibold">
                        {visit.doctor
                          ? `Dr. ${visit.doctor.firstName} ${visit.doctor.lastName}`
                          : visit.department?.name || 'Department Visit'}
                      </p>
                      {visit.completedAt && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(visit.completedAt), 'PPp')}
                        </p>
                      )}
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


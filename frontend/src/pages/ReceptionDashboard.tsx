import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { queueApi, receptionApi, setupApi } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import { format } from 'date-fns';
import { Clock, Users, Activity, ExternalLink } from 'lucide-react';

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

type SetupDepartment = { id: string; name: string; description?: string };
type SetupDoctor = {
  id: string;
  status?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  department?: { id: string; name: string };
  specialization?: string;
};

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [intake, setIntake] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    age: '',
    gender: 'UNKNOWN',
    issueDescription: '',
    departmentId: '',
    scheduledAt: '',
  });
  const [intakeResult, setIntakeResult] = useState<any>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [intakeLoading, setIntakeLoading] = useState(false);

  const openWaitingRoom = (departmentId: string) => {
    window.open(`/waiting-room/${departmentId}`, '_blank');
  };

  const { data: setupData, isLoading: setupLoading, error: setupError } = useQuery({
    queryKey: ['hospital-setup'],
    queryFn: async () => {
      const response = await setupApi.getSetup();
      return response.data.data as {
        hospital: { id: string; name: string } | null;
        departments: SetupDepartment[];
        doctors: SetupDoctor[];
        departmentConfigs?: Array<{ departmentId: string; bookingMode: string | null }>;
        memberships?: Array<{ hospitalId: string; role: string; departmentId?: string | null }>;
      };
    },
    retry: false,
  });

  const hospitalId = useMemo(() => {
    return localStorage.getItem('activeHospitalId') || setupData?.hospital?.id || null;
  }, [setupData]);

  const departments = setupData?.departments || [];
  const doctors = setupData?.doctors || [];
  const departmentConfigs = setupData?.departmentConfigs || [];
  const myMembership = useMemo(() => {
    const activeHospitalId = localStorage.getItem('activeHospitalId');
    const ms = setupData?.memberships || [];
    if (!activeHospitalId) return ms[0] || null;
    return ms.find((m) => m.hospitalId === activeHospitalId) || ms[0] || null;
  }, [setupData]);
  const scopedDepartmentId = myMembership?.role === 'RECEPTIONIST' ? myMembership?.departmentId || null : null;
  const visibleDepartments = scopedDepartmentId
    ? departments.filter((d) => d.id === scopedDepartmentId)
    : departments;
  const visibleDoctors = scopedDepartmentId
    ? doctors.filter((d) => d.department?.id === scopedDepartmentId)
    : doctors;

  const bookingModeForDept = useMemo(() => {
    const deptId = intake.departmentId;
    if (!deptId) return null;
    return departmentConfigs.find((c) => c.departmentId === deptId)?.bookingMode || null;
  }, [departmentConfigs, intake.departmentId]);

  const doctorLabel = (d: SetupDoctor) => {
    const name = `${d.user?.firstName || ''} ${d.user?.lastName || ''}`.trim() || d.user?.email || 'Doctor';
    const dept = d.department?.name ? ` • ${d.department.name}` : '';
    const spec = d.specialization ? ` • ${d.specialization}` : '';
    return `${name}${dept}${spec}`;
  };

  // SSE for real-time updates
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const sseUrl = hospitalId ? `${API_BASE_URL}/sse/reception/${hospitalId}` : '';
  const { data: sseData } = useSSE(sseUrl, !!hospitalId, true); // requireAuth = true

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
    <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Reception Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor all queues in real-time
              {setupData?.hospital?.name ? ` • ${setupData.hospital.name}` : ''}
            </p>
          </div>
        </div>

      {/* Walk-in intake */}
      <Card>
        <CardHeader>
          <CardTitle>New walk-in</CardTitle>
        </CardHeader>
        <CardContent>
          {intakeResult && (
            <div className="mb-4 p-3 rounded-lg border bg-green-50 border-green-200 text-green-800">
              <div className="font-medium">
                Token T{intakeResult.visit?.tokenNumber} created
              </div>
              <div className="text-sm">
                Assigned doctor:{' '}
                {visibleDoctors.find((d) => d.id === intakeResult.visit?.doctorId)
                  ? doctorLabel(visibleDoctors.find((d) => d.id === intakeResult.visit?.doctorId)!)
                  : intakeResult.visit?.doctorId || '—'}
              </div>
            </div>
          )}
          {intakeError && (
            <div className="mb-4 p-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
              {intakeError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input
                value={intake.phone}
                onChange={(e) => setIntake((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="10-digit phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First name *</label>
              <input
                value={intake.firstName}
                onChange={(e) => setIntake((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last name *</label>
              <input
                value={intake.lastName}
                onChange={(e) => setIntake((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                min={0}
                max={130}
                value={intake.age}
                onChange={(e) => setIntake((p) => ({ ...p, age: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={intake.gender}
                onChange={(e) => setIntake((p) => ({ ...p, gender: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="UNKNOWN">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <select
                value={intake.departmentId}
                onChange={(e) => setIntake((p) => ({ ...p, departmentId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!!scopedDepartmentId}
              >
                <option value="">Select department…</option>
                {visibleDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(bookingModeForDept === 'TIME_SLOT_ONLY' || bookingModeForDept === 'BOTH') && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Time slot *</label>
              <input
                type="datetime-local"
                value={intake.scheduledAt}
                onChange={(e) => setIntake((p) => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full md:w-[320px] px-3 py-2 border rounded-md"
              />
              <div className="text-xs text-gray-500 mt-1">
                This department uses time slots. Choose a time.
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Issue (optional)</label>
            <textarea
              value={intake.issueDescription}
              onChange={(e) => setIntake((p) => ({ ...p, issueDescription: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              placeholder="Short note…"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={async () => {
                setIntakeError(null);
                setIntakeResult(null);
                if (!intake.phone || !intake.firstName || !intake.lastName || !intake.departmentId) {
                  setIntakeError('Phone, first name, last name, and department are required.');
                  return;
                }
                if (
                  (bookingModeForDept === 'TIME_SLOT_ONLY' || bookingModeForDept === 'BOTH') &&
                  !intake.scheduledAt
                ) {
                  setIntakeError('Please select a time slot for this department.');
                  return;
                }
                try {
                  setIntakeLoading(true);
                  const payload: any = {
                    phone: intake.phone,
                    firstName: intake.firstName,
                    lastName: intake.lastName,
                    age: intake.age ? Number(intake.age) : undefined,
                    gender: intake.gender,
                    issueDescription: intake.issueDescription || undefined,
                    departmentId: intake.departmentId,
                    scheduledAt: intake.scheduledAt ? new Date(intake.scheduledAt).toISOString() : undefined,
                  };
                  const resp = await receptionApi.intake(payload);
                  setIntakeResult(resp.data.data);
                  // set selected department to view queue immediately
                  setSelectedDepartment(intake.departmentId);
                  setSelectedDoctor(null);
                  // Clear note but keep department for faster entry
                  setIntake((p) => ({ ...p, issueDescription: '', scheduledAt: '' }));
                } catch (e: any) {
                  setIntakeError(e?.response?.data?.error?.message || 'Failed to create token');
                } finally {
                  setIntakeLoading(false);
                }
              }}
              disabled={intakeLoading}
            >
              {intakeLoading ? 'Creating…' : 'Create token / slot'}
            </Button>
          </div>
        </CardContent>
      </Card>

        {setupLoading && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-gray-500">Loading hospital data…</CardContent>
          </Card>
        )}

        {setupError && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-red-600">
              Failed to load hospital data. Please refresh.
            </CardContent>
          </Card>
        )}

        {!setupLoading && !setupError && !hospitalId && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-gray-600">
              Hospital context not found. Complete setup first.
              <div className="mt-4">
                <Button onClick={() => navigate('/setup')}>Go to Setup</Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Doctor Queue</label>
                <select
                  value={selectedDoctor || ''}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setSelectedDoctor(val);
                    if (val) setSelectedDepartment(null);
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select a doctor…</option>
                  {visibleDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {doctorLabel(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Queue</label>
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setSelectedDepartment(val);
                    if (val) setSelectedDoctor(null);
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select a department…</option>
                  {visibleDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">Waiting Room Display:</p>
              <Button
                variant="outline"
                onClick={() => selectedDepartment && openWaitingRoom(selectedDepartment)}
                className="flex items-center gap-2"
                disabled={!selectedDepartment}
              >
                <ExternalLink className="h-4 w-4" />
                Open Waiting Room
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
  );
}


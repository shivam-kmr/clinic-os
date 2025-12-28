import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, setupApi } from '@/lib/api';
import {
  getActiveHospitalId,
  getActiveMembership,
  getMemberships,
  getStoredUser,
  setActiveHospitalId,
  type Membership,
} from '@/lib/clinic';
import {
  Plus,
  Settings,
  Building2,
  Users,
  Stethoscope,
  UserCog,
  Radio,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import noClinicsIllustration from '@/assets/undraw/no_clinics.svg';
import selectClinicIllustration from '@/assets/undraw/select_clinic.svg';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const memberships = useMemo(() => getMemberships(user), [user]);
  const activeHospitalId = getActiveHospitalId();
  const activeMembership = getActiveMembership(user);
  const canManageSetup =
    activeMembership?.role === 'HOSPITAL_OWNER' ||
    activeMembership?.role === 'HOSPITAL_MANAGER' ||
    user?.role === 'SUPERADMIN';

  const { data: clinicsFromApi } = useQuery({
    queryKey: ['auth-clinics'],
    queryFn: async () => {
      const response = await api.get('/auth/clinics');
      return response.data.data as Membership[];
    },
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });

  // Prefer server truth when present
  const effectiveMemberships = clinicsFromApi || memberships;

  const needsClinic = effectiveMemberships.length === 0;
  const needsSelection = effectiveMemberships.length > 0 && !activeHospitalId;

  const { data: setupData } = useQuery({
    queryKey: ['hospital-setup', activeHospitalId],
    queryFn: async () => {
      const response = await setupApi.getSetup();
      return response.data.data as any;
    },
    enabled: !!activeHospitalId && !!canManageSetup,
    retry: false,
  });

  const setupProgress = useMemo(() => {
    const hasHospital = !!setupData?.hospital;
    const hasConfig = !!setupData?.config;
    const hasDepartments = (setupData?.departments || []).length > 0;
    const hasDoctors = (setupData?.doctors || []).length > 0;
    const hasReceptionists = (setupData?.receptionists || []).length > 0;

    return {
      hasHospital,
      hasConfig,
      hasDepartments,
      hasDoctors,
      hasReceptionists,
      isComplete: hasHospital && hasConfig && hasDepartments && hasDoctors && hasReceptionists,
    };
  }, [setupData]);

  return (
    <div className="space-y-6">
        {/* Empty state */}
        {needsClinic && (
          <Card>
            <CardContent className="py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Getting started
                  </div>
                  <div className="text-2xl font-semibold">No clinic configured</div>
                  <div className="text-sm text-gray-600 mt-2 max-w-md">
                    Create your first clinic to start using Clinic OS. You can manage multiple clinics and switch between them anytime.
                  </div>
                  <div className="mt-6">
                    <Button onClick={() => navigate('/setup')} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create clinic
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <img
                    src={noClinicsIllustration}
                    alt="No clinics illustration"
                    className="w-full max-w-xl max-h-[280px] object-contain"
                  />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick start checklist */}
                  <div className="rounded-lg border bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold">Quick start</div>
                      <div className="text-xs text-gray-500">~5 min</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => navigate('/setup?step=hospital')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">Create clinic</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => navigate('/setup?step=config')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Settings className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">Configure hours</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => navigate('/setup?step=departments')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">Add departments</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => navigate('/setup?step=doctors')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">Add doctors</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => navigate('/setup?step=receptionists')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserCog className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">Add reception</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </button>
                      <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left bg-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium truncate text-gray-600">
                            Go live
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">done</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature grid */}
                  <div className="rounded-lg border bg-white p-5">
                    <div className="font-semibold mb-4">What you get</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-md border p-3">
                        <Radio className="h-4 w-4 text-primary mb-2" />
                        <div className="text-sm font-medium">Live updates</div>
                        <div className="text-xs text-gray-500">Queue refreshes</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <CalendarClock className="h-4 w-4 text-primary mb-2" />
                        <div className="text-sm font-medium">Appointments</div>
                        <div className="text-xs text-gray-500">Token or time slot</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <Users className="h-4 w-4 text-primary mb-2" />
                        <div className="text-sm font-medium">Walk-ins</div>
                        <div className="text-xs text-gray-500">Quick check-in</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <Stethoscope className="h-4 w-4 text-primary mb-2" />
                        <div className="text-sm font-medium">Doctor screen</div>
                        <div className="text-xs text-gray-500">Call next / done</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <UserCog className="h-4 w-4 text-primary mb-2" />
                        <div className="text-sm font-medium">Staff roles</div>
                        <div className="text-xs text-gray-500">Owner / doctor</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <Building2 className="h-4 w-4 text-primary mb-2" />
                        <div className="text-sm font-medium">Multiple clinics</div>
                        <div className="text-xs text-gray-500">Easy switching</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {needsSelection && (
          <Card>
            <CardContent className="py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    Select context
                  </div>
                  <div className="text-2xl font-semibold">Select a clinic</div>
                  <div className="text-sm text-gray-600 mt-2 max-w-md">
                    You belong to multiple clinics. Pick one to continue.
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {effectiveMemberships.map((m) => (
                      <Button
                        key={m.hospitalId}
                        variant="outline"
                        onClick={() => {
                          setActiveHospitalId(m.hospitalId);
                          window.location.reload();
                        }}
                      >
                        {m.hospitalName}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <img
                    src={selectClinicIllustration}
                    alt="Select clinic illustration"
                    className="w-full max-w-xl max-h-[280px] object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active clinic cards */}
        {!needsClinic && activeMembership && (
          <>
            {canManageSetup && !setupProgress.isComplete && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Setup progress</CardTitle>
                  <CardDescription>Finish setup in small steps. You can come back anytime.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <button
                    className="rounded-md border p-3 text-left hover:bg-gray-50"
                    onClick={() => navigate('/setup?step=hospital')}
                  >
                    <div className="text-xs text-gray-500 mb-1">Clinic</div>
                    <div className="text-sm font-medium flex items-center justify-between gap-2">
                      Details
                      {setupProgress.hasHospital ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  <button
                    className="rounded-md border p-3 text-left hover:bg-gray-50"
                    onClick={() => navigate('/setup?step=config')}
                    disabled={!setupProgress.hasHospital}
                  >
                    <div className="text-xs text-gray-500 mb-1">Hours</div>
                    <div className="text-sm font-medium flex items-center justify-between gap-2">
                      Settings
                      {setupProgress.hasConfig ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  <button
                    className="rounded-md border p-3 text-left hover:bg-gray-50"
                    onClick={() => navigate('/setup?step=departments')}
                    disabled={!setupProgress.hasHospital}
                  >
                    <div className="text-xs text-gray-500 mb-1">Departments</div>
                    <div className="text-sm font-medium flex items-center justify-between gap-2">
                      Add
                      {setupProgress.hasDepartments ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  <button
                    className="rounded-md border p-3 text-left hover:bg-gray-50"
                    onClick={() => navigate('/setup?step=doctors')}
                    disabled={!setupProgress.hasHospital}
                  >
                    <div className="text-xs text-gray-500 mb-1">Doctors</div>
                    <div className="text-sm font-medium flex items-center justify-between gap-2">
                      Add
                      {setupProgress.hasDoctors ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  <button
                    className="rounded-md border p-3 text-left hover:bg-gray-50"
                    onClick={() => navigate('/setup?step=receptionists')}
                    disabled={!setupProgress.hasHospital}
                  >
                    <div className="text-xs text-gray-500 mb-1">Reception</div>
                    <div className="text-sm font-medium flex items-center justify-between gap-2">
                      Add
                      {setupProgress.hasReceptionists ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Active clinic</div>
                <div className="text-2xl font-bold">{activeMembership.hospitalName}</div>
                <div className="text-sm text-gray-600">
                  You are signed in as <span className="font-medium">{activeMembership.role}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/setup')}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {canManageSetup ? 'Clinic settings' : 'View clinic setup'}
                </Button>
                {canManageSetup && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/team')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Team
                  </Button>
                )}
                {activeMembership.role === 'RECEPTIONIST' && (
                  <Button onClick={() => navigate('/reception')}>Open reception</Button>
                )}
                {activeMembership.role === 'DOCTOR' && activeMembership.doctorId && (
                  <Button onClick={() => navigate(`/doctor/${activeMembership.doctorId}`)}>
                    Open doctor screen
                  </Button>
                )}
              </div>
            </div>

            {/* Placeholder analytics (prod-ready layout, real data later) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Today’s visits</CardTitle>
                  <CardDescription>Coming soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">—</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average wait</CardTitle>
                  <CardDescription>Coming soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">—</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active doctors</CardTitle>
                  <CardDescription>Coming soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">—</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
    </div>
  );
}



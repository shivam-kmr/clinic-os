import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, setupApi } from '@/lib/api';
import { setActiveHospitalId } from '@/lib/clinic';
import { CheckCircle2, Plus } from 'lucide-react';
import onboardingIllustration from '@/assets/undraw/undraw_settings_alfp.svg';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface CreateHospitalData {
  name: string;
  street?: string;
  buildingNumber?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  managerEmails?: string[];
}

interface UpdateHospitalData {
  customDomain?: string;
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
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<
    'hospital' | 'config' | 'departments' | 'departmentSettings' | 'doctors' | 'receptionists'
  >('hospital');
  const activeHospitalId = localStorage.getItem('activeHospitalId');
  const [optimistic, setOptimistic] = useState<{ configSaved?: boolean }>({});

  // Get current setup data
  const { data: setupData, refetch } = useQuery({
    queryKey: ['hospital-setup', activeHospitalId],
    queryFn: async () => {
      const response = await setupApi.getSetup();
      return response.data.data;
    },
    retry: false,
  });

  const hospital = setupData?.hospital;
  const hasHospital = !!hospital;
  const hospitalId = hospital?.id as string | undefined;
  const canManageSetup = setupData?.canManageSetup !== false;
  const isReadOnly = setupData?.canManageSetup === false;
  const memberships = (setupData?.memberships || []) as Array<{
    hospitalId: string;
    hospitalName: string;
    role: string;
    doctorId?: string | null;
  }>;

  // Support deep links like /setup?step=departments (Google Console-style)
  useEffect(() => {
    const step = searchParams.get('step');
    if (!step) return;
    if (
      step === 'hospital' ||
      step === 'config' ||
      step === 'departments' ||
      step === 'departmentSettings' ||
      step === 'doctors' ||
      step === 'receptionists'
    ) {
      setActiveStep(step);
    }
  }, [searchParams]);

  const steps: Array<typeof activeStep> = [
    'hospital',
    'config',
    'departments',
    'departmentSettings',
    'doctors',
    'receptionists',
  ];
  const done = useMemo(
    () => ({
      hospital: hasHospital,
      config: !!setupData?.config || !!optimistic.configSaved,
      departments: (setupData?.departments || []).length > 0,
      departmentSettings:
        (setupData?.departments || []).length > 0 &&
        (setupData?.departmentConfigs || []).filter((c: any) => !!c.bookingMode).length ===
          (setupData?.departments || []).length,
      doctors: (setupData?.doctors || []).length > 0,
      receptionists: (setupData?.receptionists || []).length > 0,
    }),
    [
      hasHospital,
      optimistic.configSaved,
      setupData?.config,
      setupData?.departments,
      setupData?.departmentConfigs,
      setupData?.doctors,
      setupData?.receptionists,
    ]
  );
  const isGoLiveReady =
    done.hospital && done.config && done.departments && done.departmentSettings && done.doctors && done.receptionists;
  const totalSteps = 6;
  const completedSteps =
    (done.hospital ? 1 : 0) +
    (done.config ? 1 : 0) +
    (done.departments ? 1 : 0) +
    (done.departmentSettings ? 1 : 0) +
    (done.doctors ? 1 : 0) +
    (done.receptionists ? 1 : 0);

  // Strict sequential setup: users cannot jump ahead.
  const canAccessStep = (step: typeof activeStep) => {
    // For doctors/receptionists, allow viewing the whole setup without edit rights.
    if (isReadOnly) {
      if (!hasHospital && step !== 'hospital') return false;
      return true;
    }
    if (step === 'hospital') return true;
    if (step === 'config') return done.hospital;
    if (step === 'departments') return done.hospital && done.config;
    if (step === 'departmentSettings') return done.hospital && done.config && done.departments;
    if (step === 'doctors') return done.hospital && done.config && done.departments && done.departmentSettings;
    if (step === 'receptionists')
      return done.hospital && done.config && done.departments && done.departmentSettings && done.doctors;
    return false;
  };

  const setStep = (step: typeof activeStep) => {
    if (!canAccessStep(step)) return;
    setActiveStep(step);
    navigate(`/setup?step=${step}`, { replace: true });
  };

  // Create hospital mutation
  const createHospitalMutation = useMutation({
    mutationFn: (data: CreateHospitalData) => setupApi.createHospital(data),
    onSuccess: async (response) => {
      const createdHospital = response.data.data;

      // Switch active clinic to the newly created hospital
      if (createdHospital?.id) {
        setActiveHospitalId(createdHospital.id);
      }

      // Refresh stored user to include updated memberships
      try {
        const me = await api.get('/auth/me');
        const userStr = localStorage.getItem('user');
        const prev = userStr ? JSON.parse(userStr) : {};
        localStorage.setItem('user', JSON.stringify({ ...prev, ...me.data.data }));
      } catch {
        // Non-fatal; setup page can still work via activeHospitalId + /setup
      }

      // Ensure the header clinic selector updates immediately
      await queryClient.invalidateQueries({ queryKey: ['auth-clinics'] });

      await refetch();
      // Move to next stage after save (bypass guarded setStep to avoid any race with refetch/state)
      setActiveStep('config');
      navigate('/setup?step=config', { replace: true });
    },
  });

  // Update hospital (custom domain) mutation
  const updateHospitalMutation = useMutation({
    mutationFn: (data: UpdateHospitalData) => setupApi.updateHospital(data),
    onSuccess: () => {
      refetch();
    },
  });

  const domainInstructionsQuery = useQuery({
    queryKey: ['domain-instructions', hospitalId],
    queryFn: async () => {
      if (!hospitalId) return null;
      const response = await setupApi.getDomainInstructions(hospitalId);
      return response.data.data;
    },
    enabled: false,
    retry: false,
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      if (!hospitalId) throw new Error('Hospital ID required');
      return setupApi.verifyDomain(hospitalId);
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: UpdateConfigData) => setupApi.updateConfig(data),
    onSuccess: () => {
      setOptimistic((p) => ({ ...p, configSaved: true }));
      refetch();
    },
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: (data: CreateDepartmentData) => setupApi.createDepartment(data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup', activeHospitalId] });
    },
  });

  const updateDepartmentConfigMutation = useMutation({
    mutationFn: (args: { departmentId: string; data: any }) =>
      setupApi.updateDepartmentConfig(args.departmentId, args.data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup', activeHospitalId] });
    },
  });

  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: (data: CreateDoctorData) => setupApi.createDoctor(data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup', activeHospitalId] });
    },
  });

  // Create receptionist mutation
  const createReceptionistMutation = useMutation({
    mutationFn: (data: CreateReceptionistData) => setupApi.createReceptionist(data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['hospital-setup', activeHospitalId] });
    },
  });

  // Note: we intentionally do NOT auto-advance away from the Hospital tab.
  // Entering /setup should always start on Hospital, especially for first-time logins.

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Clinic OS Console</div>
              <h1 className="text-2xl md:text-3xl font-bold">Clinic setup</h1>
              <p className="text-gray-600 mt-1">
                Create your clinic in stages. Finish now or come back anytime.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={isGoLiveReady ? 'default' : 'secondary'}>
                  {isGoLiveReady ? 'Ready to go live' : 'Setup in progress'}
                </Badge>
                <div className="text-sm text-gray-600">
                  {completedSteps}/{totalSteps} completed
                </div>
                {isReadOnly && (
                  <Badge variant="secondary">View only</Badge>
                )}
              </div>

              {/* Stepper (non-clickable, sequential) */}
              <div className="mt-5">
                <div className="flex items-center w-full">
                  {steps.map((step, idx) => {
                    const label =
                      step === 'hospital'
                        ? 'Clinic info'
                        : step === 'config'
                        ? 'Configuration'
                        : step === 'departments'
                        ? 'Departments'
                        : step === 'departmentSettings'
                        ? 'Dept settings'
                        : step === 'doctors'
                        ? 'Doctors'
                        : 'Reception';

                    const isCompleted =
                      step === 'hospital'
                        ? done.hospital
                        : step === 'config'
                        ? done.config
                        : step === 'departments'
                        ? done.departments
                        : step === 'departmentSettings'
                        ? done.departmentSettings
                        : step === 'doctors'
                        ? done.doctors
                        : done.receptionists;

                    const isActive = activeStep === step;
                    const isLocked = !canAccessStep(step);

                    const circleClasses = isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isActive
                      ? 'bg-white border-primary text-primary'
                      : isLocked
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-white border-gray-300 text-gray-600';

                    return (
                      <div key={step} className="flex items-center flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${circleClasses}`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-semibold">{idx + 1}</span>
                            )}
                          </div>
                          <div className={`text-sm truncate ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>
                            {label}
                          </div>
                        </div>

                        {idx < steps.length - 1 && (
                          <div
                            className={`mx-3 h-px flex-1 ${
                              isCompleted ? 'bg-primary' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-3">
              <div className="flex justify-center lg:justify-end">
                <img
                  src={onboardingIllustration}
                  alt="Clinic setup illustration"
                  className="w-full max-w-[220px] max-h-[120px] object-contain"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isReadOnly && (
        <Card>
          <CardContent className="py-4 text-sm text-gray-700">
            You have <span className="font-medium">view-only</span> access to clinic setup.
            Ask a clinic owner/manager to update configuration.
          </CardContent>
        </Card>
      )}

      {!hasHospital && memberships.length > 0 && !activeHospitalId && (
        <Card>
          <CardContent className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Select a clinic to edit settings</div>
              <div className="text-sm text-gray-600">
                You belong to multiple clinics. Pick one from the dashboard clinic selector.
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <div id="setup-content" className="space-y-4">
        {activeStep === 'hospital' && (
          <HospitalForm
            hospital={hospital}
            onCreate={(data: CreateHospitalData) => {
              if (!canManageSetup) return;
              createHospitalMutation.mutate(data);
            }}
            createLoading={createHospitalMutation.isPending}
            createError={(createHospitalMutation.error as any)?.response?.data?.error?.message || (createHospitalMutation.error as any)?.message}
            onUpdateDomain={(data: UpdateHospitalData) => updateHospitalMutation.mutate(data)}
            updateDomainLoading={updateHospitalMutation.isPending}
            updateDomainError={(updateHospitalMutation.error as any)?.response?.data?.error?.message || (updateHospitalMutation.error as any)?.message}
            domainInstructions={domainInstructionsQuery.data}
            domainInstructionsLoading={domainInstructionsQuery.isFetching}
            onFetchDomainInstructions={() => domainInstructionsQuery.refetch()}
            onVerifyDomain={() => verifyDomainMutation.mutate()}
            verifyDomainLoading={verifyDomainMutation.isPending}
            verifyDomainError={(verifyDomainMutation.error as any)?.response?.data?.error?.message || (verifyDomainMutation.error as any)?.message}
            readOnly={isReadOnly}
          />
        )}

        {activeStep === 'config' && hasHospital && (
          <ConfigForm
            config={setupData?.config}
            onSubmit={updateConfigMutation.mutateAsync}
            isLoading={updateConfigMutation.isPending}
            onComplete={() => setStep('departments')}
            readOnly={isReadOnly}
          />
        )}

        {activeStep === 'departments' && hasHospital && (
          <DepartmentsSection
            departments={setupData?.departments || []}
            onCreate={(data: CreateDepartmentData) => {
              if (!canManageSetup) return;
              createDepartmentMutation.mutate(data);
            }}
            isLoading={createDepartmentMutation.isPending}
            readOnly={isReadOnly}
          />
        )}

        {activeStep === 'departmentSettings' && hasHospital && (
          <DepartmentSettingsSection
            departments={setupData?.departments || []}
            hospitalDefaults={setupData?.config}
            departmentConfigs={setupData?.departmentConfigs || []}
            onSave={async (departmentId: string, data: any) => {
              if (!canManageSetup) return;
              await updateDepartmentConfigMutation.mutateAsync({ departmentId, data });
            }}
            isSaving={updateDepartmentConfigMutation.isPending}
            readOnly={isReadOnly}
          />
        )}

        {activeStep === 'doctors' && hasHospital && (
          <DoctorsSection
            departments={setupData?.departments || []}
            doctors={setupData?.doctors || []}
            onCreate={(data: CreateDoctorData) => {
              if (!canManageSetup) return;
              createDoctorMutation.mutate(data);
            }}
            isLoading={createDoctorMutation.isPending}
            readOnly={isReadOnly}
          />
        )}

        {activeStep === 'receptionists' && hasHospital && (
          <ReceptionistsSection
            departments={setupData?.departments || []}
            receptionists={setupData?.receptionists || []}
            onCreate={(data: CreateReceptionistData) => {
              if (!canManageSetup) return;
              createReceptionistMutation.mutate(data);
            }}
            isLoading={createReceptionistMutation.isPending}
            readOnly={isReadOnly}
          />
        )}
      </div>

      {/* Back / Next */}
      {activeStep !== 'config' && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => {
              const idx = steps.indexOf(activeStep);
              const prev = steps[Math.max(0, idx - 1)];
              setStep(prev);
            }}
            disabled={activeStep === 'hospital'}
          >
            Back
          </Button>
          <Button
            onClick={() => {
              const idx = steps.indexOf(activeStep);
              const next = steps[Math.min(steps.length - 1, idx + 1)];
              const isCurrentDone =
                activeStep === 'hospital'
                  ? done.hospital
                  : activeStep === 'departmentSettings'
                  ? done.departmentSettings
                  : activeStep === 'departments'
                  ? done.departments
                  : activeStep === 'doctors'
                  ? done.doctors
                  : activeStep === 'receptionists'
                  ? done.receptionists
                  : false;
              if (!isCurrentDone) return;
              setStep(next);
            }}
            disabled={
              activeStep === 'hospital'
                ? !done.hospital
                : activeStep === 'departmentSettings'
                ? !done.departmentSettings
                : activeStep === 'departments'
                ? !done.departments
                : activeStep === 'doctors'
                ? !done.doctors
                : activeStep === 'receptionists'
                ? !done.receptionists
                : true
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// Hospital Form Component
function HospitalForm({
  hospital,
  onCreate,
  createLoading,
  createError,
  onUpdateDomain,
  updateDomainLoading,
  updateDomainError,
  domainInstructions,
  domainInstructionsLoading,
  onFetchDomainInstructions,
  onVerifyDomain,
  verifyDomainLoading,
  verifyDomainError,
  readOnly,
}: any) {
  const [formData, setFormData] = useState({
    name: hospital?.name || '',
    buildingNumber: hospital?.buildingNumber || '',
    street: hospital?.street || '',
    city: hospital?.city || '',
    state: hospital?.state || '',
    postalCode: hospital?.postalCode || '',
    country: hospital?.country || '',
    phone: hospital?.phone || '',
    email: hospital?.email || '',
    managerEmails: hospital?.managerEmails?.join(', ') || '',
  });

  const baseDomain = (import.meta as any).env?.VITE_PUBLIC_BASE_DOMAIN || 'clinicos.com';
  const [subdomainInfo, setSubdomainInfo] = useState<{
    loading: boolean;
    base?: string;
    available?: boolean;
    suggestedSubdomain?: string;
    error?: string;
  }>({ loading: false });

  useEffect(() => {
    if (hospital) return; // editing existing hospital: do not re-suggest
    const name = formData.name.trim();
    if (name.length < 3) {
      setSubdomainInfo({ loading: false });
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        setSubdomainInfo((p) => ({ ...p, loading: true, error: undefined }));
        const resp = await setupApi.suggestSubdomain(name);
        setSubdomainInfo({ loading: false, ...resp.data.data });
      } catch (e: any) {
        setSubdomainInfo({
          loading: false,
          error: e?.response?.data?.error?.message || 'Unable to check subdomain',
        });
      }
    }, 350);

    return () => window.clearTimeout(t);
  }, [formData.name, hospital]);

  const [customDomain, setCustomDomain] = useState(hospital?.customDomain || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const managerEmailsArray = formData.managerEmails
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);
    onCreate({
      ...formData,
      managerEmails: managerEmailsArray,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hospital ? 'Hospital Profile' : 'Create Hospital'}</CardTitle>
        <CardDescription>
          {hospital ? 'View your hospital details and configure your domain.' : 'Enter your hospital information'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hospital ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {createError}
              </div>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Building / House no.</label>
                <input
                  type="text"
                  value={formData.buildingNumber}
                  onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., 12A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Street</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., MG Road"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Bengaluru"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Karnataka"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., 560001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., India"
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
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium">Your clinic URL</div>
              <div className="mt-1 text-sm text-gray-700">
                {subdomainInfo.loading ? (
                  <span className="text-gray-500">Checking availability…</span>
                ) : subdomainInfo.suggestedSubdomain ? (
                  <span className="font-medium">
                    {subdomainInfo.suggestedSubdomain}.{baseDomain}
                  </span>
                ) : (
                  <span className="text-gray-500">Enter a clinic name to generate a URL</span>
                )}
              </div>
              {subdomainInfo.suggestedSubdomain && (
                <div className="mt-1 text-xs text-gray-500">
                  {subdomainInfo.available ? (
                    <span>Available</span>
                  ) : (
                    <span>
                      Name is taken — we’ll auto-add a short suffix to keep it unique.
                    </span>
                  )}
                </div>
              )}
              {subdomainInfo.error && (
                <div className="mt-2 text-xs text-red-600">{subdomainInfo.error}</div>
              )}
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
                Comma-separated list of email addresses for additional managers
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end">
              <Button type="submit" disabled={createLoading || readOnly}>
                {createLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Hospital summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-500 mb-1">Hospital Name</div>
                <div className="font-medium">{hospital.name}</div>
              </div>
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-500 mb-1">Subdomain</div>
                <div className="font-medium">{hospital.subdomain || '—'}</div>
              </div>
            </div>

            {/* Custom domain */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Point your domain to Clinic OS and verify DNS to enable it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {updateDomainError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {updateDomainError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value.trim())}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="example.com"
                    disabled={readOnly}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    After saving, use the DNS instructions to add the required record(s).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onUpdateDomain({ customDomain: customDomain || undefined })}
                    disabled={updateDomainLoading || readOnly}
                  >
                    {updateDomainLoading ? 'Saving…' : 'Save Domain'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onFetchDomainInstructions}
                    disabled={domainInstructionsLoading || readOnly}
                  >
                    {domainInstructionsLoading ? 'Loading…' : 'Get DNS Instructions'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onVerifyDomain}
                    disabled={verifyDomainLoading || readOnly}
                  >
                    {verifyDomainLoading ? 'Verifying…' : 'Verify Domain'}
                  </Button>
                </div>

                {verifyDomainError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {verifyDomainError}
                  </div>
                )}

                {domainInstructions && (
                  <div className="p-4 border rounded-lg bg-gray-50 text-sm">
                    <div className="font-medium mb-2">DNS Instructions</div>
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(domainInstructions, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Config Form Component
function ConfigForm({ config, onSubmit, isLoading, onComplete, readOnly }: any) {
  const [section, setSection] = useState<'basics' | 'hours' | 'queue'>('basics');
  const sectionOrder: Array<typeof section> = ['basics', 'hours', 'queue'];
  const sectionLabel: Record<typeof section, string> = {
    basics: 'Basics',
    hours: 'Business hours',
    queue: 'Queue rules',
  };
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

  const handleSaveAndContinue = async () => {
    if (readOnly) return;
    await onSubmit({
      ...formData,
      maxQueueLength: formData.maxQueueLength ? parseInt(formData.maxQueueLength) : undefined,
    });
    const idx = sectionOrder.indexOf(section);
    const next = sectionOrder[idx + 1];
    if (next) {
      setSection(next);
      return;
    }
    onComplete?.();
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Fill this step in 3 small parts. Save & continue moves you forward.
            </CardDescription>
          </div>
          <Badge variant="secondary">{sectionLabel[section]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {section === 'basics' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Booking mode</label>
                <select
                  value={formData.bookingMode}
                  onChange={(e) => setFormData({ ...formData, bookingMode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="TOKEN_ONLY">Token only</option>
                  <option value="TIME_SLOT_ONLY">Time slot only</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Consultation time (min)</label>
                  <input
                    type="number"
                    value={formData.defaultConsultationDuration}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultConsultationDuration: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    min="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Buffer time (min)</label>
                  <input
                    type="number"
                    value={formData.bufferTimeBetweenAppointments}
                    onChange={(e) =>
                      setFormData({ ...formData, bufferTimeBetweenAppointments: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival window (min)</label>
                  <input
                    type="number"
                    value={formData.arrivalWindowBeforeAppointment}
                    onChange={(e) =>
                      setFormData({ ...formData, arrivalWindowBeforeAppointment: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {section === 'hours' && (
            <div>
              <div className="text-sm text-gray-600 mb-3">
                Set when your clinic is open. Patients can book only during open hours.
              </div>
              <div className="space-y-2">
                {days.map((day) => (
                  <div key={day} className="flex flex-col md:flex-row md:items-center gap-3 p-3 border rounded-lg">
                    <div className="w-24 capitalize font-medium">{day}</div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.businessHours[day]?.isOpen || false}
                        onChange={(e) => updateBusinessHours(day, 'isOpen', e.target.checked)}
                      />
                      Open
                    </label>
                    {formData.businessHours[day]?.isOpen && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={formData.businessHours[day]?.start || '10:00'}
                          onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                          className="px-2 py-1 border rounded"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <input
                          type="time"
                          value={formData.businessHours[day]?.end || '18:00'}
                          onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                          className="px-2 py-1 border rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'queue' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Token reset</label>
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
                <label className="block text-sm font-medium mb-1">Max queue length (optional)</label>
                <input
                  type="number"
                  value={formData.maxQueueLength}
                  onChange={(e) => setFormData({ ...formData, maxQueueLength: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Leave empty for no limit"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.autoReassignOnLeave}
                  onChange={(e) => setFormData({ ...formData, autoReassignOnLeave: e.target.checked })}
                />
                <div className="text-sm">
                  Auto-move patients if a doctor is on leave
                </div>
              </div>
            </div>
          )}

          {/* Wizard footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => {
                const idx = sectionOrder.indexOf(section);
                const prev = sectionOrder[idx - 1];
                if (prev) setSection(prev);
              }}
              disabled={section === 'basics' || isLoading || readOnly}
            >
              Back
            </Button>
            <Button onClick={handleSaveAndContinue} disabled={isLoading || readOnly}>
              {section === 'queue' ? 'Save & finish' : 'Save & next'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Departments Section
function DepartmentsSection({ departments, onCreate, isLoading, readOnly }: any) {
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
          <Button onClick={() => setShowForm(!showForm)} disabled={readOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && !readOnly && (
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

// Department Settings (per-department configuration)
function DepartmentSettingsSection({
  departments,
  hospitalDefaults,
  departmentConfigs,
  onSave,
  isSaving,
  readOnly,
}: any) {
  const [index, setIndex] = useState(0);
  const cfgByDeptId = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of departmentConfigs || []) map.set(c.departmentId, c);
    return map;
  }, [departmentConfigs]);

  const ordered = departments || [];
  const firstUnconfigured = ordered.findIndex((d: any) => !cfgByDeptId.get(d.id)?.bookingMode);
  useEffect(() => {
    if (firstUnconfigured >= 0) setIndex(firstUnconfigured);
  }, [firstUnconfigured]);

  if (!ordered.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department settings</CardTitle>
          <CardDescription>Create at least one department first.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dept = ordered[Math.min(index, ordered.length - 1)];
  const current = cfgByDeptId.get(dept.id) || {};

  const [form, setForm] = useState<any>({
    bookingMode: current.bookingMode || null,
    tokenResetFrequency: current.tokenResetFrequency ?? hospitalDefaults?.tokenResetFrequency ?? 'DAILY',
    maxQueueLength: current.maxQueueLength ?? hospitalDefaults?.maxQueueLength ?? '',
    tokenPrefix: current.tokenPrefix ?? '',
    defaultConsultationDuration:
      current.defaultConsultationDuration ?? hospitalDefaults?.defaultConsultationDuration ?? 15,
    bufferTimeBetweenAppointments:
      current.bufferTimeBetweenAppointments ?? hospitalDefaults?.bufferTimeBetweenAppointments ?? 5,
    arrivalWindowBeforeAppointment:
      current.arrivalWindowBeforeAppointment ?? hospitalDefaults?.arrivalWindowBeforeAppointment ?? 15,
  });

  // Reset form when department changes
  useEffect(() => {
    const next = cfgByDeptId.get(dept.id) || {};
    setForm({
      bookingMode: next.bookingMode || null,
      tokenResetFrequency: next.tokenResetFrequency ?? hospitalDefaults?.tokenResetFrequency ?? 'DAILY',
      maxQueueLength: next.maxQueueLength ?? hospitalDefaults?.maxQueueLength ?? '',
      tokenPrefix: next.tokenPrefix ?? '',
      defaultConsultationDuration:
        next.defaultConsultationDuration ?? hospitalDefaults?.defaultConsultationDuration ?? 15,
      bufferTimeBetweenAppointments:
        next.bufferTimeBetweenAppointments ?? hospitalDefaults?.bufferTimeBetweenAppointments ?? 5,
      arrivalWindowBeforeAppointment:
        next.arrivalWindowBeforeAppointment ?? hospitalDefaults?.arrivalWindowBeforeAppointment ?? 15,
    });
  }, [dept.id, cfgByDeptId, hospitalDefaults]);

  const saveAndNext = async () => {
    if (!form.bookingMode) return;
    await onSave(dept.id, {
      bookingMode: form.bookingMode,
      tokenResetFrequency: form.bookingMode !== 'TIME_SLOT_ONLY' ? form.tokenResetFrequency : null,
      maxQueueLength: form.bookingMode !== 'TIME_SLOT_ONLY' ? (form.maxQueueLength ? Number(form.maxQueueLength) : null) : null,
      tokenPrefix: form.bookingMode !== 'TIME_SLOT_ONLY' ? (form.tokenPrefix || null) : null,
      defaultConsultationDuration:
        form.bookingMode !== 'TOKEN_ONLY' ? Number(form.defaultConsultationDuration) : Number(form.defaultConsultationDuration),
      bufferTimeBetweenAppointments:
        form.bookingMode !== 'TOKEN_ONLY' ? Number(form.bufferTimeBetweenAppointments) : Number(form.bufferTimeBetweenAppointments),
      arrivalWindowBeforeAppointment:
        form.bookingMode !== 'TOKEN_ONLY' ? Number(form.arrivalWindowBeforeAppointment) : Number(form.arrivalWindowBeforeAppointment),
    });
    const nextIdx = Math.min(index + 1, ordered.length - 1);
    setIndex(nextIdx);
  };

  const isLast = index >= ordered.length - 1;
  const configuredCount = ordered.filter((d: any) => !!cfgByDeptId.get(d.id)?.bookingMode).length;

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department settings</CardTitle>
          <CardDescription>View-only. Contact an owner/manager to make changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ordered.map((d: any) => {
            const c = cfgByDeptId.get(d.id) || {};
            return (
              <div key={d.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    Booking: {c.bookingMode || 'Not set'}
                  </div>
                </div>
                <Badge variant="secondary">{c.bookingMode || '—'}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Department settings</CardTitle>
            <CardDescription>
              Configure each department. This decides whether it runs on tokens, time slots, or both.
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {configuredCount}/{ordered.length} configured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-semibold">{dept.name}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0 || isSaving}>
              Back
            </Button>
            <Button onClick={saveAndNext} disabled={!form.bookingMode || isSaving}>
              {isSaving ? 'Saving…' : isLast ? 'Save' : 'Save & next'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Booking mode *</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { id: 'TOKEN_ONLY', label: 'Token only' },
              { id: 'TIME_SLOT_ONLY', label: 'Time slots only' },
              { id: 'BOTH', label: 'Both' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm((p: any) => ({ ...p, bookingMode: opt.id }))}
                className={`rounded-md border px-3 py-2 text-left hover:bg-gray-50 ${
                  form.bookingMode === opt.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500">
                  {opt.id === 'TOKEN_ONLY'
                    ? 'Walk-ins and queue tokens'
                    : opt.id === 'TIME_SLOT_ONLY'
                    ? 'Appointments by time'
                    : 'Allow both flows'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {(form.bookingMode === 'TOKEN_ONLY' || form.bookingMode === 'BOTH') && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="font-medium">Token rules</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Token reset</label>
                <select
                  value={form.tokenResetFrequency}
                  onChange={(e) => setForm((p: any) => ({ ...p, tokenResetFrequency: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="NEVER">Never</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max queue (optional)</label>
                <input
                  type="number"
                  value={form.maxQueueLength}
                  onChange={(e) => setForm((p: any) => ({ ...p, maxQueueLength: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="No limit"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Token prefix (optional)</label>
                <input
                  type="text"
                  value={form.tokenPrefix}
                  onChange={(e) => setForm((p: any) => ({ ...p, tokenPrefix: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., CAR"
                />
              </div>
            </div>
          </div>
        )}

        {(form.bookingMode === 'TIME_SLOT_ONLY' || form.bookingMode === 'BOTH') && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="font-medium">Appointment rules</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Consultation time (min)</label>
                <input
                  type="number"
                  value={form.defaultConsultationDuration}
                  onChange={(e) => setForm((p: any) => ({ ...p, defaultConsultationDuration: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  min="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Buffer time (min)</label>
                <input
                  type="number"
                  value={form.bufferTimeBetweenAppointments}
                  onChange={(e) => setForm((p: any) => ({ ...p, bufferTimeBetweenAppointments: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Arrival window (min)</label>
                <input
                  type="number"
                  value={form.arrivalWindowBeforeAppointment}
                  onChange={(e) => setForm((p: any) => ({ ...p, arrivalWindowBeforeAppointment: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Doctors Section
function DoctorsSection({ departments, doctors, onCreate, isLoading, readOnly }: any) {
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
          <Button
            onClick={() => setShowForm(!showForm)}
            disabled={departments.length === 0 || readOnly}
          >
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

        {showForm && !readOnly && (
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
function ReceptionistsSection({ departments, receptionists, onCreate, isLoading, readOnly }: any) {
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
          <Button onClick={() => setShowForm(!showForm)} disabled={readOnly}>
            <Plus className="h-4 w-4 mr-2" />
            Add Receptionist
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && !readOnly && (
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


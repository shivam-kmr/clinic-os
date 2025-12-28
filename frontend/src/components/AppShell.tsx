import { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  getActiveHospitalId,
  getMemberships,
  getStoredUser,
  setActiveHospitalId,
  type Membership,
} from '@/lib/clinic';
import { Building2, ChevronDown, LayoutDashboard } from 'lucide-react';
import AppFooter from '@/components/AppFooter';

function ClinicSelector({
  memberships,
  activeHospitalId,
  onSelect,
}: {
  memberships: Membership[];
  activeHospitalId: string | null;
  onSelect: (hospitalId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = memberships.find((m) => m.hospitalId === activeHospitalId) || null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        <Building2 className="h-4 w-4" />
        <span className="max-w-[220px] truncate">
          {active ? active.hospitalName : memberships.length ? 'Select clinic…' : 'No clinics'}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </Button>

      {open && memberships.length > 0 && (
        <div className="absolute right-0 mt-2 w-[360px] rounded-md border bg-white shadow-lg z-50">
          <div className="p-3 border-b">
            <div className="text-sm font-semibold">Select a clinic</div>
          </div>
          <div className="max-h-[320px] overflow-auto">
            {memberships.map((m) => (
              <button
                key={m.hospitalId}
                onClick={() => {
                  onSelect(m.hospitalId);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-3 hover:bg-gray-50 ${
                  m.hospitalId === activeHospitalId ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.hospitalName}</div>
                    <div className="text-xs text-gray-500 truncate">{m.hospitalId}</div>
                  </div>
                  <Badge variant="secondary">{m.role}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const membershipsFromStorage = useMemo(() => getMemberships(user), [user]);
  const activeHospitalId = getActiveHospitalId();

  const { data: clinicsFromApi } = useQuery({
    queryKey: ['auth-clinics'],
    queryFn: async () => {
      const response = await api.get('/auth/clinics');
      return response.data.data as Membership[];
    },
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });

  const memberships = clinicsFromApi || membershipsFromStorage;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeHospitalId');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <div className="font-semibold">Clinic OS Console</div>
          </button>

          <div className="flex items-center gap-2">
            <ClinicSelector
              memberships={memberships}
              activeHospitalId={activeHospitalId}
              onSelect={(hid) => {
                setActiveHospitalId(hid);
                window.location.reload();
              }}
            />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AppFooter />
        </div>
      </footer>
    </div>
  );
}



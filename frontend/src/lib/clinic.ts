export type Membership = {
  hospitalId: string;
  hospitalName: string;
  role: string;
  doctorId?: string | null;
};

export type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // base role
  memberships?: Membership[];
};

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getMemberships(user: StoredUser | null): Membership[] {
  return user?.memberships || [];
}

export function getActiveHospitalId(): string | null {
  return localStorage.getItem('activeHospitalId');
}

export function setActiveHospitalId(hospitalId: string | null) {
  if (!hospitalId) {
    localStorage.removeItem('activeHospitalId');
    return;
  }
  localStorage.setItem('activeHospitalId', hospitalId);
}

export function getActiveMembership(user: StoredUser | null): Membership | null {
  const activeHospitalId = getActiveHospitalId();
  if (!activeHospitalId) return null;
  return getMemberships(user).find((m) => m.hospitalId === activeHospitalId) || null;
}

export function normalizeRole(role?: string) {
  if (role === 'HOSPITAL_MANAGER') return 'HOSPITAL_OWNER';
  return role;
}




import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

type TeamMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'HOSPITAL_OWNER' | 'HOSPITAL_MANAGER' | 'RECEPTIONIST' | 'DOCTOR' | string;
  departmentName?: string | null;
};

export default function Team() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const resp = await api.get('/team');
      return resp.data.data as TeamMember[];
    },
    retry: false,
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = data || [];
    return base.filter((m) => {
      const matchesRole = roleFilter === 'ALL' ? true : m.role === roleFilter;
      const haystack = `${m.firstName} ${m.lastName} ${m.email} ${m.role} ${m.departmentName || ''}`.toLowerCase();
      const matchesQuery = !q ? true : haystack.includes(q);
      return matchesRole && matchesQuery;
    });
  }, [data, query, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Clinic OS Console</div>
          <div className="text-2xl font-bold">Team</div>
          <div className="text-sm text-gray-600">
            Doctors, managers, and receptionists in this clinic. Credentials email is coming soon.
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Staff directory</CardTitle>
              <CardDescription>
                View who has access. Use filters to quickly find someone.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name/email/role…"
                className="w-full sm:w-[260px] px-3 py-2 border rounded-md bg-white"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-[200px] px-3 py-2 border rounded-md bg-white"
              >
                <option value="ALL">All roles</option>
                <option value="HOSPITAL_OWNER">Owner</option>
                <option value="HOSPITAL_MANAGER">Manager</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-sm text-gray-600">Loading…</div>}
          {error && (
            <div className="text-sm text-red-600">
              Unable to load team. (Only owners/managers can view this page.)
            </div>
          )}

          {!isLoading && !error && (
            <div className="overflow-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Name</th>
                    <th className="text-left font-medium px-4 py-3">Email</th>
                    <th className="text-left font-medium px-4 py-3">Role</th>
                    <th className="text-left font-medium px-4 py-3">Department</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-gray-500" colSpan={5}>
                        No results.
                      </td>
                    </tr>
                  ) : (
                    rows.map((m) => (
                      <tr key={m.userId} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {m.firstName} {m.lastName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{m.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{m.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{m.departmentName || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            onClick={() => alert('Coming soon: Send credentials email')}
                          >
                            Send creds
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




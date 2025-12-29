import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateTestimonials, type TestimonialRole } from '@/lib/testimonials';
import { CalDemoButton } from '@/components/CalDemoPopup';
import { PublicLayout } from '@/components/PublicLayout';

const ALL_REVIEWS_COUNT = 447;
const AVERAGE_RATING = 4.3;

const roleFilters: Array<TestimonialRole | 'All'> = [
  'All',
  'Clinic Owner',
  'Hospital Manager',
  'Receptionist',
  'Billing Executive',
  'Lab Technician',
  'X-ray Technician',
  'Nursing Supervisor',
  'Pharmacist',
  'Operations Lead',
];

export default function TestimonialsPage() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<(typeof roleFilters)[number]>('All');

  const all = useMemo(() => generateTestimonials(ALL_REVIEWS_COUNT), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (role !== 'All' && t.role !== role) return false;
      if (!q) return true;
      return (
        t.text.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.organization.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q)
      );
    });
  }, [all, query, role]);

  return (
    <PublicLayout>
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold">Customer Reviews</h1>
            <p className="text-muted-foreground mt-2">
              4.3/5 average • {ALL_REVIEWS_COUNT} reviews
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white w-full sm:w-[320px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, role, clinic, city, text…"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof roleFilters)[number])}
              className="border rounded-md px-3 py-2 bg-white text-sm w-full sm:w-[220px]"
            >
              {roleFilters.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={
                i < Math.floor(AVERAGE_RATING)
                  ? 'h-4 w-4 fill-yellow-400 text-yellow-400'
                  : 'h-4 w-4 text-muted-foreground'
              }
            />
          ))}
          <span className="text-sm font-medium">{AVERAGE_RATING}/5</span>
          <span className="text-sm text-muted-foreground">({filtered.length} shown)</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base leading-relaxed">{t.text}</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{t.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {t.role} • {t.organization} • {t.city}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">{t.dateLabel}</div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle>Want a demo for your clinic?</CardTitle>
              <CardDescription>
                See how Clinic OS improves reception flow, doctor queues, and patient experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <CalDemoButton>Schedule Demo</CalDemoButton>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicLayout>
  );
}



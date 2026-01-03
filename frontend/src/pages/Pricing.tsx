import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { PublicLayout } from '@/components/PublicLayout';
import { APP_LOGIN_URL } from '@/lib/urls';

type PlanKey = 'free' | 'growth' | 'enterprise';

const planLabels: Record<PlanKey, string> = {
  free: 'Free',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

const comparison = [
  {
    group: 'Core workflows',
    items: [
      { name: 'Appointment booking', free: true, growth: true, enterprise: true },
      { name: 'Prescription writing', free: true, growth: true, enterprise: true },
      { name: 'Medicine suggestions in prescriptions', free: true, growth: true, enterprise: true },
      { name: 'Move patients across departments (X-ray / ultrasound / lab)', free: true, growth: true, enterprise: true },
    ],
  },
  {
    group: 'Growth features',
    items: [
      { name: 'Analytics dashboards', free: false, growth: true, enterprise: true },
      { name: 'Compliant patient data storage', free: false, growth: true, enterprise: true },
      { name: 'Billing', free: false, growth: true, enterprise: true },
      { name: 'SMS + WhatsApp reporting', free: false, growth: true, enterprise: true },
    ],
  },
  {
    group: 'Enterprise & rollout',
    items: [
      { name: 'Custom workflows & rollout support', free: false, growth: false, enterprise: true },
      { name: 'Custom integrations', free: false, growth: false, enterprise: true },
      { name: 'SLA + procurement support', free: false, growth: false, enterprise: true },
      { name: 'Custom pricing', free: false, growth: false, enterprise: true },
    ],
  },
] as const satisfies ReadonlyArray<{
  group: string;
  items: ReadonlyArray<{ name: string } & Record<PlanKey, boolean>>;
}>;

function IncludedIcon({ included }: { included: boolean }) {
  return included ? (
    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  );
}

export default function PricingPage() {
  return (
    <PublicLayout>
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing & Feature Comparison</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start with the always-free plan for a single clinic. Upgrade when you need compliant storage, billing,
            analytics, and reporting.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <a href={APP_LOGIN_URL}>Get Started</a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/schedule-demo">Talk to Sales</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Free</span>
                <Badge variant="secondary">Always free</Badge>
              </CardTitle>
              <CardDescription>Single-clinic essentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">₹0</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Appointment booking</li>
                <li>Prescriptions + suggestions</li>
                <li>Department routing</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <a href={APP_LOGIN_URL}>Get Started</a>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Growth</span>
                <Badge>Popular</Badge>
              </CardTitle>
              <CardDescription>Reporting + billing + compliant records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                ₹1,599<span className="text-base font-medium text-muted-foreground">/month</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Everything in Free</li>
                <li>Analytics dashboards</li>
                <li>Compliant patient data storage</li>
                <li>Billing</li>
                <li>SMS + WhatsApp reporting</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link to="/schedule-demo">Schedule Demo</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Custom plans for hospitals and networks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">Custom</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Everything in Growth</li>
                <li>Custom workflows & rollout</li>
                <li>Custom integrations</li>
                <li>SLA + procurement support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/schedule-demo">Talk to Sales</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Compare plans</h2>
          <Button variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-background">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-4 font-semibold">Feature</th>
                <th className="p-4 font-semibold">{planLabels.free}</th>
                <th className="p-4 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    {planLabels.growth} <Badge>₹1,599/mo</Badge>
                  </span>
                </th>
                <th className="p-4 font-semibold">{planLabels.enterprise}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((group) => (
                <Fragment key={group.group}>
                  <tr key={group.group} className="border-t">
                    <td colSpan={4} className="p-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {group.group}
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={`${group.group}:${item.name}`} className="border-t">
                      <td className="p-4">{item.name}</td>
                      <td className="p-4">
                        <IncludedIcon included={item.free} />
                      </td>
                      <td className="p-4">
                        <IncludedIcon included={item.growth} />
                      </td>
                      <td className="p-4">
                        <IncludedIcon included={item.enterprise} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Want us to tailor this to your departments, doctor count, and patient volume?
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link to="/schedule-demo">Schedule Demo</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={APP_LOGIN_URL}>Start Free</a>
            </Button>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}



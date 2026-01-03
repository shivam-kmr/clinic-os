import { Link } from 'react-router-dom';
import { Award, Building2, CheckCircle2, Lock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_LOGIN_URL } from '@/lib/urls';

const certifications = [
  {
    name: 'HIPAA Compliant',
    icon: Shield,
    description: 'Policies and controls aligned to protect sensitive health information.',
  },
  {
    name: 'ISO 27001',
    icon: Award,
    description: 'Information security management best practices and continuous improvement.',
  },
  {
    name: 'SOC 2 Type II',
    icon: CheckCircle2,
    description: 'Operational controls for security, availability, and confidentiality.',
  },
  {
    name: 'HITECH Act',
    icon: Shield,
    description: 'Practices aligned for electronic health information security and breach handling.',
  },
  {
    name: 'GDPR Compliant',
    icon: Lock,
    description: 'Controls for data protection, retention, and user rights where applicable.',
  },
  {
    name: 'HL7 FHIR',
    icon: Award,
    description: 'Interoperability-ready approach for modern healthcare data exchange patterns.',
  },
];

export default function CertificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Building2 className="h-6 w-6 text-primary" />
            <div className="text-xl font-bold truncate">Clinic OS</div>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={APP_LOGIN_URL}>Login</a>
            </Button>
            <Button asChild>
              <a href={APP_LOGIN_URL}>Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold">Certified & Compliant</h1>
          <p className="text-muted-foreground mt-3">
            Security and compliance are foundational to Clinic OS. Below is a high-level overview of the
            standards we align with and the controls we implement to protect clinic and patient data.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {certifications.map((c) => (
            <Card key={c.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <c.icon className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-lg">{c.name}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Need details for audits or procurement? Contact us for documentation and security questionnaires.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <a href={APP_LOGIN_URL}>Talk to Sales</a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}




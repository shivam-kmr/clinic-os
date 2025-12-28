import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalDemoButton } from '@/components/CalDemoPopup';
import { getDemoCalLinkFromEnv } from '@/lib/cal';

export default function ScheduleDemoPage() {
  const calLink = getDemoCalLinkFromEnv();

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
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold">Schedule a Demo</h1>
          <p className="text-muted-foreground mt-3">
            Book a slot and we’ll walk you through reception flow, doctor queues, and setup for your clinic.
          </p>
        </div>

        {!calLink ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Cal.com link not configured</CardTitle>
              <CardDescription>
                Set <code className="font-mono">VITE_CAL_DEMO_URL</code> in your frontend environment and redeploy.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Pick a slot</CardTitle>
              <CardDescription>
                This will open the booking calendar in a popup (same behaviour as all “Schedule Demo” buttons).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <CalDemoButton autoOpen size="lg">
                Schedule Demo
              </CalDemoButton>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}



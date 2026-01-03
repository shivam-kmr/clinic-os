import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_LOGIN_URL } from '@/lib/urls';

export function PublicHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <Building2 className="h-6 w-6 text-primary" />
          <div className="text-xl font-bold truncate">Clinic OS</div>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-primary">
            Pricing
          </Link>
          <Link to="/testimonials" className="hover:text-primary">
            Testimonials
          </Link>
          <Link to="/blogs" className="hover:text-primary">
            Blog
          </Link>
          <Link to="/schedule-demo" className="hover:text-primary">
            Schedule demo
          </Link>
        </nav>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" asChild>
            <a href={APP_LOGIN_URL}>Login</a>
          </Button>
          <Button asChild>
            <a href={APP_LOGIN_URL}>Get Started</a>
          </Button>
        </div>
      </div>
    </header>
  );
}



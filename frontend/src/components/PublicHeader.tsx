import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  return (
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
  );
}



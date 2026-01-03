import { Link } from 'react-router-dom';
import { ArrowRight, Home, Search } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <main className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Page not found (404)
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">We couldn’t find that page</h1>
          <p className="mt-4 text-muted-foreground">
            If you typed the URL manually, double-check the spelling. Otherwise, try one of these helpful links.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild>
              <Link to="/">
                <span className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </span>
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/blogs">
                <span className="inline-flex items-center gap-2">
                  Browse Blog
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}



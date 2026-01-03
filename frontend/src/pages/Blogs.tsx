import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_LOGIN_URL } from '@/lib/urls';
import { BLOG_POSTS } from '@/lib/blogs';

export default function BlogsPage() {
  return (
    <PublicLayout>
      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-3 mx-auto max-w-2xl">
            Practical guides on queue management, patient flow, booking, billing, and compliant clinic operations.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a href={APP_LOGIN_URL}>
                <span className="inline-flex items-center gap-2">
                  <span>Start Free</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </span>
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/schedule-demo">Schedule a demo</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} to={`/blogs/${post.slug}`} className="group">
              <Card className="h-full transition-colors hover:bg-muted/30">
                <CardContent className="p-6 md:p-7">
                  <div className="text-xs font-semibold tracking-wider text-muted-foreground">
                    {post.topic}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold leading-tight group-hover:underline underline-offset-4">
                    {post.title}
                  </h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  <div className="mt-6 text-sm font-medium text-foreground/80">by {post.author}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </PublicLayout>
  );
}



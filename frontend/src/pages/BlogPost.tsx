import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getBlogPostBySlug, type BlogContentBlock } from '@/lib/blogs';

function renderBlock(block: BlogContentBlock, idx: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={idx} className="mt-10 scroll-mt-24 text-2xl font-bold tracking-tight">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={idx} className="mt-6 scroll-mt-24 text-xl font-semibold tracking-tight">
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p key={idx} className="mt-4 leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={idx} className="mt-4 space-y-2 pl-5 text-muted-foreground list-disc">
          {block.items.map((it) => (
            <li key={it} className="leading-relaxed">
              {it}
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote
          key={idx}
          className="mt-6 rounded-xl border bg-muted/40 px-5 py-4 text-foreground/90"
        >
          <p className="leading-relaxed">{block.text}</p>
        </blockquote>
      );
  }
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  useEffect(() => {
    if (!post) return;
    const prev = document.title;
    document.title = `${post.title} | Clinic OS Blog`;
    return () => {
      document.title = prev;
    };
  }, [post]);

  if (!post) {
    return (
      <PublicLayout>
        <main className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold">Blog post not found</h1>
            <p className="text-muted-foreground mt-3">
              This post may have been moved or renamed.
            </p>
            <div className="mt-6">
              <Button variant="outline" asChild>
                <Link to="/blogs">
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Blog
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </PublicLayout>
    );
  }

  const published = new Date(post.publishedAt);
  const dateLabel = Number.isNaN(published.getTime())
    ? post.publishedAt
    : published.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <PublicLayout>
      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Button variant="outline" asChild>
            <Link to="/blogs">
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </span>
            </Link>
          </Button>

          <div className="mt-8">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground text-center">
              {post.topic}
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-center">{post.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground text-center">{post.excerpt}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div>by {post.author}</div>
              <div>{dateLabel}</div>
              <div className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readingTimeMinutes} min read
              </div>
            </div>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6 md:p-8">
              {post.content.map((b, i) => renderBlock(b, i))}
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicLayout>
  );
}



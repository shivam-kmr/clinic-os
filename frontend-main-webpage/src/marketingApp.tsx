import * as React from 'react';
import { Route, Routes } from 'react-router-dom';

import { ScrollToTop } from '@/components/ScrollToTop';

import { APP_BASE_URL } from '@/lib/urls';

const Landing = React.lazy(() => import('@/pages/Landing'));
const PricingPage = React.lazy(() => import('@/pages/Pricing'));
const TestimonialsPage = React.lazy(() => import('@/pages/Testimonials'));
const CertificationsPage = React.lazy(() => import('@/pages/Certifications'));
const ScheduleDemoPage = React.lazy(() => import('@/pages/ScheduleDemo'));
const BlogsPage = React.lazy(() => import('@/pages/Blogs'));
const BlogPostPage = React.lazy(() => import('@/pages/BlogPost'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFound'));

function RedirectIfTokenPresent() {
  React.useEffect(() => {
    // If we still have a legacy token stored on this origin (from before the split),
    // send the user to the app domain.
    const token = localStorage.getItem('token');
    if (token) window.location.replace(`${APP_BASE_URL}/dashboard`);
  }, []);
  return null;
}

function PageFallback() {
  // Keep a stable background during chunk loading (helps avoid a "flash" and CLS from late styles).
  return <div className="min-h-screen bg-background" />;
}

export default function MarketingApp() {
  return (
    <>
      <ScrollToTop />
      <RedirectIfTokenPresent />
      <React.Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/certifications" element={<CertificationsPage />} />
          <Route path="/schedule-demo" element={<ScheduleDemoPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:slug" element={<BlogPostPage />} />
          {/* Any other route should land on the marketing homepage */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>
    </>
  );
}



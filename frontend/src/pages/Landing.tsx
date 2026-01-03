import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import {
  Building2,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Star,
  CheckCircle2,
  Award,
  TrendingUp,
  Clock,
  Heart,
  Quote,
  ArrowRight,
  Lock,
  CreditCard,
  FileText,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import AppFooter from '@/components/AppFooter';
import { CalDemoButton } from '@/components/CalDemoPopup';
import { CookieConsent } from '@/components/CookieConsent';
import { APP_LOGIN_URL } from '@/lib/urls';

// Testimonials from Indian clinics/hospitals
const testimonials = [
  {
    id: 1,
    name: 'Dr. Ananya Iyer',
    role: 'Clinic Owner',
    hospital: 'Aarogya Family Clinic, Bengaluru',
    rating: 5,
    text: 'Reception flow is finally calm during peak OPD hours. Token calling and live status updates reduced confusion and helped us cut average wait time significantly.',
    date: '2 months ago',
  },
  {
    id: 2,
    name: 'Rahul Kulkarni',
    role: 'Hospital Manager',
    hospital: 'CityCare Multispeciality, Pune',
    rating: 4,
    text: 'We track patient flow across reception and doctors without manual follow-ups. The dashboard gives a clear view of the day. A few workflows took some getting used to.',
    date: '3 months ago',
  },
  {
    id: 3,
    name: 'Sneha Sharma',
    role: 'Receptionist',
    hospital: 'Shree Medicare Clinic, Jaipur',
    rating: 4,
    text: 'Check-ins are faster and there’s less arguing at the counter. Patients can see their status and we get fewer “how long?” calls every hour.',
    date: '4 weeks ago',
  },
  {
    id: 4,
    name: 'Amit Patel',
    role: 'X-ray Technician',
    hospital: 'Prime Diagnostics, Ahmedabad',
    rating: 3,
    text: 'Imaging calls are more orderly, and coordination with reception is smoother. We’d love a couple more shortcuts for faster updates during rush hours.',
    date: '1 month ago',
  },
];

const certificationsPreview = [
  { name: 'HIPAA', icon: Shield },
  { name: 'ISO 27001', icon: Award },
  { name: 'SOC 2', icon: CheckCircle2 },
  { name: 'GDPR', icon: Lock },
];

// Stats/metrics
const stats = [
  { label: 'Hospitals Using Clinic OS', value: '500+', icon: Building2 },
  { label: 'Patients Served Daily', value: '50K+', icon: Users },
  { label: 'Average Setup Time', value: '< 30 min', icon: Clock },
  { label: 'Customer Satisfaction', value: '98%', icon: Heart },
];

// Features with icons
const features = [
  {
    icon: Calendar,
    title: 'Appointment Booking',
    description:
      'Handle walk-ins and pre-booked appointments in one place—tokens, time-slots, and live status.',
  },
  {
    icon: Users,
    title: 'Department Routing',
    description:
      'Move patients across departments (X-ray, ultrasound, lab) with clear handoffs and live tracking.',
  },
  {
    icon: FileText,
    title: 'Smart Prescriptions',
    description:
      'Write prescriptions faster with medicine suggestions and reusable templates.',
  },
  {
    icon: CreditCard,
    title: 'Billing & Payments',
    description: 'Generate bills, collect payments, and keep finance operations tidy for your clinic.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'See wait-time trends, department load, and operational insights that drive decisions.',
  },
];

// Pricing tiers (for future use)
// const pricingTiers = [
//   {
//     name: 'Starter',
//     price: '$99',
//     period: '/month',
//     features: [
//       'Up to 2 departments',
//       'Up to 10 doctors',
//       'Basic queue management',
//       'Email support',
//     ],
//   },
//   {
//     name: 'Professional',
//     price: '$299',
//     period: '/month',
//     features: [
//       'Unlimited departments',
//       'Unlimited doctors',
//       'Advanced analytics',
//       'Priority support',
//       'Custom domain',
//     ],
//     popular: true,
//   },
//   {
//     name: 'Enterprise',
//     price: 'Custom',
//     period: '',
//     features: [
//       'Everything in Professional',
//       'Dedicated account manager',
//       'Custom integrations',
//       'SLA guarantee',
//       'On-premise option',
//     ],
//   },
// ];

export default function Landing() {
  // Easter egg: hovering (or focusing) the hero headline swaps the copy for a fun alternate tagline.
  const [isHeroHeadlineEasterEggActive, setIsHeroHeadlineEasterEggActive] = useState(false);

  const demoVideoWrapperRef = useRef<HTMLDivElement | null>(null);
  const demoVideoRef = useRef<HTMLVideoElement | null>(null);
  const demoVideoMuteLockedByUserRef = useRef(false);
  const [isDemoVideoMuted, setIsDemoVideoMuted] = useState(true);

  useEffect(() => {
    const wrapperEl = demoVideoWrapperRef.current;
    const videoEl = demoVideoRef.current;
    if (!wrapperEl || !videoEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          // Autoplay (muted) once the user scrolls to the video section.
          // Only enforce mute for autoplay until the user explicitly changes it.
          if (!demoVideoMuteLockedByUserRef.current) {
            videoEl.muted = true;
            setIsDemoVideoMuted(true);
          }
          void videoEl.play().catch(() => {
            // Ignore autoplay rejections (browser policy); the video will remain paused.
          });
        } else {
          // Pause when out of view to avoid background playback.
          videoEl.pause();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(wrapperEl);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Clinic OS</h1>
          </div>
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Trusted by 500+ Healthcare Facilities</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            <span
              onMouseEnter={() => setIsHeroHeadlineEasterEggActive(true)}
              onMouseLeave={() => setIsHeroHeadlineEasterEggActive(false)}
              onFocus={() => setIsHeroHeadlineEasterEggActive(true)}
              onBlur={() => setIsHeroHeadlineEasterEggActive(false)}
              tabIndex={0}
              className="outline-none"
            >
              {isHeroHeadlineEasterEggActive ? (
                <span className="inline-flex items-baseline gap-3 font-semibold">
                  <span className="font-handwritten font-normal text-4xl md:text-5xl text-muted-foreground">
                    tldr
                  </span>
                  <span>Shopify for Clinics and Hospitals</span>
                </span>
              ) : (
                <>
                  Management System for{' '}
                  <span className="relative inline-block">
                    Modern Clinics
                    <svg
                      className="absolute left-0 -bottom-3 w-full h-[18px] pointer-events-none"
                      viewBox="0 0 300 24"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 18 C 60 8, 120 22, 176 14 S 255 10, 294 14"
                        fill="none"
                        stroke="rgb(16 185 129)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.75"
                      />
                    </svg>
                  </span>
                </>
              )}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Run your clinic from one place — book appointments, write prescriptions, create bills, and move patients
            between departments. See what’s happening in real time and keep the day running smoothly.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={APP_LOGIN_URL}>Start Free</a>
            </Button>
            <CalDemoButton size="lg" variant="outline">
              Schedule Demo
            </CalDemoButton>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div id="features" className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-center text-muted-foreground mb-12">
            The core workflows clinic owners care about—appointments, prescriptions, billing, and visibility.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            <Card id="security" className="hover:shadow-lg transition-shadow scroll-mt-20">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Security &amp; Compliance</CardTitle>
                <CardDescription>
                  Built with security and compliance at the core. Review the standards we align with.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {certificationsPreview.map((c) => (
                    <span
                      key={c.name}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-background"
                    >
                      <c.icon className="h-4 w-4 text-primary" />
                      {c.name}
                    </span>
                  ))}
                </div>
                <Button variant="outline" asChild>
                  <Link to="/certifications">View Certifications</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Video */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">See Clinic OS in Action</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A quick walkthrough of how Clinic OS makes reception flow predictable, reduces wait-time confusion, and keeps doctors on pace.
            </p>
          </div>
          <div className="relative mx-auto max-w-4xl px-2 sm:px-0">
            {/* Glass accent (decorative) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10 blur-2xl"
            >
              <div className="absolute left-1/2 top-1/2 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-gradient-to-r from-primary/20 via-emerald-400/10 to-sky-400/20 border border-white/20 dark:border-white/10 backdrop-blur-xl" />
            </div>

            <Card className="overflow-hidden rounded-2xl border bg-background/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/50">
              <div ref={demoVideoWrapperRef} className="relative aspect-video w-full bg-muted">
                <video
                  ref={demoVideoRef}
                  className="h-full w-full object-cover"
                  src="https://asset.splitpe.in/demo-video.mp4"
                  muted={isDemoVideoMuted}
                  playsInline
                  preload="metadata"
                  // Show a "thumbnail" frame by seeking to 3s and pausing until the section scrolls into view.
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    try {
                      video.currentTime = 3;
                    } catch {
                      // no-op: some browsers may block seeking until enough data is buffered
                    }
                    video.pause();
                  }}
                />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Restart video from beginning (with sound)"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-background/60 text-foreground shadow-sm backdrop-blur hover:bg-background/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(e) => {
                      e.stopPropagation();
                      const video = demoVideoRef.current;
                      if (!video) return;

                      // User intent: restart AND enable sound.
                      demoVideoMuteLockedByUserRef.current = true;
                      setIsDemoVideoMuted(false);
                      video.muted = false;

                      try {
                        video.currentTime = 0;
                      } catch {
                        // no-op
                      }

                      void video.play().catch(() => {
                        // no-op
                      });
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label={isDemoVideoMuted ? 'Unmute video' : 'Mute video'}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-background/60 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-background/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(e) => {
                      e.stopPropagation();
                      const video = demoVideoRef.current;
                      if (!video) return;

                      demoVideoMuteLockedByUserRef.current = true;
                      const nextMuted = !isDemoVideoMuted;
                      setIsDemoVideoMuted(nextMuted);
                      video.muted = nextMuted;

                      // If the user unmutes while paused (e.g., autoplay blocked), try to start playback.
                      if (!nextMuted && video.paused) {
                        void video.play().catch(() => {
                          // no-op
                        });
                      }
                    }}
                  >
                    {isDemoVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="leading-none">{isDemoVideoMuted ? 'Muted' : 'Sound on'}</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-muted-foreground">
              See what clinics and hospital teams across India are saying about Clinic OS
            </p>
          </div>
          {/* Mobile: stack cards (no horizontal scroll). Desktop: single-row scroller. */}
          <div className="grid gap-4 sm:grid-cols-2 md:flex md:gap-6 md:overflow-x-auto md:pb-2 md:snap-x md:snap-mandatory">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="relative w-full md:flex-shrink-0 md:snap-start md:w-[320px] lg:w-[calc((100%-48px)/3)]"
              >
                <CardHeader className="p-4 pb-3">
                  <Quote className="h-6 w-6 text-primary/20 absolute top-3 right-3" />
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-xs leading-relaxed">
                    {testimonial.text.length > 120 ? `${testimonial.text.slice(0, 120)}…` : testimonial.text}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-start gap-3 p-4 pt-0">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground leading-snug">
                      {testimonial.role} • {testimonial.hospital}
                    </div>
                  </div>
                  <div className="ml-auto shrink-0 pt-0.5 text-xs text-muted-foreground whitespace-nowrap">
                    {testimonial.date}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link to="/testimonials">Read more reviews</Link>
            </Button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-20">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Transform Your Clinic?</CardTitle>
              <CardDescription className="text-primary-foreground/90 text-lg">
                Join hundreds of clinics already using Clinic OS. Get started in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" asChild>
                  <a href={APP_LOGIN_URL}>
                    <span className="inline-flex items-center gap-2">
                      <span>Get Started Now</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </span>
                  </a>
                </Button>
                <CalDemoButton
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Schedule Demo
                </CalDemoButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Why + Integrations (single unit) */}
        <div id="why" className="mb-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Clinic OS?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Predictable reception flow, compliant operations, and integrations that fit how your team already works.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Why Clinic Owners Stick With It</CardTitle>
                <CardDescription>Daily operations feel calmer, faster, and more measurable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl border bg-background p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Increase efficiency</div>
                    <div className="text-sm text-muted-foreground">
                      Reduce wait time confusion with live queues, clear handoffs, and better visibility.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border bg-background p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Secure & compliant</div>
                    <div className="text-sm text-muted-foreground">
                      Built with security and compliance in mind for storing patient data and running operations.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border bg-background p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Easy setup</div>
                    <div className="text-sm text-muted-foreground">
                      Start in minutes. We help you migrate workflows and onboard reception + doctors quickly.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="integrations">
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect Clinic OS to your existing tools. If you need a specific integration, we’ll help you plan it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
                  <div>
                    <div className="font-medium">WhatsApp & SMS</div>
                    <div className="text-sm text-muted-foreground">
                      Appointment reminders, queue updates, and patient notifications.
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
                  <div>
                    <div className="font-medium">Payments</div>
                    <div className="text-sm text-muted-foreground">UPI and card payment workflows (optional).</div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
                  <div>
                    <div className="font-medium">Custom integrations</div>
                    <div className="text-sm text-muted-foreground">
                      Build on top of our APIs for your clinic and hospital needs.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Start free for a single clinic. Upgrade when you need compliant storage, billing, analytics, and reporting.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between gap-3">
                  <span>Free</span>
                  <span className="text-sm font-medium text-muted-foreground">Always free</span>
                </CardTitle>
                <CardDescription>For single-clinic teams starting digital workflows</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-3xl font-bold mb-4">₹0</div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Appointment booking</li>
                  <li>Prescription writing + medicine suggestions</li>
                  <li>Move patients across departments (X-ray / ultrasound / lab)</li>
                  <li>Single clinic</li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button className="w-full" asChild>
                  <a href={APP_LOGIN_URL}>Get Started</a>
                </Button>
              </CardFooter>
            </Card>
            <Card className="h-full flex flex-col border-primary/40">
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <CardDescription>For clinics that need reporting, billing, and compliant records</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
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
              <CardFooter className="mt-auto">
                <CalDemoButton className="w-full">Schedule Demo</CalDemoButton>
              </CardFooter>
            </Card>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For hospitals and networks with custom workflows</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-3xl font-bold mb-4">Custom</div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Everything in Growth</li>
                  <li>Custom plans and rollout support</li>
                  <li>Custom integrations</li>
                  <li>SLA + procurement support</li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/schedule-demo">Talk to Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link to="/pricing">View full feature comparison</Link>
            </Button>
          </div>
        </div>

        {/* Company sections intentionally omitted from landing to keep the page focused */}
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold">Clinic OS</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Modern queue management system for healthcare facilities.
              </p>
              <Link to="/testimonials" className="flex items-center gap-1 hover:opacity-90">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium underline underline-offset-4">4.3/5</span>
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-primary">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/blogs" className="hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <a href="#security" className="hover:text-primary">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#integrations" className="hover:text-primary">
                    Integrations
                  </a>
                </li>
                <li>
                  <Link to="/testimonials" className="hover:text-primary">
                    Testimonials
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Certifications</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/certifications" className="hover:text-primary">
                    Certified &amp; Compliant
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://asset.splitpe.in/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://asset.splitpe.in/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Clinic OS. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link to="/certifications" className="flex items-center gap-1 hover:text-primary">
                  <Shield className="h-4 w-4" />
                  HIPAA Compliant
                </Link>
                <Link to="/certifications" className="flex items-center gap-1 hover:text-primary">
                  <Award className="h-4 w-4" />
                  ISO 27001
                </Link>
                <Link to="/certifications" className="flex items-center gap-1 hover:text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  SOC 2 Type II
                </Link>
              </div>
            </div>
            <div className="mt-6">
              <AppFooter />
            </div>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}

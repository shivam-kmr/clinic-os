import { useState } from 'react';
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
  Globe,
  Smartphone,
  Headphones,
} from 'lucide-react';
import AppFooter from '@/components/AppFooter';
import { CalDemoButton } from '@/components/CalDemoPopup';
import { CookieConsent } from '@/components/CookieConsent';

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
    rating: 5,
    text: 'We track patient flow across reception and doctors without manual follow-ups. The dashboard gives a clear view of the day and operations feel more standardized.',
    date: '3 months ago',
  },
  {
    id: 3,
    name: 'Sneha Sharma',
    role: 'Receptionist',
    hospital: 'Shree Medicare Clinic, Jaipur',
    rating: 5,
    text: 'Check-ins are faster and there’s less arguing at the counter. Patients can see their status and we get fewer “how long?” calls every hour.',
    date: '4 weeks ago',
  },
  {
    id: 4,
    name: 'Amit Patel',
    role: 'X-ray Technician',
    hospital: 'Prime Diagnostics, Ahmedabad',
    rating: 5,
    text: 'Imaging calls are now orderly — no more crowding outside the room. Coordination with reception is smoother and we complete scans quicker during rush hours.',
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
    title: 'Appointment Management',
    description:
      'Manage both walk-in and pre-booked appointments with ease. Support for token-based and time-slot booking systems.',
  },
  {
    icon: Users,
    title: 'Real-time Queue Updates',
    description:
      'Live queue updates for reception, doctors, and waiting rooms. Keep everyone informed with real-time status changes.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      'Track wait times, patient flow, and clinic performance with detailed analytics and reporting.',
  },
  {
    icon: Shield,
    title: 'Multi-tenant Architecture',
    description:
      'Built for scale. Each hospital gets its own subdomain or custom domain with complete data isolation.',
  },
  {
    icon: Zap,
    title: 'Fast & Reliable',
    description:
      'Built with modern technologies for speed and reliability. Handle high traffic with confidence.',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description:
      'Use your own domain name or subdomain. Professional branding with full DNS verification support.',
  },
  {
    icon: Smartphone,
    title: 'Patient Portal',
    description:
      'Empower patients with self-service booking, queue tracking, and appointment management.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description:
      'Dedicated support team available around the clock to help you succeed.',
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
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
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
                    TL;DR 
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
            Streamline your clinic operations with our comprehensive queue management system.
            Manage appointments, track patient flow, and improve efficiency with real-time updates
            and powerful analytics.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Link to="/testimonials" className="flex items-center gap-1 hover:opacity-90">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium underline underline-offset-4">4.9/5</span>
              <span className="text-sm text-muted-foreground ml-1 underline underline-offset-4">
                (847 reviews)
              </span>
            </Link>
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/login">Start Free Trial</Link>
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

        {/* Certifications/Approvals */}
        <div id="security" className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Security & Compliance</h2>
          <p className="text-center text-muted-foreground mb-8">
            Built with security and compliance at the core. View our certifications overview.
          </p>
          <div className="max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle>See our security & compliance overview</CardTitle>
                <CardDescription>
                  A concise breakdown of standards we align with and how we protect clinic and patient data.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap justify-center gap-3">
                  {certificationsPreview.map((c) => (
                    <span
                      key={c.name}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground bg-background"
                    >
                      <c.icon className="h-4 w-4 text-primary" />
                      {c.name}
                    </span>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button asChild>
                    <Link to="/certifications">View Certifications</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-center text-muted-foreground mb-12">
            Powerful features designed for modern healthcare facilities
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
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
          <Card className="overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div className="aspect-video w-full bg-muted">
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/ZK-rNEhJIDs?rel=0"
                title="Clinic OS Product Overview"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </Card>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-muted-foreground">
              See what clinics and hospital teams across India are saying about Clinic OS
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative">
                <CardHeader>
                  <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base">{testimonial.text}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.hospital}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{testimonial.date}</div>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link to="/testimonials">View all 847 reviews</Link>
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
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/login">
                    <span className="inline-flex items-center gap-2">
                      <span>Get Started Now</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </span>
                  </Link>
                </Button>
                <CalDemoButton
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Schedule Demo
                </CalDemoButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Clinic OS?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Increase Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Reduce wait times by up to 40% and improve patient satisfaction with real-time
                  queue management.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  HIPAA compliant, SOC 2 certified, and ISO 27001 certified. Your data is secure
                  and protected.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get started in under 30 minutes. No technical expertise required. Our team is
                  here to help.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integrations */}
        <div id="integrations" className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Integrations</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect Clinic OS to your existing tools. If you need a specific integration, we’ll help you plan it.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp & SMS</CardTitle>
                <CardDescription>Appointment reminders and queue notifications</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>UPI and card payment workflows (optional)</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Custom Integrations</CardTitle>
                <CardDescription>Build on top of our APIs for your clinic needs</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transparent plans for clinics of all sizes. Choose a plan based on departments, doctors, and volume.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For small clinics getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Queue + appointments</li>
                  <li>Reception + doctor views</li>
                  <li>Basic reports</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link to="/login">Start Free Trial</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <CardDescription>For multi-doctor clinics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Advanced queue rules</li>
                  <li>Analytics</li>
                  <li>Priority support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <CalDemoButton className="w-full">Schedule Demo</CalDemoButton>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For hospitals and networks</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Multi-location rollout</li>
                  <li>Custom integrations</li>
                  <li>SLA & procurement support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Talk to Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Resources */}
        <div id="documentation" className="mb-20 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">Resources</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Helpful links for implementation and support.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card id="api">
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>For integrations and custom workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription>Available on request for production deployments.</CardDescription>
              </CardContent>
            </Card>
            <Card id="support">
              <CardHeader>
                <CardTitle>Support</CardTitle>
                <CardDescription>Help when you need it</CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription>Chat + email support during onboarding and rollout.</CardDescription>
              </CardContent>
            </Card>
            <Card id="blog">
              <CardHeader>
                <CardTitle>Blog</CardTitle>
                <CardDescription>Product updates and best practices</CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription>Coming soon.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Company sections intentionally omitted from landing to keep the page focused */}
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
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
                <span className="ml-2 text-sm font-medium underline underline-offset-4">4.9/5</span>
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
                  <a href="#pricing" className="hover:text-primary">
                    Pricing
                  </a>
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
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#documentation" className="hover:text-primary">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#api" className="hover:text-primary">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#support" className="hover:text-primary">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#blog" className="hover:text-primary">
                    Blog
                  </a>
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

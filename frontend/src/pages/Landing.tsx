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

// Testimonials from hospital owners/managers
const testimonials = [
  {
    id: 1,
    name: 'Dr. James Wilson',
    role: 'Hospital Administrator',
    hospital: 'Metro Health Center',
    rating: 5,
    text: 'Clinic OS has transformed our patient flow. Wait times decreased by 40% and patient satisfaction scores are at an all-time high. The system is intuitive and our staff loves it.',
    date: '3 months ago',
  },
  {
    id: 2,
    name: 'Sarah Martinez',
    role: 'Operations Manager',
    hospital: 'Community Medical Group',
    rating: 5,
    text: 'The real-time queue updates and appointment management features have streamlined our operations significantly. Setup was quick and the support team is excellent.',
    date: '2 months ago',
  },
  {
    id: 3,
    name: 'Dr. Robert Chen',
    role: 'Chief Medical Officer',
    hospital: 'Regional Healthcare Network',
    rating: 5,
    text: 'As a multi-location practice, Clinic OS has been a game-changer. Each location has its own portal, but we can manage everything centrally. Highly recommend!',
    date: '4 months ago',
  },
  {
    id: 4,
    name: 'Lisa Thompson',
    role: 'Reception Manager',
    hospital: 'Family Care Clinic',
    rating: 5,
    text: 'The patient portal integration is fantastic. Patients can book their own appointments, and we spend less time on phone calls. The queue management is flawless.',
    date: '1 month ago',
  },
];

// Industry certifications and approvals
const certifications = [
  {
    name: 'HIPAA Compliant',
    icon: Shield,
    description: 'Fully compliant with Health Insurance Portability and Accountability Act',
    verified: true,
  },
  {
    name: 'ISO 27001',
    icon: Award,
    description: 'Information security management system certified',
    verified: true,
  },
  {
    name: 'SOC 2 Type II',
    icon: CheckCircle2,
    description: 'Security, availability, and confidentiality controls verified',
    verified: true,
  },
  {
    name: 'HITECH Act',
    icon: Shield,
    description: 'Health Information Technology for Economic and Clinical Health Act compliant',
    verified: true,
  },
  {
    name: 'GDPR Compliant',
    icon: Lock,
    description: 'General Data Protection Regulation compliant for EU operations',
    verified: true,
  },
  {
    name: 'HL7 FHIR',
    icon: Award,
    description: 'Fast Healthcare Interoperability Resources standard compliant',
    verified: true,
  },
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
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Management System for Modern Clinics
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Streamline your clinic operations with our comprehensive queue management system.
            Manage appointments, track patient flow, and improve efficiency with real-time updates
            and powerful analytics.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium">4.9/5</span>
              <span className="text-sm text-muted-foreground ml-1">(847 reviews)</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/login">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Schedule Demo</Link>
            </Button>
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
          <h2 className="text-3xl font-bold text-center mb-4">Certified & Compliant</h2>
          <p className="text-center text-muted-foreground mb-8">
            Built with security and compliance at the core
          </p>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {certifications.map((cert, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <cert.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <CardTitle className="text-sm">{cert.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{cert.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
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

        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-muted-foreground">
              See what hospital administrators and staff are saying about Clinic OS
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
                    Get Started Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/login">Schedule Demo</Link>
                </Button>
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
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
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
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium">4.9/5</span>
              </div>
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
                  <a href="#about" className="hover:text-primary">
                    About
                  </a>
                </li>
                <li>
                  <a href="#careers" className="hover:text-primary">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-primary">
                    Contact
                  </a>
                </li>
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
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  HIPAA Compliant
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  ISO 27001
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  SOC 2 Type II
                </span>
              </div>
            </div>
            <div className="mt-6">
              <AppFooter />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

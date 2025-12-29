import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { usePatientStore } from '../store/patientStore';
import {
  Building2,
  Users,
  Stethoscope,
  Calendar,
  Star,
  CheckCircle2,
  Shield,
  Award,
  Clock,
  Heart,
  Phone,
  Mail,
  MapPin,
  Quote,
} from 'lucide-react';

// Testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Patient',
    rating: 5,
    text: 'Booking appointments has never been easier! The online system is intuitive and I can see my queue position in real-time. Highly recommend!',
    date: '2 weeks ago',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Patient',
    rating: 5,
    text: 'The wait time estimates are accurate and the staff is always helpful. Great experience overall!',
    date: '1 month ago',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Patient',
    rating: 5,
    text: 'I love being able to reschedule appointments online. It saves so much time and the system is very reliable.',
    date: '3 weeks ago',
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Patient',
    rating: 5,
    text: 'The digital queue system is fantastic. No more waiting in crowded waiting rooms - I get notified when it\'s my turn.',
    date: '1 week ago',
  },
];

// Industry approvals/certifications
const certifications = [
  {
    name: 'HIPAA Compliant',
    icon: Shield,
    description: 'Fully compliant with Health Insurance Portability and Accountability Act',
  },
  {
    name: 'ISO 27001',
    icon: Award,
    description: 'Information security management system certified',
  },
  {
    name: 'SOC 2 Type II',
    icon: CheckCircle2,
    description: 'Security, availability, and confidentiality controls verified',
  },
  {
    name: 'HITECH Act',
    icon: Shield,
    description: 'Health Information Technology for Economic and Clinical Health Act compliant',
  },
];

// Stats
const stats = [
  { label: 'Patients Served', value: '50K+', icon: Users },
  { label: 'Average Wait Time', value: '< 15 min', icon: Clock },
  { label: 'Patient Satisfaction', value: '98%', icon: Heart },
  { label: 'Appointments Booked', value: '200K+', icon: Calendar },
];

export default function Landing() {
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const [isLoading, setIsLoading] = useState(true);

  const { data: hospitalData, isLoading: isLoadingHospital } = useQuery({
    queryKey: ['hospital-info'],
    queryFn: async () => {
      // For localhost, try to get hospital ID from env or localStorage
      const hostname = window.location.hostname;
      const hospitalId = 
        import.meta.env.VITE_HOSPITAL_ID || 
        (hostname === 'localhost' || hostname.startsWith('localhost:') 
          ? localStorage.getItem('hospitalId') 
          : null);
      
      const response = await patientApi.getHospitalInfo(hospitalId || undefined);
      // Store hospital ID in localStorage for localhost development
      if (response.data?.hospital?.id) {
        localStorage.setItem('hospitalId', response.data.hospital.id);
      }
      return response.data;
    },
  });

  useEffect(() => {
    if (!isLoadingHospital) {
      setIsLoading(false);
    }
  }, [isLoadingHospital]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const hospital = hospitalData?.hospital;
  const departments = hospitalData?.departments || [];
  const doctors = hospitalData?.doctors || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{hospital?.name || 'Clinic OS'}</h1>
          </div>
          <div className="flex gap-2">
            {patient ? (
              <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/signup')}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Star className="h-4 w-4 fill-primary" />
            <span className="text-sm font-medium">Trusted by 50,000+ Patients</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to {hospital?.name || 'Our Clinic'}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience modern healthcare with our digital appointment system. Book appointments,
            track your queue position, and manage your health records all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium">4.9/5</span>
              <span className="text-sm text-muted-foreground ml-1">(447 reviews)</span>
            </div>
          </div>
          {!patient && (
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup')}>
                Book Appointment
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          )}
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

        {/* Hospital Info */}
        {hospital && (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hospital.address ? (
                  <p className="text-muted-foreground">{hospital.address}</p>
                ) : (
                  <p className="text-muted-foreground">Address not available</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hospital.phone ? (
                  <a href={`tel:${hospital.phone}`} className="text-primary hover:underline">
                    {hospital.phone}
                  </a>
                ) : (
                  <p className="text-muted-foreground">Phone not available</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hospital.email ? (
                  <a href={`mailto:${hospital.email}`} className="text-primary hover:underline">
                    {hospital.email}
                  </a>
                ) : (
                  <p className="text-muted-foreground">Email not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Certifications/Approvals */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Certified & Compliant</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <cert.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">{cert.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{cert.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Departments */}
        {departments.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Our Departments
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {departments.map((dept: any) => (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{dept.name}</CardTitle>
                    {dept.description && (
                      <CardDescription>{dept.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Doctors */}
        {doctors.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              Our Expert Doctors
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {doctors.slice(0, 6).map((doctor: any) => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </CardTitle>
                    {doctor.specialization && (
                      <CardDescription>
                        <Badge variant="secondary">{doctor.specialization}</Badge>
                      </CardDescription>
                    )}
                    {doctor.department && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {doctor.department.name}
                      </p>
                    )}
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      Book Appointment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">What Our Patients Say</h2>
            <p className="text-muted-foreground">
              Don't just take our word for it - hear from our satisfied patients
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
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{testimonial.date}</div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!patient && (
          <div className="text-center">
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center justify-center gap-2">
                  <Calendar className="h-8 w-8" />
                  Ready to Book Your Appointment?
                </CardTitle>
                <CardDescription className="text-primary-foreground/90 text-lg">
                  Join thousands of satisfied patients. Sign up now and experience seamless healthcare management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/signup')}
                  >
                    Create Account
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold">{hospital?.name || 'Clinic OS'}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Providing quality healthcare services with modern technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">About Us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">Services</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Patient Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">Book Appointment</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">Patient Portal</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">FAQ</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compliance</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>HIPAA Compliant</li>
                <li>ISO 27001 Certified</li>
                <li>SOC 2 Type II</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {hospital?.name || 'Clinic OS'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

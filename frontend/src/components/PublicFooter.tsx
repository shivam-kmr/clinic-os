import { Link } from 'react-router-dom';
import { Award, Building2, CheckCircle2, Shield, Star } from 'lucide-react';
import AppFooter from '@/components/AppFooter';

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/50 mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">Clinic OS</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Modern clinic operations — appointments, prescriptions, billing, and patient flow.
            </p>
            <Link to="/testimonials" className="flex items-center gap-1 hover:opacity-90">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium underline underline-offset-4">4.3/5</span>
              <span className="text-sm text-muted-foreground ml-1 underline underline-offset-4">(447 reviews)</span>
            </Link>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/#features" className="hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/#security" className="hover:text-primary">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/#integrations" className="hover:text-primary">
                  Integrations
                </Link>
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
                <a
                  href="https://asset.splitpe.in/privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://asset.splitpe.in/terms.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Clinic OS. All rights reserved.</p>
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
  );
}



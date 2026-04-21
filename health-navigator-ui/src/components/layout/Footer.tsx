import { Link } from 'react-router-dom';
import { Calendar, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

const footerLinks = {
  forHospitals: [
    { name: 'Partner With Us', path: '/partner' },
    { name: 'Doctor Login', path: '/login' },
  ],
  aboutUs: [
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/support' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Apna Clinic</span>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70">
              Find and book the best hospitals near you with AI-powered recommendations.
            </p>
          </div>

          {/* For Hospitals */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              For Hospitals
            </h3>
            <ul className="space-y-3">
              {footerLinks.forHospitals.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              About Us
            </h3>
            <ul className="space-y-3">
              {footerLinks.aboutUs.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Connect With Us
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 md:flex-row">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Apna Clinic. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

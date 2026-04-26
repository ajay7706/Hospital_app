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
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground p-1.5">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 6V11M12 11V16M12 11H7M12 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              <span className="text-xl font-bold">Clinoza</span>
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
            © {new Date().getFullYear()} Clinoza. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy-policy"
              className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { Link } from 'react-router-dom';

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

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm p-1.5 shrink-0">
                <img src="/logo.png" alt="Clinoza Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight">Clinoza</span>
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

          {/* Contact Details (Filling empty space on right) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="text-sm text-primary-foreground/70">
                <span className="block font-medium text-primary-foreground/90">Email:</span>
                <a href="mailto:support@clinoza.com" className="hover:text-primary-foreground transition-colors">
                  support@clinoza.com
                </a>
              </li>
              <li className="text-sm text-primary-foreground/70">
                <span className="block font-medium text-primary-foreground/90">HQ Office:</span>
                <span>New Delhi, Delhi 110001, India</span>
              </li>
              <li className="text-sm text-primary-foreground/70">
                <span className="block font-medium text-primary-foreground/90">Availability:</span>
                <span>24x7 Customer Support</span>
              </li>
            </ul>
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

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  {
    icon: Users,
    title: 'Manage Doctors',
    description: 'Add and manage your team of doctors efficiently.',
  },
  {
    icon: Building2,
    title: 'Facility Management',
    description: 'Showcase your facilities and specialties.',
  },
  {
    icon: TrendingUp,
    title: 'Reduce No-Shows',
    description: 'Smart reminders help reduce patient no-shows.',
  },
];

export const ForHospitals = () => {
  return (
    <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-foreground" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium">
              For Healthcare Providers
            </span>
            <h2 className="mt-4 text-2xl font-bold md:text-3xl lg:text-4xl">
              Are you a Hospital or Clinic?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join our platform to reach more patients, manage appointments efficiently,
              and grow your healthcare practice.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-primary-foreground/70">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link to="/signup">
              <Button
                variant="secondary"
                size="lg"
                className="mt-8 gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Register Your Hospital <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {[
              { value: '500+', label: 'Partner Hospitals' },
              { value: '10K+', label: 'Doctors' },
              { value: '100K+', label: 'Appointments' },
              { value: '95%', label: 'Satisfaction Rate' },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-xl bg-primary-foreground/10 p-6 text-center backdrop-blur-sm"
              >
                <p className="text-3xl font-bold md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

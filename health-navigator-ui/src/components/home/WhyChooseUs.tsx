import { Brain, ShieldCheck, Bell, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Get personalized hospital recommendations based on your specific health needs.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Hospitals',
    description: 'All hospitals and doctors are thoroughly verified for quality care.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Never miss an appointment with automatic reminders and notifications.',
  },
  {
    icon: Clock,
    title: 'Time-Saving',
    description: 'Book appointments in minutes, not hours. Your time matters to us.',
  },
];

export const WhyChooseUs = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Why Choose Clinoza?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Experience healthcare booking reimagined with cutting-edge technology
            and patient-first approach.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl bg-card p-6 text-center shadow-sm transition-all hover:shadow-card"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

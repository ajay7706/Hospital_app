import { Search, Building2, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Search,
    title: 'Easy Search',
    description: 'Find hospitals easily by location and specialty.',
  },
  {
    icon: Building2,
    title: 'Choose Hospital',
    description: 'Select & book from verified healthcare providers.',
  },
  {
    icon: CalendarCheck,
    title: 'Book Appointment',
    description: 'Get care with confirmed appointments.',
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-background p-6 shadow-sm"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

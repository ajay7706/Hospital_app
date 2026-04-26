import { motion } from 'framer-motion';
import { Scale, FileWarning, ClipboardCheck, AlertCircle, Info } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=2000" 
            alt="Terms and Conditions" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[6px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight"
          >
            Terms & <span className="text-primary">Conditions</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-medium"
          >
            Welcome to Clinoza. By using this platform, you agree to the following terms.
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card p-8 md:p-12 rounded-3xl border border-border shadow-sm"
        >
          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground m-0">Platform Agreement</h2>
            </div>

            <div className="space-y-10">
              {/* General Terms */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  General Usage
                </h3>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  <li>• Clinoza is a digital platform that connects patients with hospitals and clinics.</li>
                  <li>• We do not provide medical advice, diagnosis, or treatment.</li>
                  <li>• All medical services are provided by the respective hospitals or doctors.</li>
                </ul>
              </section>

              {/* Appointments */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Appointments
                </h3>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  <li>• Appointment timing may vary depending on hospital workflow.</li>
                  <li>• Clinoza is not responsible for delays or cancellations.</li>
                </ul>
              </section>

              {/* User Responsibility */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-primary" />
                  User Responsibility
                </h3>
                <ul className="space-y-3 text-muted-foreground leading-relaxed">
                  <li>• Provide correct details while booking.</li>
                  <li>• Follow hospital guidelines and protocols.</li>
                </ul>
              </section>

              {/* Liability */}
              <section className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                  Liability Disclaimer
                </h3>
                <p className="text-amber-900 dark:text-amber-300 font-medium">
                  Clinoza is not responsible for any medical outcomes or treatment results. All clinical decisions and outcomes are the sole responsibility of the healthcare provider.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default TermsConditions;

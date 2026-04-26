import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504868584819-f8e905b6dc79?auto=format&fit=crop&q=80&w=2000" 
            alt="Security and Privacy" 
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
            Privacy <span className="text-primary">Policy</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-medium"
          >
            At Clinoza, we value your privacy and are committed to protecting your personal information.
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground m-0">Our Commitment</h2>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              We collect basic user data to provide you with the best possible healthcare connection experience. Here's how we handle your information:
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  What We Collect
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Name
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Phone number
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Appointment details
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  How We Use It
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Provide booking services
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Improve user experience
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Ensure secure storage
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/30 p-8 rounded-2xl border border-border mb-12">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Data Security
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We ensure your data is securely stored with no unauthorized access. <strong>Clinoza does NOT sell or share your personal data with third parties.</strong>
              </p>
            </div>

            <div className="border-t border-border pt-10">
              <p className="text-sm text-muted-foreground italic text-center">
                Clinoza is a digital platform that connects patients with hospitals. We do not provide medical advice or treatment.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

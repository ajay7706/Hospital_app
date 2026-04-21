import { motion } from 'framer-motion';
import { Building2, TrendingUp, Users, Shield, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PartnerWithUs = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-bold mb-6 border border-primary/30">
              For Healthcare Providers
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
              Grow Your Practice with <span className="text-primary">Apna Clinic</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Join India's fastest-growing healthcare network. Manage appointments, reach more patients, and build a digital-first clinic in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="rounded-full shadow-2xl" onClick={() => window.location.href = '/signup'}>
                Register Your Hospital
              </Button>
              <Button size="xl" variant="outline" className="rounded-full border-white text-white hover:bg-white hover:text-slate-900">
                Talk to Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Partner With Us?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We provide the tools you need to modernize your clinic and provide a superior experience to your patients.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: "Increase Patient Reach",
              desc: "Get discovered by thousands of patients searching for quality care in your city."
            },
            {
              icon: Zap,
              title: "Smart Management",
              desc: "Say goodbye to manual registers. Manage doctors, slots, and appointments digitally."
            },
            {
              icon: TrendingUp,
              title: "Digital Growth",
              desc: "Build your online reputation with verified patient reviews and a professional profile."
            },
            {
              icon: Shield,
              title: "Trusted Network",
              desc: "Join a community of verified healthcare providers committed to medical excellence."
            },
            {
              icon: Globe,
              title: "Live Dashboard",
              desc: "Monitor your clinic's performance, bookings, and patient feedback in real-time."
            },
            {
              icon: Building2,
              title: "Multi-Branch Support",
              desc: "Manage all your clinic branches from a single, unified admin dashboard."
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl group"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who Can Join */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
            
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-8">Who Can Join?</h2>
                <div className="space-y-6">
                  {[
                    "Multi-specialty Hospitals",
                    "Individual Doctor Clinics",
                    "Diagnostic & Pathology Labs",
                    "Dental & Eye Care Centers",
                    "Ayurvedic & Wellness Centers"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <CheckCircle2 className="h-6 w-6 text-white shrink-0" />
                      <span className="text-lg font-medium opacity-90">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">Ready to get started?</h3>
                <p className="mb-8 opacity-80">It takes less than 5 minutes to list your practice and start receiving bookings.</p>
                <Button size="lg" variant="secondary" className="w-full h-14 rounded-xl text-primary font-bold text-lg" onClick={() => window.location.href = '/signup'}>
                  Join the Network Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 text-center container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-16">Benefits of Digital Transformation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-4xl font-black text-primary mb-2">40%</p>
            <p className="text-sm text-muted-foreground font-medium">Higher Visibility</p>
          </div>
          <div>
            <p className="text-4xl font-black text-primary mb-2">2x</p>
            <p className="text-sm text-muted-foreground font-medium">Faster Bookings</p>
          </div>
          <div>
            <p className="text-4xl font-black text-primary mb-2">95%</p>
            <p className="text-sm text-muted-foreground font-medium">Patient Satisfaction</p>
          </div>
          <div>
            <p className="text-4xl font-black text-primary mb-2">0</p>
            <p className="text-sm text-muted-foreground font-medium">Setup Fee</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerWithUs;

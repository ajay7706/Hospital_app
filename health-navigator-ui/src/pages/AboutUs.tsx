import { motion } from 'framer-motion';
import { Shield, Target, Users, Clock, MapPin, CheckCircle2 } from 'lucide-react';

import { Footer } from '@/components/layout/Footer';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80" 
            alt="Healthcare professionals" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
          >
            About <span className="text-primary">Apna Clinic</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Your trusted partner in making quality healthcare accessible, transparent, and simple for every Indian family.
          </motion.p>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-6">Changing How India Accesses Care</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We understand the pain of standing in long queues at hospitals, the confusion of finding the right specialist, and the difficulty of booking a simple check-up. 
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              At Apna Clinic, we bridge the gap between patients and hospitals using smart technology. Whether it's live tracking your turn or finding a verified clinic nearby, we make sure your health comes first.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <span className="font-medium text-sm">No More Long Queues</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <span className="font-medium text-sm">Trusted Hospitals</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <span className="font-medium text-sm">Live Appointment Tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <span className="font-medium text-sm">Easy Online Booking</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-primary/5 p-8 rounded-3xl text-center">
              <Users className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold">10K+</h3>
              <p className="text-sm text-muted-foreground">Happy Patients</p>
            </div>
            <div className="bg-blue-50 p-8 rounded-3xl text-center">
              <Shield className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">500+</h3>
              <p className="text-sm text-muted-foreground">Verified Hospitals</p>
            </div>
            <div className="bg-amber-50 p-8 rounded-3xl text-center">
              <Clock className="h-10 w-10 text-amber-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">24/7</h3>
              <p className="text-sm text-muted-foreground">Booking Support</p>
            </div>
            <div className="bg-emerald-50 p-8 rounded-3xl text-center">
              <MapPin className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">50+</h3>
              <p className="text-sm text-muted-foreground">Cities Covered</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card p-10 rounded-3xl shadow-sm border border-border"
            >
              <Target className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To simplify the healthcare journey for everyone by providing a transparent, efficient, and reliable platform that connects people with the best medical care instantly.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card p-10 rounded-3xl shadow-sm border border-border"
            >
              <Shield className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted healthcare companion, ensuring that no patient has to wait or struggle to get the medical attention they deserve.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-20 text-center container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Trusted by Thousands of Doctors</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
          We work closely with healthcare providers to ensure every appointment is honored and every patient is treated with care.
        </p>
        <button 
          onClick={() => window.location.href = '/hospitals'}
          className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all"
        >
          Find Your Doctor Today
        </button>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;

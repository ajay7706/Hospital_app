import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ForHospitals } from '@/components/home/ForHospitals';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

const Index = () => {
  const [featuredHospitals, setFeaturedHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await api.getHospitals();
        // Show top 4 as featured
        setFeaturedHospitals(data.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch featured hospitals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  const getHospitalImage = (h: any) => {
    if (h.hospitalLogo) return h.hospitalLogo;
    if (h.image) return h.image;
    return "/assets/hospital-1.jpg";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Hospitals</h2>
                <p className="text-muted-foreground max-w-2xl">Discover top-rated medical facilities with state-of-the-art equipment and specialized care.</p>
              </div>
              <Link to="/hospitals">
                <Button variant="outline" className="group">
                  View All Hospitals <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
              {featuredHospitals.map((h, i) => (
                <motion.div
                  key={h.id || h._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/hospital-details?id=${h.id || h._id}`}>
                    <Card className="group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="relative h-32 sm:h-48 overflow-hidden shrink-0">
                        <img 
                          src={getHospitalImage(h)} 
                          alt={h.name || h.hospitalName} 
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-bold shadow-sm">
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
                          {h.rating || "4.5"}
                        </div>
                      </div>
                      <div className="p-3 sm:p-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <div className="text-[10px] sm:text-xs font-bold text-primary uppercase">{h.specialty || "General"}</div>
                          {h.ambulanceAvailable && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Ambulance</div>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-xl font-bold group-hover:text-primary transition-colors truncate">{h.name || h.hospitalName}</h3>
                        <div className="flex items-center gap-1 text-[10px] sm:text-sm text-muted-foreground mt-1 mb-1 sm:mb-2">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {h.location || h.city}
                        </div>
                        {h.branchCount > 0 && (
                          <div className="mb-2 sm:mb-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                              {h.branchCount} Branches Available
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                           <div className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 flex items-center gap-1">
                              <span className="text-[9px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">OPD:</span>
                              <span className="text-[11px] sm:text-sm font-black text-emerald-700 dark:text-emerald-300">₹{h.opdCharge || 0}</span>
                           </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2 sm:pt-4 border-t border-border">

                          <div className="flex -space-x-1.5 sm:-space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                              </div>
                            ))}
                            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] sm:text-[10px] font-bold">+12</div>
                          </div>
                          <div className="text-[8px] sm:text-xs font-medium text-muted-foreground truncate ml-1">120+ Patients</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <WhyChooseUs />
        <HowItWorks />
        <ForHospitals />
      </main>
      <Footer />
    </div>
  );
};
export default Index;

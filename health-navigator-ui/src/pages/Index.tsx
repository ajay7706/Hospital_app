import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedHospitals } from '@/components/home/FeaturedHospitals';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ForHospitals } from '@/components/home/ForHospitals';

const Index = () => {
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredHospitals.map((h, i) => (
                <motion.div
                  key={h.id || h._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/hospital-details?id=${h.id || h._id}`}>
                    <Card className="group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={getHospitalImage(h)} 
                          alt={h.name || h.hospitalName} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {h.rating || "4.5"}
                        </div>
                      </div>
                      <CardHeader className="p-5 pb-2">
                        <div className="text-xs font-bold text-primary uppercase mb-1">{h.specialty || "General"}</div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors truncate">{h.name || h.hospitalName}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-3.5 w-3.5" /> {h.location || h.city}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-7 h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                              </div>
                            ))}
                            <div className="w-7 h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold">+12</div>
                          </div>
                          <div className="text-xs font-medium text-muted-foreground">120+ Patients</div>
                        </div>
                      </CardContent>
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

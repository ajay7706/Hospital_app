import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Stethoscope, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-doctor.jpg';
import api from '@/lib/api';

export const HeroSection = () => {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hospitals = await api.getHospitals();
        if (hospitals && hospitals.length > 0) {
          // Extract unique locations and specialties from database (Hospitals + Branches)
          const hospitalLocs = hospitals.map(h => h.location || h.city);
          const branchLocs = hospitals.flatMap(h => h.branchCities || []);
          const uniqueLocs = Array.from(new Set([...hospitalLocs, ...branchLocs])).filter(Boolean);
          
          const hospitalSpecs = hospitals.flatMap(h => Array.isArray(h.specialties) ? h.specialties : []);
          const branchSpecs = hospitals.flatMap(h => h.branchSpecialties || []);
          const uniqueSpecs = Array.from(new Set([...hospitalSpecs, ...branchSpecs]))
            .filter(Boolean)
            .map(s => s.trim())
            .filter((v, i, a) => a.indexOf(v) === i);
          
          setLocations(uniqueLocs as string[]);
          setSpecialties(uniqueSpecs as string[]);
        }
      } catch (err) {
        console.error('Failed to fetch hero filter data:', err);
      }
    };
    fetchData();
  }, []);

  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const displayedSpecialties = showAllSpecialties ? specialties : specialties.slice(0, 8);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (specialty) params.set('specialty', specialty);
    navigate(`/hospitals?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-cta/5">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <h1 className="text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              Find & Book the Best Hospitals{' '}
              <span className="text-primary">Near You</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:mt-6 md:text-xl">
              Get expert care tailored to your needs, powered by AI. Discover nearby
              hospitals based on your health needs, doctors, and facilities.
            </p>

            {/* Search Form */}
            <div className="mt-8 rounded-2xl bg-card p-4 shadow-lg md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12 w-full appearance-none rounded-lg border border-input bg-background pl-10 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Enter your location</option>
                    {locations.length > 0 ? (
                      locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))
                    ) : (
                      <>
                        <option value="New York">New York</option>
                        <option value="Los Angeles">Los Angeles</option>
                        <option value="Chicago">Chicago</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="h-12 w-full appearance-none rounded-lg border border-input bg-background pl-10 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Specialty</option>
                    {specialties.length > 0 ? (
                      specialties.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))
                    ) : (
                      <>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <Button variant="cta" size="lg" className="mt-4 w-full" onClick={handleSearch}>
                Find Best Hospital
              </Button>

              {/* Specialty Quick Tags */}
              {specialties.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Popular Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {displayedSpecialties.map(spec => (
                      <button
                        key={spec}
                        onClick={() => {
                          setSpecialty(spec);
                          const params = new URLSearchParams();
                          params.set('specialty', spec);
                          navigate(`/hospitals?${params.toString()}`);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                          specialty === spec 
                            ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                            : 'bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border/50'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                    {specialties.length > 8 && (
                      <button
                        onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors border border-primary/20"
                      >
                        {showAllSpecialties ? 'Show Less' : `+${specialties.length - 8} More`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="relative">
              <img
                src={heroImage}
                alt="Professional doctor at modern hospital"
                className="w-full rounded-2xl object-cover shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 hidden rounded-xl bg-card p-4 shadow-lg md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cta/10">
                    <Stethoscope className="h-6 w-6 text-cta" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">500+</p>
                    <p className="text-sm text-muted-foreground">Hospitals</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Search, Ambulance } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHospitals as getApiHospitals } from '@/lib/api'; // Removed unused api import
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

interface Hospital {
  id: string;
  name: string;
  image: string;
  location: string;
  address: string;
  rating: number;
  specialties: string[];
  branchCount: number;
  services: { title: string; description?: string }[];
  workingDays: string[];
  hours: string;
  emergency24x7: boolean;
  ambulanceAvailable: boolean;
  opdCharge: number;
}


const Hospitals = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async (query = '') => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/hospitals/all`;
      if (query) {
        url += `?search=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Map API response to local Hospital interface
        const mapped = data.map((h: any) => ({
          id: h._id,
          name: h.hospitalName,
          image: h.hospitalLogo || h.image,
          location: h.city,
          address: h.fullAddress?.address || h.address,
          rating: h.rating || 4.5,
          specialties: Array.isArray(h.specialties) ? h.specialties : (h.specialties ? h.specialties.split(',') : []),
          branchCount: h.branchCount || 0,
          services: h.services || [],
          workingDays: h.workingDays || [],
          hours: `${h.openingTime} - ${h.closingTime}`,
          emergency24x7: h.emergency24x7 || false,
          ambulanceAvailable: h.ambulanceAvailable || false,
          opdCharge: h.opdCharge || 0,
        }));

        setHospitals(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch hospitals:", err);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('location') || '';
    const spec = searchParams.get('specialty') || '';
    
    let initialQuery = q;
    if (!initialQuery && (loc || spec)) {
      initialQuery = [loc, spec].filter(Boolean).join(' ');
    }
    
    setSearchQuery(initialQuery);
    fetchHospitals(initialQuery);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Find the Best Hospitals
          </h1>
          <p className="mt-3 text-muted-foreground">
            Browse verified hospitals and book your visit instantly
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or specialty..."
                className="h-12 pl-10 pr-20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm" className="absolute right-1.5 top-1.5 h-9">
                Search
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-60 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Hospital Cards */}
        {!loading && hospitals.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {hospitals.map((hospital, index) => (
              <Link key={hospital.id || index} to={`/hospital-details?id=${hospital.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md flex flex-col"
                >
                  <div className="relative h-32 sm:h-48 overflow-hidden shrink-0">
                    <img
                      src={hospital.image || '/assets/hospital-1.jpg'}
                      alt={hospital.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-bold shadow-sm">
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
                      {hospital.rating}
                    </div>
                  </div>
                  <div className="p-3 sm:p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-sm sm:text-lg text-foreground group-hover:text-primary transition-colors truncate">
                        {hospital.name}
                      </h3>
                      <div className="mt-1 sm:mt-2 flex items-center justify-between gap-1 text-[10px] sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{hospital.location}</span>
                        </div>
                        {hospital.ambulanceAvailable && (
                          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Ambulance</div>
                        )}
                      </div>
                      {hospital.branchCount > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            {hospital.branchCount} Branches Available
                          </span>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center gap-2">
                         <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1.5 shadow-sm">
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">OPD CHARGE</span>
                            <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">₹{hospital.opdCharge}</span>
                         </div>
                      </div>

                      <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                      {hospital.specialties.slice(0, 2).map((specialty, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] sm:text-xs px-1.5 py-0">
                          {specialty}
                        </Badge>
                      ))}
                      {hospital.specialties.length > 2 && (
                        <Badge variant="secondary" className="text-[9px] sm:text-xs px-1.5 py-0">
                          +{hospital.specialties.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-auto pt-3 sm:pt-4">
                      <Button variant="default" size="sm" className="w-full h-8 sm:h-10 text-xs sm:text-sm">
                        View Hospital
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && hospitals.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No hospitals found matching your search.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Hospitals;

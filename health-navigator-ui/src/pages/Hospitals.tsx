import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Search, Ambulance, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHospitals as getApiHospitals } from '@/lib/api'; // Removed unused api import
import { Badge } from '@/components/ui/badge';
import { HospitalCard } from '@/components/HospitalCard';

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-60 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Hospital Cards */}
        {!loading && hospitals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {hospitals.map((hospital, index) => (
              <motion.div
                key={hospital.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <HospitalCard hospital={hospital} />
              </motion.div>
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

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

interface Hospital {
  id: string;
  name: string;
  image: string;
  location: string;
  address: string;
  rating: number;
  specialties: string[];
  services: { title: string; description?: string }[];
  workingDays: string[];
  hours: string;
  emergency24x7: boolean;
  ambulanceAvailable: boolean;
}

const Hospitals = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const remote = await getApiHospitals(); // Using the renamed import
        if (remote && remote.length > 0) {
          setHospitals(remote as unknown as Hospital[]);
        }
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
        setHospitals([]); // Clear hospitals on error
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();

    // Pre-fill search from URL params (navbar search or hero search)
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('location') || '';
    const spec = searchParams.get('specialty') || '';
    if (q) {
      setSearchQuery(q);
    } else if (loc || spec) {
      setSearchQuery([loc, spec].filter(Boolean).join(' '));
    }
  }, [searchParams]);

  const filteredHospitals = hospitals.filter((h) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const terms = query.split(/\s+/).filter(Boolean);
    const haystack = `${h.name} ${h.location} ${h.specialties.join(' ')}`.toLowerCase(); // Include specialties in search
    return terms.every((term) => haystack.includes(term));
  });

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or specialty..."
                className="h-12 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-60 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Hospital Cards */}
        {!loading && filteredHospitals.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredHospitals.map((hospital, index) => (
              <Link key={hospital.id} to={`/hospital-details?id=${hospital.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-card cursor-pointer"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={hospital.image}
                      alt={hospital.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{hospital.name}</h3>
                    <div className="mt-2 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(hospital.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-muted-foreground">{hospital.rating}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{hospital.location}</span>
                      </div>
                      {hospital.ambulanceAvailable && (
                        <Ambulance className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hospital.specialties.slice(0, 3).map((specialty, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {hospital.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{hospital.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button variant="default" size="sm" className="mt-4 w-full">
                      View Hospital
                    </Button>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredHospitals.length === 0 && (
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

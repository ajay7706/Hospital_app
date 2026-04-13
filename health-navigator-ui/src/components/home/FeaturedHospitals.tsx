import { Link } from 'react-router-dom';
import { Star, MapPin, ChevronRight, Ambulance } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getHospitals } from '@/lib/api';
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

export const FeaturedHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const data = await getHospitals();
        // Ensure data is an array
        setHospitals(Array.isArray(data) ? (data as unknown as Hospital[]) : []);
      } catch (err) {
        console.error('FeaturedHospitals fetch error:', err);
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  if (loading) {
    return (
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Featured Hospitals
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-72 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Featured Hospitals
            </h2>
            <p className="mt-2 text-muted-foreground">
              Top-rated healthcare facilities in your area
            </p>
          </motion.div>
          <Link to="/hospitals">
            <Button variant="ghost" className="hidden gap-1 text-primary md:flex">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hospitals.length > 0 ? (
            hospitals.map((hospital, index) => {
              const rating = hospital.rating || 0;
              return (
                <motion.div
                  key={hospital.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-card"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={hospital.image || '/assets/hospital-1.jpg'}
                      alt={hospital.name || 'Hospital'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-foreground truncate">{hospital.name || 'Hospital Name'}</h3>
                    
                    <div className="mt-2 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground opacity-30'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-muted-foreground">
                        {rating}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{hospital.location || 'Unknown'}</span>
                      </div>
                      {hospital.ambulanceAvailable && (
                        <Ambulance className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(hospital.specialties || []).slice(0, 3).map((specialty, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">
                          {specialty}
                        </Badge>
                      ))}
                      {(hospital.specialties || []).length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          +{(hospital.specialties || []).length - 3} more
                        </Badge>
                      )}
                    </div>

                    <Link to={`/hospital-details?id=${hospital.id}`}>
                      <Button variant="default" size="sm" className="mt-4 w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No featured hospitals found.
            </div>
          )}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link to="/hospitals">
            <Button variant="outline" className="gap-1">
              View All Hospitals <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

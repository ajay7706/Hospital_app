import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, Mail, Building2, ArrowLeft, Clock, Shield, Heart, Syringe, Ambulance, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllHospitals } from '@/lib/hospitalStore';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

// Helper function to get icon based on service title
const getServiceIcon = (title: string = "") => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('emergency')) return Ambulance;
  if (lowerTitle.includes('cardiology')) return Heart;
  if (lowerTitle.includes('dental')) return Activity; // Changed from Tooth
  if (lowerTitle.includes('icu')) return Syringe;
  return Shield; // Default icon
};

const HospitalDetails = () => {
  const [searchParams] = useSearchParams();
  const hospitalId = searchParams.get('id');
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!hospitalId) { setLoading(false); return; }

      try {
        const remote = await api.getHospitalById(hospitalId);
        if (remote) {
          setHospital(remote);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('API getHospitalById failed', err);
      }

      // Fallback to local store
      try {
        const hospitals = getAllHospitals();
        const found = hospitals.find((h) => h.id.toString() === hospitalId);
        setHospital(found || null);
      } catch (err) {
        console.error('Local store access failed', err);
        setHospital(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [hospitalId]);

  const reviews = [
    { name: 'Rahul Sharma', rating: 5, text: 'Excellent care and very professional staff. Highly recommended!', date: '2 weeks ago' },
    { name: 'Priya Patel', rating: 4, text: 'Good facilities and friendly doctors. Wait time could be better.', date: '1 month ago' },
    { name: 'Amit Kumar', rating: 5, text: 'Best hospital experience. Clean, modern, and efficient service.', date: '3 weeks ago' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading hospital details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Hospital not found</h1>
            <p className="mt-2 text-muted-foreground">The hospital you're looking for doesn't exist.</p>
            <Link to="/hospitals">
              <Button variant="default" className="mt-6">Back to Hospitals</Button>
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const rating = hospital.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Banner */}
        <div className="relative h-64 overflow-hidden md:h-80 lg:h-96">
          <img
            src={hospital.image || '/assets/hospital-1.jpg'}
            alt={hospital.name || 'Hospital'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Back Button */}
          <Link
            to="/hospitals"
            className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/30 md:left-8 md:top-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {/* Hospital Info Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-0 left-0 right-0 p-6 md:p-10"
          >
            <div className="container mx-auto flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {hospital.specialty || 'General'}
                </div>
                <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">{hospital.name || 'Hospital'}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < fullStars
                            ? 'fill-amber-400 text-amber-400'
                            : i === fullStars && hasHalf
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-white">{rating}</span>
                  <span className="text-sm text-white/70">(128 reviews)</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                  <MapPin className="h-4 w-4" /> {hospital.location || 'Unknown'}
                </div>
              </div>
              <Link to={`/book?id=${hospital.id}&name=${encodeURIComponent(hospital.name || '')}&location=${encodeURIComponent(hospital.location || '')}`}>
                <Button variant="cta" size="xl" className="shadow-xl">
                  Book Visit Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto flex gap-0 px-4">
            {(['overview', 'services', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-4 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-8 lg:grid-cols-3">
              {/* Left Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* About */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground">About {hospital.name}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {hospital.description || `${hospital.name} is a premier healthcare facility specializing in ${hospital.specialty || 'healthcare'}. Located in ${hospital.location}, we are committed to providing world-class medical care.`}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { value: '50+', label: 'Expert Doctors' },
                    { value: '10K+', label: 'Patients Served' },
                    { value: '15+', label: 'Departments' },
                    { value: hospital.emergency24x7 ? '24/7' : 'Scheduled', label: 'Emergency Care' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="rounded-xl border border-border bg-card p-4 text-center shadow-sm"
                    >
                      <p className="text-2xl font-bold text-primary">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Working Hours */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <Clock className="h-5 w-5 text-primary" /> Working Hours
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                      <span className="text-sm font-medium text-foreground">
                        {Array.isArray(hospital.workingDays) ? hospital.workingDays.join(', ') : (hospital.workingDays || 'Monday - Friday')}
                      </span>
                      <span className="text-sm text-muted-foreground">{hospital.hours || '08:00 AM - 09:00 PM'}</span>
                    </div>
                    {hospital.emergency24x7 && (
                      <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2.5">
                        <span className="text-sm font-medium text-primary">Emergency</span>
                        <span className="text-sm text-primary">24 Hours / 7 Days</span>
                      </div>
                    )}
                    {hospital.ambulanceAvailable && (
                      <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-2.5 border border-red-100">
                        <span className="text-sm font-medium text-red-600 flex items-center gap-2">
                          <Ambulance className="h-4 w-4" /> Ambulance
                        </span>
                        <span className="text-sm text-red-600 font-semibold">Available 24/7</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-foreground">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm font-medium text-foreground">{hospital.address || hospital.location || 'Not Available'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{hospital.phone || '+91 98765 43210'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">
                          {hospital.email || 'contact@hospital.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Book CTA Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center shadow-sm">
                  <h3 className="text-lg font-bold text-foreground">Ready to Visit?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Book your appointment now and get expert care from our specialists.
                  </p>
                  <Link to={`/book?id=${hospital.id}&name=${encodeURIComponent(hospital.name || '')}&location=${encodeURIComponent(hospital.location || '')}`}>
                    <Button variant="cta" size="lg" className="mt-4 w-full shadow-md">
                      Book Appointment
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hospital.services && hospital.services.length > 0 ? (
                hospital.services.map((service: any, i: number) => {
                  const IconComponent = getServiceIcon(service.title);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition hover:shadow-md"
                    >
                      <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <IconComponent className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{service.title || 'Service'}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{service.description || 'Comprehensive healthcare service'}</p>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-10 text-center text-muted-foreground">
                  No services available.
                </div>
              )}
            </motion.div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-2xl space-y-4">
              {reviews.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HospitalDetails;

import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, Mail, Building2, ArrowLeft, Clock, Shield, Heart, Syringe, Ambulance, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllHospitals } from '@/lib/hospitalStore';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { BranchCard } from '@/components/BranchCard';
import GoogleMapView from '@/components/GoogleMapView';
 
// Service icon helper function
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
  const navigate = useNavigate();
  const hospitalId = searchParams.get('id');
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews'>('overview');
  
  // Review state
  const { toast } = useToast();
  const [reviewsData, setReviewsData] = useState<{ reviews: any[], averageRating: number, totalReviews: number }>({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // New states for doctors, branches
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchReviews = async () => {
    if (!hospitalId) return;
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/reviews/${hospitalId}`);
      if (res.ok) {
        const data = await res.json();
        setReviewsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!hospitalId) { setLoading(false); return; }

      try {
        const remote = await api.getHospitalById(hospitalId);
        if (remote) {
          setHospital(remote);
          fetchReviews();
          
          // Fetch Doctors & Branches
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
          Promise.all([
            fetch(`${API_BASE}/api/doctors/${hospitalId}`).then(res => res.json()).then(setDoctors).catch(() => {}),
            fetch(`${API_BASE}/api/branches/${hospitalId}`).then(res => res.json()).then(setBranches).catch(() => {})
          ]);

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
        if (found) {
          setHospital({
            ...found,
            _id: found.id,
            name: found.name,
            location: found.location,
            hospitalName: found.name,
            city: found.location
          });
        } else {
          setHospital(null);
        }
      } catch (err) {
        console.error('Local store access failed', err);
        setHospital(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [hospitalId]);

  useEffect(() => {
    const shouldStartEmergency = searchParams.get('startEmergency') === '1';
    if (!shouldStartEmergency) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!hospital?._id) return;

    const branchId = searchParams.get('branchId');
    const branchName = searchParams.get('branchName');

    let bookUrl = `/book?id=${hospital._id}&name=${encodeURIComponent(hospital.name || '')}&location=${encodeURIComponent(hospital.location || '')}&emergency=1`;
    
    if (branchId) {
      bookUrl += `&branchId=${branchId}&branchName=${encodeURIComponent(branchName || '')}`;
    }

    const returnTo = `/hospital-details?id=${hospital._id}&emergencyBooked=1`;
    bookUrl += `&returnTo=${encodeURIComponent(returnTo)}`;
    
    navigate(bookUrl, { replace: true });
  }, [hospital, navigate, searchParams]);

  useEffect(() => {
    const booked = searchParams.get('emergencyBooked') === '1';
    if (!booked) return;
    toast({ title: 'Booking completed', description: 'Ab Emergency Call dabake number dial kar sakte ho.' });
    navigate(`/hospital-details?id=${hospitalId}`, { replace: true });
  }, [hospitalId, navigate, searchParams, toast]);

  const handleEmergencyClick = (branchId?: string, branchName?: string) => {
    if (!hospital?._id) return;
    const token = localStorage.getItem('token');
    
    let backToDetails = `/hospital-details?id=${hospital._id}&startEmergency=1`;
    if (branchId) {
      backToDetails += `&branchId=${branchId}&branchName=${encodeURIComponent(branchName || '')}`;
    }

    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(backToDetails)}`);
      return;
    }
    navigate(backToDetails);
  };

  const handleEmergencyCall = () => {
    const num = hospital?.emergencyContactNumber || hospital?.phone;
    if (!num) return;
    window.location.href = `tel:${num}`;
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "Login Required", description: "Please login to leave a review.", variant: "destructive" });
      return;
    }

    setSubmittingReview(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const res = await fetch(`${API_BASE}/api/reviews/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospitalId,
          rating: newReview.rating,
          comment: newReview.comment,
          patientName: user.name
        })
      });

      if (res.ok) {
        toast({ title: "Review Added", description: "Thank you for your feedback!" });
        setNewReview({ rating: 5, comment: '' });
        fetchReviews(); // Refresh reviews instantly
      } else {
        const err = await res.json();
        toast({ title: "Failed to add review", description: err.msg || "Make sure you have a completed appointment.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

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

  const rating = reviewsData.averageRating || hospital.rating || 0;
  const totalReviews = reviewsData.totalReviews || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Banner */}
        <div className="relative min-h-[300px] md:h-80 lg:h-96 overflow-hidden flex flex-col justify-end">
          <img
            src={hospital.image || '/assets/hospital-1.jpg'}
            alt={hospital.name || 'Hospital'}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

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
            className="relative z-10 p-4 sm:p-6 md:p-10"
          >
            <div className="container mx-auto flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-2 inline-block rounded-full bg-primary/90 px-3 py-1 text-[10px] sm:text-xs font-semibold text-primary-foreground uppercase tracking-wider">
                  {hospital.specialty || 'General'}
                </div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">{hospital.name || 'Hospital'}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          i < fullStars
                            ? 'fill-amber-400 text-amber-400'
                            : i === fullStars && hasHalf
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-white">{rating}</span>
                  <span className="text-xs sm:text-sm text-white/70">({totalReviews} reviews)</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm text-white/80">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {hospital.location || 'Unknown'}
                </div>
              </div>
              <div className="shrink-0">
                <Link to={`/book?id=${hospital._id}&name=${encodeURIComponent(hospital.name || '')}&location=${encodeURIComponent(hospital.location || '')}`}>
                  <Button variant="cta" size="lg" className="w-full sm:w-auto shadow-xl h-12 sm:h-14 px-8 text-base sm:text-lg font-bold">
                    Book Visit Now
                  </Button>
                </Link>
              </div>
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

        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
              {/* Left Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* Gallery Slider */}
                {hospital.gallery && hospital.gallery.length > 0 && (
                  <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
                    <Swiper
                      modules={[Autoplay, Pagination]}
                      pagination={{ clickable: true }}
                      autoplay={hospital.gallery.length >= 2 ? { delay: 2000, disableOnInteraction: false } : false}
                      loop={hospital.gallery.length >= 2}
                      className="h-48 sm:h-64"
                    >
                      {hospital.gallery.slice(0, 8).map((img: string, i: number) => (
                        <SwiperSlide key={i}>
                          <img src={img} alt="Gallery" className="h-48 sm:h-64 w-full object-cover" />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}

                {/* About */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground">About {hospital.name}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {hospital.description || `${hospital.name} is a premier healthcare facility specializing in ${hospital.specialty || 'healthcare'}. Located in ${hospital.location}, we are committed to providing world-class medical care.`}
                  </p>
                </div>

                {/* Live Map */}
                {(() => {
                  const hasGeo = hospital.geoLocation && hospital.geoLocation.lat && hospital.geoLocation.lng;
                  const addressStr = hospital.fullAddress 
                    ? `${hospital.fullAddress.address}, ${hospital.fullAddress.city}, ${hospital.fullAddress.state} - ${hospital.fullAddress.pincode}`
                    : (hospital.address || hospital.location);
                  
                  if (!hasGeo && !addressStr) return null;
                  
                  const mapQuery = hasGeo 
                    ? `${hospital.geoLocation.lat},${hospital.geoLocation.lng}`
                    : encodeURIComponent(addressStr);
                  
                  const dirQuery = hasGeo
                    ? `destination=${hospital.geoLocation.lat},${hospital.geoLocation.lng}`
                    : `destination=${encodeURIComponent(addressStr)}`;

                  return (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" /> Live Map
                        </h2>
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&${dirQuery}`)}>
                          Get Directions
                        </Button>
                      </div>
                      <div className="h-64 rounded-xl overflow-hidden bg-muted">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }} 
                          loading="lazy" 
                          allowFullScreen 
                          src={`https://www.google.com/maps?q=${mapQuery}&hl=en;z=14&output=embed`}
                        ></iframe>
                      </div>
                    </div>
                  );
                })()}

                {/* Branches Section */}
                {branches && branches.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
                      <Building2 className="h-6 w-6 text-primary" /> Our Branches
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                      {branches.slice(0, 10).map((branch: any) => (
                        <BranchCard 
                          key={branch._id} 
                          branch={branch} 
                          hospital={hospital} 
                          onEmergencyClick={handleEmergencyClick} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctors Section */}
                {doctors && doctors.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                      <Activity className="h-5 w-5 text-primary" /> Doctors
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {doctors.map((doc: any) => {
                        return (
                        <div key={doc._id} className="p-4 border rounded-xl flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl overflow-hidden">
                            {doc.image ? <img src={doc.image.startsWith('http') ? doc.image : `${import.meta.env.VITE_API_BASE}/${doc.image}`} alt={doc.name} className="h-full w-full object-cover" /> : doc.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">Dr. {doc.name}</h3>
                            <p className="text-sm text-muted-foreground">{doc.specialization} • {doc.experience} yrs exp</p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Emergency Button */}
                {hospital.emergencyContactNumber && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
                    <h3 className="text-lg font-bold text-red-600 flex items-center justify-center gap-2">
                      <Ambulance className="h-5 w-5" /> 🚑 Emergency Call
                    </h3>
                    <p className="mt-2 text-sm text-red-600/80">
                      Pehle emergency booking form fill karein, phir call karein.
                    </p>
                    <div className="mt-4 space-y-2">
                      <Button onClick={() => handleEmergencyClick()} className="w-full bg-red-600 hover:bg-red-700 shadow-md">
                        Emergency Booking
                      </Button>
                      <Button onClick={handleEmergencyCall} variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-100">
                        Call Now ({hospital.emergencyContactNumber})
                      </Button>
                    </div>
                  </div>
                )}

                {/* Contact Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-foreground">Contact & Billing</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between shadow-sm animate-pulse-slow">
                       <div className="flex items-center gap-3">
                          <Activity className="h-6 w-6 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">OPD Charge</span>
                       </div>
                       <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">₹{hospital.opdCharge || 0}</span>
                    </div>

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm font-medium text-foreground">
                          {hospital.fullAddress
                            ? `${hospital.fullAddress.address}, ${hospital.fullAddress.city}, ${hospital.fullAddress.state} - ${hospital.fullAddress.pincode}`
                            : (hospital.location || 'Not Available')}
                        </p>
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

                {/* Working Hours */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <Clock className="h-5 w-5 text-primary" /> Working Hours
                  </h2>
                  <div className="space-y-2">
                    {Array.isArray(hospital.workingDays) ? (
                      hospital.workingDays.map((day: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 border border-border/50">
                          <span className="text-sm font-medium text-foreground">{day}</span>
                          <span className="text-sm text-muted-foreground">
                            {hospital.openingTime && hospital.closingTime 
                              ? `${hospital.openingTime} - ${hospital.closingTime}` 
                              : (hospital.hours || '08:00 AM - 09:00 PM')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                        <span className="text-sm font-medium text-foreground">
                          {hospital.workingDays || 'Monday - Friday'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {hospital.openingTime && hospital.closingTime 
                            ? `${hospital.openingTime} - ${hospital.closingTime}` 
                            : (hospital.hours || '08:00 AM - 09:00 PM')}
                        </span>
                      </div>
                    )}
                    {hospital.appointmentSlots?.startTime && hospital.appointmentSlots?.endTime && (
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                        <span className="text-sm font-medium text-foreground">Appointment Slots</span>
                        <span className="text-sm text-muted-foreground">
                          {hospital.appointmentSlots.startTime} - {hospital.appointmentSlots.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Map Location Card */}
                {(hospital.latitude || hospital.location?.lat) && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                      <MapPin className="h-5 w-5 text-primary" /> Location on Map
                    </h2>
                    <GoogleMapView 
                      lat={hospital.latitude || hospital.location?.lat} 
                      lng={hospital.longitude || hospital.location?.lng} 
                    />
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live Verified Location
                    </div>
                  </div>
                )}

                {/* Book CTA Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center shadow-sm">
                  <h3 className="text-lg font-bold text-foreground">Ready to Visit?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Book your appointment now and get expert care from our specialists.
                  </p>
                  <Link to={`/book?id=${hospital._id}&name=${encodeURIComponent(hospital.hospitalName || hospital.name || '')}&location=${encodeURIComponent(hospital.fullAddress?.address || hospital.city || hospital.location || '')}`}>
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
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsData.reviews.length > 0 ? (
                  reviewsData.reviews.map((r, i) => (
                    <motion.div
                      key={r._id || i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 uppercase">
                            {(r.patientName || 'A').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{r.patientName || 'Anonymous'}</p>
                              {r.appointmentId && r.appointmentId.status === 'Completed' && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] uppercase tracking-wider px-1.5 py-0">
                                  ✔ Verified Patient
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      {r.reviewText && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-700">{r.reviewText}</p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HospitalDetails;

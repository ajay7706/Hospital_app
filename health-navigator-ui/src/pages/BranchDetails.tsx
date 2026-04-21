import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Mail, Building2, ArrowLeft, Clock, Shield, Heart, Syringe, Ambulance, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import GoogleMapView from '@/components/GoogleMapView';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const getServiceIcon = (title: string = "") => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('emergency')) return Ambulance;
  if (lowerTitle.includes('cardiology')) return Heart;
  if (lowerTitle.includes('dental')) return Activity;
  if (lowerTitle.includes('icu')) return Syringe;
  return Shield;
};

const BranchDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const branchId = searchParams.get('id');
  const [branch, setBranch] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews'>('overview');
  
  const { toast } = useToast();
  const [reviewsData, setReviewsData] = useState<{ reviews: any[], averageRating: number, totalReviews: number }>({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchReviews = async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${branchId}`);
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
      if (!branchId) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_BASE}/api/branches/details/${branchId}`);
        if (res.ok) {
          const data = await res.json();
          setBranch(data);
          setHospital(data.hospitalId);
          fetchReviews();
          
          fetch(`${API_BASE}/api/doctors/branch/${branchId}`)
            .then(res => res.json())
            .then(setDoctors)
            .catch(() => {});
        }
      } catch (err) {
        console.error('Fetch branch settings failed', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [branchId]);

  const handleEmergencyClick = () => {
    if (!branch || !hospital) return;
    const token = localStorage.getItem('token');
    
    let backToDetails = `/branch-details?id=${branchId}&startEmergency=1`;
    const bookUrl = `/book?id=${hospital._id}&branchId=${branch._id}&branchName=${encodeURIComponent(branch.branchName)}&branchAddress=${encodeURIComponent(branch.address)}&hospitalName=${encodeURIComponent(hospital.name || '')}&emergency=1&returnTo=${encodeURIComponent(`/branch-details?id=${branchId}&emergencyBooked=1`)}`;

    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(backToDetails)}`);
      return;
    }
    navigate(bookUrl);
  };

  const handleEmergencyCall = () => {
    if (!branch || !hospital) return;
    const bookUrl = `/book?id=${hospital._id}&branchId=${branch._id}&branchName=${encodeURIComponent(branch.branchName)}&branchAddress=${encodeURIComponent(branch.address)}&hospitalName=${encodeURIComponent(hospital.name || '')}&autoCall=1&branchPhone=${branch.emergencyContactNumber || branch.phone || hospital.phone}&returnTo=${encodeURIComponent(`/branch-details?id=${branchId}`)}`;
    navigate(bookUrl);
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${API_BASE}/api/reviews/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          hospitalId: branchId, // Using branchId as the target for reviews if they are per-branch
          rating: newReview.rating,
          comment: newReview.comment,
          patientName: user.name
        })
      });

      if (res.ok) {
        toast({ title: "Review Added", description: "Thank you for your feedback!" });
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
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
        <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading branch details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-background text-center py-20">
        <Navbar />
        <Building2 className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Branch not found</h1>
        <Footer />
      </div>
    );
  }

  const rating = reviewsData.averageRating || 0;
  const totalReviews = reviewsData.totalReviews || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <div className="relative min-h-[380px] md:min-h-0 md:h-80 lg:h-96 overflow-hidden flex flex-col justify-end">
          <img src={branch.image || '/assets/hospital-1.jpg'} alt={branch.branchName} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 md:via-transparent to-transparent" />
          <Link to="/hospitals" className="absolute left-4 top-4 md:left-6 md:top-6 z-20 flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/30 transition">
             <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 p-6 md:p-10 container mx-auto flex flex-col md:flex-row md:items-end md:justify-between text-white mt-16 md:mt-0">
            <div>
              <div className="mb-2 inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider">{branch.specialties || 'General Clinic'}</div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-5xl font-bold">{branch.branchName}</h1>
                {branch.emergency24x7 && (
                  <Badge className="bg-red-600 text-white border-none animate-pulse px-3 py-1 text-[10px] font-bold">24/7 EMERGENCY</Badge>
                )}
              </div>
              <p className="text-white/60 text-sm mt-1">A unit of {hospital?.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`h-5 w-5 ${i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-white/40'}`} />)}
                </div>
                <span className="font-bold">{rating}</span>
                <span className="text-white/70 text-sm">({totalReviews} reviews)</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" /> {branch.address}, {branch.city}</div>
            </div>
            <div className="mt-6 md:mt-0">
               <Link to={`/book?id=${hospital._id}&branchId=${branch._id}&branchName=${encodeURIComponent(branch.branchName)}&branchAddress=${encodeURIComponent(branch.address)}&hospitalName=${encodeURIComponent(hospital.hospitalName || '')}`}>
                <Button variant="cta" size="lg" className="h-14 px-8 text-lg font-bold shadow-xl w-full md:w-auto">Book Visit Now</Button>
               </Link>
            </div>
          </motion.div>
        </div>

        <div className="border-b bg-card">
          <div className="container mx-auto flex px-4">
            {['overview', 'services', 'reviews'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`relative px-6 py-4 text-sm font-medium capitalize ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab}
                {activeTab === tab && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {branch.gallery && branch.gallery.length > 0 && (
                  <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
                    <Swiper modules={[Autoplay, Pagination]} pagination={{ clickable: true }} autoplay={{ delay: 3000 }} className="h-64 sm:h-80">
                      {branch.gallery.slice(0, 5).map((img: string, i: number) => (
                        <SwiperSlide key={i}><img src={img} className="h-full w-full object-cover" alt="Gallery" /></SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <h2 className="text-xl font-bold">About {branch.branchName}</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{branch.about || `${branch.branchName} is a state-of-the-art facility in ${branch.city} providing exceptional care.`}</p>
                </div>

                {/* Map Location Card - Moved here */}
                {(branch.latitude || (branch.location && typeof branch.location !== 'string' && branch.location.lat)) && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> Location on Map
                    </h3>
                    <GoogleMapView 
                      lat={branch.latitude || branch.location.lat} 
                      lng={branch.longitude || branch.location.lng} 
                    />
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live Verified Location
                    </div>
                  </div>
                )}
                {doctors.length > 0 && (
                  <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Our Doctors</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                       {doctors.map((doc: any) => (
                         <div key={doc._id} className="p-4 border rounded-xl flex items-center gap-4">
                           <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                             {doc.image ? <img src={doc.image.startsWith('http') ? doc.image : `${API_BASE}/${doc.image}`} className="h-full w-full object-cover" /> : doc.name.charAt(0)}
                           </div>
                           <div>
                             <h3 className="font-semibold">Dr. {doc.name}</h3>
                             <p className="text-xs text-muted-foreground">{doc.specialization} • {doc.experience} yrs exp</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 shadow-sm text-center">
                   <h3 className="text-lg font-bold text-red-600 flex items-center justify-center gap-2"><Ambulance className="h-5 w-5" /> Emergency Services</h3>
                     <div className="mt-4 space-y-2">
                     <Button onClick={handleEmergencyClick} className="w-full bg-red-600 hover:bg-red-700">Emergency Booking</Button>
                     <Button onClick={handleEmergencyCall} variant="outline" className="w-full border-red-200 text-red-600 font-bold">Call Now ({branch.emergencyContactNumber || branch.phone})</Button>
                   </div>
                </div>
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold">Contact Info</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-emerald-700"><Activity className="h-5 w-5" /><span className="text-xs font-bold">OPD CHARGE</span></div>
                       <span className="text-xl font-bold text-emerald-700">₹{branch.opdCharge || hospital?.opdCharge || 0}</span>
                    </div>
                    <div className="flex gap-3 text-sm"><MapPin className="h-5 w-5 text-primary" /> <div><p className="font-semibold">Address</p><p className="text-muted-foreground">{branch.address}, {branch.city}</p></div></div>
                    <div className="flex gap-3 text-sm"><Phone className="h-5 w-5 text-primary" /> <div><p className="font-semibold">Phone</p><p className="text-muted-foreground">{branch.phone}</p></div></div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Working Day & Hour
                  </h3>
                  <div className="space-y-4">
                    {branch.emergency24x7 && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-bold text-center shadow-inner">
                        <Ambulance className="h-6 w-6 mx-auto mb-2 animate-bounce" />
                        24/7 Emergency Open
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Working Days & Time</h4>
                      <div className="space-y-2">
                        {(branch.workingDays || []).map((day: string, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 border border-border/50">
                            <span className="text-sm font-medium text-foreground">{day}</span>
                            <span className="text-sm text-muted-foreground">
                              {branch.startTime && branch.endTime 
                                ? `${branch.startTime} - ${branch.endTime}` 
                                : `${branch.openingTime || '09:00'} - ${branch.closingTime || '18:00'}`}
                            </span>
                          </div>
                        ))}
                        {(branch.workingDays || []).length === 0 && (
                          <p className="text-xs text-muted-foreground italic text-center py-4">Contact for working hours</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1 mb-3">Appointment Slots</h4>
                      <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                             <Clock className="h-4 w-4" />
                           </div>
                           <span className="text-sm font-bold text-foreground">Slot Duration</span>
                        </div>
                        <span className="text-sm font-black text-primary">
                          {branch.slotTime || "15 min"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'services' && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
               {(branch.services && branch.services.length > 0) ? (
                 branch.services.map((service: any, i: number) => {
                   const Icon = getServiceIcon(service.title);
                   return (
                     <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition hover:shadow-md">
                       <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                         <Icon className="h-7 w-7 text-primary" />
                       </div>
                       <h3 className="font-semibold text-foreground">{service.title || 'Service'}</h3>
                       <p className="mt-1 text-sm text-muted-foreground">{service.description || 'Comprehensive healthcare service'}</p>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-20 text-muted-foreground col-span-full">No services listed yet for this branch.</div>
               )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-4">
                {reviewsData.reviews.length > 0 ? (
                  reviewsData.reviews.map((r, i) => (
                    <div key={i} className="p-5 border rounded-2xl bg-card">
                      <div className="flex justify-between">
                        <div className="flex gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">{(r.patientName || 'A')[0]}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{r.patientName}</p>
                              {r.appointmentId && r.appointmentId.status === 'Completed' && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] uppercase tracking-wider px-1.5 py-0">
                                  ✔ Verified Patient
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex">{[...Array(r.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                      </div>
                      {r.reviewText && (
                        <p className="mt-3 text-sm text-slate-700">{r.reviewText}</p>
                      )}
                    </div>
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

export default BranchDetails;

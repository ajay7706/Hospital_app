import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, Users, Clock, AlertCircle, 
  ChevronRight, RefreshCcw, CheckCircle2,
  BrainCircuit, Activity, Heart, Shield, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function TrackAppointment() {
  const { toast } = useToast();
  const [tokenNo, setTokenNo] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleTrack = async () => {
    if (!phone && !tokenNo) {
      toast({ title: 'Please enter Token or Phone', variant: 'destructive' });
      return;
    }
    
    const searchToken = tokenNo.trim();
    const searchPhone = phone.trim();
    
    let queryParams = '';
    if (searchToken && searchPhone) {
      queryParams = `tokenNumber=${searchToken}&phone=${searchPhone}`;
    } else if (searchPhone) {
      queryParams = `phone=${searchPhone}`;
    } else {
      // If only token is provided, we can try token query but backend might need ID
      queryParams = `token=${searchToken}`;
    }

    setLoading(true);
    setAppointment(null);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/track?${queryParams}`);
      const data = await res.json();
      if (res.ok) {
        setAppointment(data.appointment);
        setTrackingData(data);
      } else {
        toast({ 
          title: 'Not Found', 
          description: data.message || 'No appointment found. Please check your details.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ 
        title: 'Request failed', 
        description: 'No appointment found. Please check your number or Token.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh logic (every 30s) if appointment found
  useEffect(() => {
    if (!appointment) return;
    const interval = setInterval(handleTrack, 30000);
    return () => clearInterval(interval);
  }, [appointment?.tokenNumber]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary/5 py-20 px-4">
           {/* Abstract shapes */}
           <div className="absolute -top-24 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
           <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />

           <div className="container mx-auto max-w-3xl relative z-10 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                 <Badge variant="outline" className="mb-4 bg-background px-4 py-1 text-primary border-primary/20 shadow-sm">
                   Live Tracking System
                 </Badge>
                 <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                   Track Your <span className="text-primary">Status</span>
                 </h1>
                 <p className="text-muted-foreground text-lg mb-10 font-medium">
                   Apna phone number aur token number dalein status check karne ke liye.
                 </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="p-4 bg-card border border-border rounded-[2rem] shadow-xl shadow-primary/5">
                 <div className="grid md:grid-cols-2 gap-4">
                   <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Token Number (e.g. 5)" 
                        className="h-14 pl-12 pr-4 rounded-2xl border-border bg-muted/30 text-lg font-bold"
                        value={tokenNo}
                        onChange={(e) => setTokenNo(e.target.value)}
                      />
                   </div>
                   <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Phone Number" 
                        className="h-14 pl-12 pr-4 rounded-2xl border-border bg-muted/30 text-lg font-bold"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                      />
                   </div>
                 </div>
                 <Button onClick={handleTrack} className="w-full mt-4 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Track Status Now'}
                 </Button>
              </motion.div>
           </div>
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 py-20">
           <AnimatePresence mode="wait">
             {!appointment ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card p-8 rounded-[2rem] border border-border shadow-sm text-center"
            >
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <BrainCircuit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Status</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your queue position and live status in real-time from anywhere.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card p-8 rounded-[2rem] border border-border shadow-sm text-center"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Live Token</h3>
              <p className="text-muted-foreground leading-relaxed">
                View the current token number being served at the hospital branch.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card p-8 rounded-[2rem] border border-border shadow-sm text-center"
            >
              <div className="mx-auto w-16 h-16 bg-cta/10 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-cta" />
              </div>
              <h3 className="text-xl font-bold mb-3">Save Time</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wait comfortably from your home and avoid long hospital queues.
              </p>
            </motion.div>
          </div>
             ) : (
                <motion.div 
                   key="result"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="max-w-4xl mx-auto space-y-8"
                >
                   {/* Main Live Card */}
                   <div className="bg-primary/90 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                      <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-white/20 pb-12">
                         <div>
                            <p className="text-primary-foreground/70 uppercase tracking-widest text-xs font-black mb-2 flex items-center gap-2">
                               <Shield className="h-3 w-3" /> Booking Reference: #{appointment._id.slice(-6).toUpperCase()}
                            </p>
                            <h2 className="text-4xl font-black mb-1">Hello, {appointment.patientName}!</h2>
                            <p className="text-primary-foreground font-medium text-lg leading-relaxed max-w-xs md:max-w-none">
                               Patient Tracking for {appointment.hospitalId?.hospitalName} 
                               {appointment.branchId && <span className="opacity-70 ml-1 italic font-bold">({appointment.branchId.branchName})</span>}
                            </p>
                         </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center border border-white/20 min-w-[150px]">
                            <p className="text-[10px] uppercase font-black tracking-widest text-white mb-1">Your Token</p>
                            <p className="text-5xl font-black">#{appointment.tokenNumber}</p>
                         </div>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Current Status</p>
                            <p className="text-xl font-black flex items-center gap-2">
                               {appointment.status === 'Completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
                               {appointment.status === 'Completed' ? 'Appointment Completed' : appointment.status}
                            </p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Now Serving</p>
                            <p className="text-4xl font-black text-white glow-text">#{trackingData?.nowServing || 0}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">People Ahead</p>
                            <p className="text-4xl font-black text-amber-300">
                               {trackingData?.peopleAhead > 0 ? trackingData.peopleAhead : 'YOUR TURN!'}
                            </p>
                         </div>
                         <div className="flex items-end">
                            <Button onClick={handleTrack} className="w-full bg-white text-primary hover:bg-white/90 h-12 rounded-2xl font-bold gap-2">
                               <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
                            </Button>
                         </div>
                      </div>
                   </div>

                   {/* Secondary Info */}
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                         <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" /> Appointment Details
                         </h3>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                               <span className="text-muted-foreground font-medium">Hospital / Branch</span>
                               <span className="font-bold text-right text-sm">{appointment.hospitalName} <br/><span className="text-xs text-muted-foreground">({appointment.branchName})</span></span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                               <span className="text-muted-foreground font-medium">Assigned Doctor</span>
                               <span className="font-bold">{appointment.doctorName}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                               <span className="text-muted-foreground font-medium">Scheduled For</span>
                               <span className="font-bold text-right text-sm">{appointment.appointmentDate} <br/><span className="text-xs text-muted-foreground">{appointment.time}</span></span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                               <span className="text-muted-foreground font-medium">OPD Fee</span>
                               <span className="font-black text-lg text-emerald-600">₹{appointment.opdFee || 0}</span>
                            </div>
                         </div>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                         <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                            <RefreshCcw className="h-8 w-8 animate-spin-slow" />
                         </div>
                         <h4 className="text-xl font-bold text-emerald-900 mb-2">Live Sync Active</h4>
                         <p className="text-emerald-700/70 text-sm max-w-[200px]">
                            Yeh page har 30 seconds me automatically update hota hai.
                         </p>
                         <Button variant="link" className="text-emerald-600 font-bold mt-4 animate-bounce" onClick={handleTrack}>
                            Force Refresh Now <ChevronRight className="h-4 w-4 ml-1" />
                         </Button>
                      </div>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </section>
      </main>
      <Footer />
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <RefreshCcw className={`animate-spin ${className}`} />
);

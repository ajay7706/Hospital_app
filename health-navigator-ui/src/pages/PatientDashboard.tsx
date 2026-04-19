import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Users, Clock, Activity, Calendar, 
  MapPin, CheckCircle2, History, Loader2,
  RefreshCcw, AlertTriangle, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Confirmed':          return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Waiting':            return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Completed':          return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'Rescheduled':        return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'In Consultation':    return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Not Selected':       return 'bg-red-100 text-red-700 border-red-200';
    default:                   return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function PatientDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userStr));
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/patient`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const apts = Array.isArray(data.appointments) ? data.appointments : (Array.isArray(data) ? data : []);
        setAppointments(apts);
      }
    } catch (err) {
      toast({ title: 'Failed to load appointments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const activeApts = appointments.filter(a => !['Completed', 'Not Selected', 'cancelled'].includes(a.status));
  const previousApts = appointments.filter(a => ['Completed', 'Not Selected', 'cancelled'].includes(a.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Welcome, <span className="text-primary">{user?.name}</span>
            </h1>
            <p className="text-muted-foreground mt-2">Manage your appointments and track live status.</p>
          </motion.div>
          <Button onClick={fetchAppointments} variant="outline" className="rounded-2xl gap-2 font-bold bg-white">
            <RefreshCcw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Active Appointments */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold">Active Bookings</h2>
            </div>

            {activeApts.length > 0 ? (
              <div className="grid gap-6">
                {activeApts.map((apt) => (
                  <motion.div 
                    key={apt._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 px-10 py-2 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-bl-3xl">
                      Ref: #{apt._id.slice(-6)}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Activity className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black">{apt.hospitalName}</h3>
                            <p className="text-muted-foreground text-sm flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {apt.location || 'Address not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Date & Time</p>
                            <p className="font-bold text-sm">{apt.date}</p>
                            <p className="text-[10px] text-muted-foreground">{apt.time}</p>
                          </div>
                          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Token Number</p>
                            <p className="text-3xl font-black text-primary">#{apt.tokenNumber}</p>
                          </div>
                          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                            <Badge variant="outline" className={getStatusColor(apt.status)}>
                              {apt.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <Button 
                             onClick={() => navigate(`/track-appointment?query=${apt._id}`)}
                             className="rounded-2xl h-11 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                           >
                             Track Live Status <ArrowRight className="h-4 w-4" />
                           </Button>
                           <p className="text-xs text-muted-foreground">
                             Expected Fee: <span className="font-bold text-foreground">₹{apt.opdCharge}</span>
                           </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/50 border-2 border-dashed border-border rounded-[3rem]">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground">No active appointments</h3>
                <p className="text-sm text-muted-foreground/60 mt-2">Book your next visit from the hospitals page.</p>
                <Button variant="link" onClick={() => navigate('/hospitals')} className="mt-4 font-bold text-primary">Browse Hospitals</Button>
              </div>
            )}
          </div>

          {/* Sidebar - History & Info */}
          <div className="space-y-8">
            <div className="bg-white border border-border rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                <History className="h-6 w-6 text-primary" /> Past Visits
              </h2>
              <div className="space-y-4">
                {previousApts.length > 0 ? (
                  previousApts.slice(0, 5).map(apt => (
                    <div key={apt._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm truncate max-w-[120px]">{apt.hospitalName}</p>
                        <p className="text-[10px] text-muted-foreground">{apt.date}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-5">{apt.status}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-10">No history found.</p>
                )}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden">
               <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <h4 className="font-bold text-lg mb-2">Need Help?</h4>
               <p className="text-sm text-slate-600 leading-relaxed mb-6">
                 If you are experiencing a medical emergency, please call your local emergency services immediately.
               </p>
               <Button variant="outline" className="w-full rounded-2xl font-bold bg-white" onClick={() => navigate('/support')}>
                 Contact Support
               </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

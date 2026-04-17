import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Clock, CheckCircle2, 
  Activity, ArrowRight, LogOut, Search,
  Loader2, ClipboardList, FlaskConical, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Consultation': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Lab Pending':    return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Completed':      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Confirmed':      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    default:               return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export default function DoctorDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'doctor') {
      navigate('/');
      return;
    }
    setDoctorInfo(user);
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors/appointments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/update/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Appointment marked as ${status}` });
        setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: data.appointment.status } : a));
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.msg, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredApts = appointments.filter(a => filter === 'all' || a.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-background to-emerald-50/50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-card/70 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Activity className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
                  Doctor Control Panel
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Life Navigator HMS</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right">
                <p className="text-sm font-bold">Dr. {doctorInfo?.name}</p>
                <p className="text-[10px] text-muted-foreground">{doctorInfo?.email}</p>
             </div>
             <Button variant="ghost" size="icon" onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-5 w-5" />
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h2 className="text-3xl font-black text-foreground">Welcome back, Doctor</h2>
              <p className="text-muted-foreground">Aapke pas aaj {appointments.filter(a => a.status !== 'Completed').length} active consultations hain.</p>
           </div>
           <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}>All</button>
              <button onClick={() => setFilter('In Consultation')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'In Consultation' ? 'bg-blue-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}>Active</button>
              <button onClick={() => setFilter('Completed')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'Completed' ? 'bg-emerald-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}>Done</button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                 <Users className="h-7 w-7" />
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Patients</p>
                 <p className="text-3xl font-black">{appointments.length}</p>
              </div>
           </div>
           <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                 <Clock className="h-7 w-7" />
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                 <p className="text-3xl font-black">{appointments.filter(a => a.status === 'Confirmed').length}</p>
              </div>
           </div>
           <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                 <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
                 <p className="text-3xl font-black">{appointments.filter(a => a.status === 'Completed').length}</p>
              </div>
           </div>
        </div>

        {/* Appointments List */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           <div className="xl:col-span-2 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                 <ClipboardList className="h-5 w-5 text-primary" /> Today's Queue
              </h3>
              
              <AnimatePresence mode="popLayout">
                {filteredApts.map((apt) => (
                   <motion.div 
                     key={apt._id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                   >
                     {/* Floating Token Number */}
                     <div className="absolute top-0 right-0 px-8 py-1 bg-primary/20 text-primary font-black text-xs uppercase tracking-widest rounded-bl-3xl">
                        Token #{apt.tokenNumber}
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                           <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-2xl font-black border border-border group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors duration-500">
                              {apt.patientName.charAt(0)}
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <h4 className="text-xl font-bold">{apt.patientName}</h4>
                                 <Badge variant="outline" className={getStatusColor(apt.status)}>
                                    {apt.status}
                                 </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 underline decoration-primary/20">{apt.phone}</p>
                              {apt.problem && (
                                <p className="text-xs text-primary font-medium mt-2 bg-primary/5 p-2 rounded-lg border border-primary/10">
                                  <span className="font-bold uppercase tracking-tighter mr-1 opacity-70">Problem:</span> {apt.problem}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3">
                                 <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium text-muted-foreground">Age: {apt.age || '—'}</span>
                                 <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium text-muted-foreground">Gender: {apt.gender || '—'}</span>
                                 {apt.type === 'Emergency' && <Badge className="bg-red-600 text-white animate-pulse">Emergency</Badge>}
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                           {apt.status === 'Confirmed' && (
                              <Button 
                                onClick={() => handleUpdateStatus(apt._id, 'In Consultation')}
                                disabled={updatingStatus === apt._id}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                              >
                                {updatingStatus === apt._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Consultation'}
                              </Button>
                           )}
                           
                           {apt.status === 'In Consultation' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleUpdateStatus(apt._id, 'Lab Pending')}
                                  disabled={updatingStatus === apt._id}
                                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                  <FlaskConical className="mr-2 h-4 w-4" /> Lab Tests
                                </Button>
                                <Button 
                                  onClick={() => handleUpdateStatus(apt._id, 'Completed')}
                                  disabled={updatingStatus === apt._id}
                                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                >
                                  Mark Completed
                                </Button>
                              </>
                           )}

                           {apt.status === 'Lab Pending' && (
                             <Button 
                               onClick={() => handleUpdateStatus(apt._id, 'In Consultation')}
                               disabled={updatingStatus === apt._id}
                               className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                             >
                               Resume Consultation
                             </Button>
                           )}
                        </div>
                     </div>
                   </motion.div>
                ))}
              </AnimatePresence>

              {filteredApts.length === 0 && (
                 <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border mt-6">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">Is category me koi appointments nahi hain.</p>
                 </div>
              )}
           </div>

           {/* Quick Actions Sidebar */}
           <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                 <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Schedule Overview
                 </h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-card border border-border rounded-xl">
                       <span className="text-muted-foreground font-medium">Shift Start:</span>
                       <span className="font-bold">09:00 AM</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-card border border-border rounded-xl">
                       <span className="text-muted-foreground font-medium">Average Time:</span>
                       <span className="font-bold">15-20 Mins</span>
                    </div>
                 </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6">
                 <h4 className="text-lg font-bold mb-4 flex items-center gap-2 underline decoration-primary/20">
                    Consultation Tips
                 </h4>
                 <ul className="space-y-4">
                    <li className="flex gap-3 text-sm">
                       <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 text-[10px] font-bold">1</div>
                       <p className="text-muted-foreground">Ensure to mark <b>Lab Pending</b> if patient needs to leave for tests.</p>
                    </li>
                    <li className="flex gap-3 text-sm">
                       <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 text-[10px] font-bold">2</div>
                       <p className="text-muted-foreground">Always mark <b>Completed</b> to move to the next patient and update token tracker.</p>
                    </li>
                 </ul>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Users, Ambulance, Building2, ArrowRight,
  Activity, AlertOctagon, CheckCircle2, Clock, XCircle, Phone,
  CalendarDays, Loader2, RefreshCw, MapPin, Navigation
} from 'lucide-react';
import GoogleMapPicker from '@/components/GoogleMapPicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Confirmed':      return 'bg-green-100 text-green-700 border-green-200';
    case 'Waiting':        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Rescheduled':    return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Not Selected':
    case 'Not Selected Today': return 'bg-red-100 text-red-700 border-red-200';
    case 'Completed':      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:               return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export default function BranchDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Per-row loading states
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branch, setBranch] = useState<any>(null);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [isLocationSelected, setIsLocationSelected] = useState(true); // Default to true as it's an existing branch

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'branch') { navigate('/login'); return; }
    setUser(userData);
    fetchBranchData();
  }, [navigate]);

  const readError = async (res: Response) => {
    try { const d = await res.json(); return d?.msg || 'Request failed'; }
    catch { return 'Request failed'; }
  };

  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const userDataFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const [aRes, eRes, dRes, bResData] = await Promise.all([
        fetch(`${API_BASE}/api/appointments/hospital`, { headers }),
        fetch(`${API_BASE}/api/otp/emergency`, { headers }),
        fetch(`${API_BASE}/api/doctors/branch/list`, { headers }),
        fetch(`${API_BASE}/api/branches/details/${userDataFromStorage.branchId}`, { headers })
      ]);

      if (aRes.ok) {
        const aData = await aRes.json();
        setAppointments(Array.isArray(aData.appointments) ? aData.appointments : []);
        setStats(aData.stats);
      }
      if (eRes.ok) {
        const eData = await eRes.json();
        setEmergencies(Array.isArray(eData) ? eData : []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDoctors(Array.isArray(dData) ? dData : []);
      }
      if (bResData.ok) {
        const bData = await bResData.json();
        setBranch(bData);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleAppointmentAction = async (id: string, status: string, nextDate?: string, doctorId?: string) => {
    setUpdatingId(id);
    setActionType(status);
    try {
      const token = localStorage.getItem('token');
      const body: any = { status };
      if (nextDate) body.nextDate = nextDate;
      const res = await fetch(`${API_BASE}/api/appointments/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...body, doctorId }),
      });
      if (!res.ok) {
        const msg = await readError(res);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        return;
      }
      const data = await res.json();
      // Update in-place (no page refresh)
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, ...data.appointment } : a));
      // Update stats
      setStats((prev: any) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (status === 'Confirmed') { updated.confirmed = (updated.confirmed || 0) + 1; updated.waiting = Math.max(0, (updated.waiting || 0) - 1); }
        if (status === 'Rescheduled') { updated.rescheduled = (updated.rescheduled || 0) + 1; updated.waiting = Math.max(0, (updated.waiting || 0) - 1); }
        return updated;
      });
      toast({ title: `Appointment ${status}`, description: `Patient notified via email/WhatsApp.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setUpdatingId(null); setActionType(null); }
  };

  const handleEmergencyAction = async (id: string, status: string) => {
    setUpdatingId(id);
    setActionType(status);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/otp/emergency/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast({ title: 'Error', description: await readError(res), variant: 'destructive' }); return; }
      setEmergencies(prev => prev.map(e => e._id === id ? { ...e, status } : e));
      toast({ title: `Emergency ${status}` });
    } catch (err: any) {
       console.error("Emergency action failed:", err);
    } finally { setUpdatingId(null); setActionType(null); }
  };

  const isLoading = (id: string, type: string) => updatingId === id && actionType === type;
  const anyLoading = (id: string) => updatingId === id;

  const SidebarItem = ({ icon: Icon, label, id }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === today);
  const emergencyApts = appointments.filter(a => a.type === 'Emergency');

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-cta/5 text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card/80 backdrop-blur border-r border-border p-6 flex flex-col md:h-screen md:sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Branch Dashboard</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[130px]">{user?.name}</p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <SidebarItem icon={Activity} label="Overview" id="dashboard" />
          <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
          <SidebarItem icon={Ambulance} label="Emergency" id="emergency" />
          <SidebarItem icon={Users} label="Doctors" id="doctors" />
          <SidebarItem icon={Building2} label="Profile & Settings" id="settings" />
        </nav>

        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={fetchBranchData}>
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </Button>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <ArrowRight className="h-5 w-5" /> Exit Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground text-sm">Branch Operations Center</p>
          </div>
          <div className="flex items-center gap-2">
            {emergencyApts.length > 0 && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                <AlertOctagon className="h-3.5 w-3.5" /> {emergencyApts.length} Emergency
              </span>
            )}
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">

            {/* ─── OVERVIEW TAB ─────────────────────────── */}
            {activeTab === 'dashboard' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Today's Patients", value: todayApts.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Waiting Queue', value: stats?.waiting || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Confirmed', value: stats?.confirmed || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Emergency', value: stats?.emergency || 0, icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-2xl border border-border p-5 flex items-center justify-between shadow-sm ${s.bg}`}>
                      <div>
                        <p className="text-muted-foreground text-xs">{s.label}</p>
                        <h3 className="text-3xl font-bold mt-1">{s.value}</h3>
                      </div>
                      <div className={`h-11 w-11 rounded-xl bg-white flex items-center justify-center ${s.color} shadow-sm`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Recent Appointments */}
                  <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Today's Queue</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('appointments')} className="text-primary text-xs">View all</Button>
                    </div>
                    <div className="space-y-3">
                      {todayApts.slice(0, 5).map((apt: any) => (
                        <div key={apt._id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                              {apt.patientName?.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{apt.patientName}</p>
                                {apt.type === 'Emergency' && <AlertOctagon className="h-3.5 w-3.5 text-red-500" />}
                                {apt.ambulanceRequired && <Ambulance className="h-3.5 w-3.5 text-orange-500" />}
                              </div>
                              <p className="text-xs text-muted-foreground">Token #{apt.tokenNumber} • {apt.time}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(apt.status)}>{apt.status}</Badge>
                        </div>
                      ))}
                      {todayApts.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No appointments for today.</p>}
                    </div>
                  </div>

                  {/* Emergency Alerts */}
                  <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-lg mb-4">Emergency Alerts</h3>
                    <div className="space-y-3">
                      {emergencies.filter(e => e.status === 'pending').slice(0, 4).map((em: any) => (
                        <div key={em._id} className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Ambulance className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <span className="font-bold text-red-700 text-sm">{em.phone || 'Emergency'}</span>
                          </div>
                          <Button size="sm" variant="destructive" disabled={anyLoading(em._id)}
                            onClick={() => handleEmergencyAction(em._id, 'accepted')}>
                            {isLoading(em._id, 'accepted') ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                          </Button>
                        </div>
                      ))}
                      {emergencies.filter(e => e.status === 'pending').length === 0 && (
                        <p className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">No active emergencies.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── APPOINTMENTS TAB ──────────────────────── */}
            {activeTab === 'appointments' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Manage Appointments</h3>
                  <Button variant="outline" size="sm" onClick={fetchBranchData} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-3 font-medium">Patient</th>
                        <th className="pb-3 font-medium">Problem</th>
                        <th className="pb-3 font-medium">Date & Time</th>
                        <th className="pb-3 font-medium text-center">Token</th>
                        <th className="pb-3 font-medium">Status / Doctor</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {appointments.map((apt: any) => (
                        <tr key={apt._id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5">
                            <p className="font-semibold">{apt.patientName}</p>
                            <p className="text-xs text-muted-foreground">{apt.phone}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="text-xs max-w-[120px] truncate" title={apt.problem}>{apt.problem || '—'}</p>
                          </td>
                          <td className="py-3.5">
                            <p>{apt.date}</p>
                            <p className="text-xs text-muted-foreground">{apt.time}</p>
                          </td>
                          <td className="py-3.5 font-mono font-bold text-primary text-center">
                            #{apt.tokenNumber || '—'}
                            <div className="flex justify-center mt-1">
                               <Badge variant="secondary" className="text-[9px] h-3 px-1">{apt.type}</Badge>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <Badge variant="outline" className={cn(getStatusColor(apt.status), "mb-1")}>
                              {apt.status}
                            </Badge>
                            {apt.assignedDoctorName && (
                              <p className="text-[10px] text-primary font-bold">Dr. {apt.assignedDoctorName}</p>
                            )}
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Action Buttons for Waiting or Rescheduled */}
                              {(apt.status === "Waiting" || apt.status === "Rescheduled") && (
                                <>
                                  {/* Approve Button */}
                                  <div className="flex flex-col gap-1 items-end">
                                    <select 
                                      id={`doc-select-branch-${apt._id}`}
                                      className="h-7 text-[10px] border rounded bg-background px-1 w-full"
                                      defaultValue=""
                                    >
                                      <option value="">Select Doctor</option>
                                      {doctors.map(d => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
                                      ))}
                                    </select>
                                    <Button size="sm"
                                      disabled={anyLoading(apt._id)}
                                      onClick={() => {
                                        const select = document.getElementById(`doc-select-branch-${apt._id}`) as HTMLSelectElement;
                                        handleAppointmentAction(apt._id, 'Confirmed', undefined, select.value);
                                      }}
                                      className="h-7 w-full text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                                      {isLoading(apt._id, 'Confirmed')
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <><CheckCircle2 className="h-3 w-3 mr-1" />Approve & Assign</>}
                                    </Button>
                                  </div>
                                  
                                  {/* Move to Next Day */}
                                  <Button size="sm" variant="default"
                                    disabled={anyLoading(apt._id) || (stats?.confirmed || 0) < 200}
                                    onClick={() => handleAppointmentAction(apt._id, 'Rescheduled')}
                                    className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {isLoading(apt._id, 'Rescheduled')
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <><CalendarDays className="h-3 w-3 mr-1" />Next Day</>}
                                  </Button>

                                  {/* Reject */}
                                  <Button size="sm" variant="default"
                                    disabled={anyLoading(apt._id)}
                                    onClick={() => handleAppointmentAction(apt._id, 'Not Selected')}
                                    className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {isLoading(apt._id, 'Not Selected')
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <><XCircle className="h-3 w-3 mr-1" />Reject</>}
                                  </Button>
                                </>
                              )}
                              
                              {/* Support Confirmed status actions if needed (like Move to Next Day) */}
                              {apt.status === "Confirmed" && (
                                <Button size="sm" variant="default"
                                  disabled={anyLoading(apt._id) || (stats?.confirmed || 0) < 200}
                                  onClick={() => handleAppointmentAction(apt._id, 'Rescheduled')}
                                  className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                                  {isLoading(apt._id, 'Rescheduled')
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <><CalendarDays className="h-3 w-3 mr-1" />Next Day</>}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {appointments.length === 0 && (
                    <p className="text-center py-12 text-muted-foreground">No appointments found.</p>
                  )}
                </div>
              </div>
            )}

            {/* ─── EMERGENCY TAB ──────────────────────────── */}
            {activeTab === 'emergency' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Emergency Requests</h3>
                {/* Emergency Appointments from main list */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Emergency Bookings</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="pb-3 font-medium">Patient</th>
                          <th className="pb-3 font-medium">Time</th>
                          <th className="pb-3 font-medium">Ambulance</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {emergencyApts.map((apt: any) => (
                          <tr key={apt._id} className="hover:bg-red-50/40 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <AlertOctagon className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold">{apt.patientName}</p>
                                  <p className="text-xs text-muted-foreground">{apt.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">{apt.time}</td>
                            <td className="py-3">
                              {apt.ambulanceRequired
                                ? <span className="flex items-center gap-1 text-orange-600 font-semibold text-xs"><Ambulance className="h-3.5 w-3.5" />Required</span>
                                : <span className="text-xs text-muted-foreground">No</span>}
                            </td>
                            <td className="py-3">
                              <Badge variant="outline" className={getStatusColor(apt.status)}>{apt.status}</Badge>
                            </td>
                            <td className="py-3 text-right">
                              {['Waiting', 'Rescheduled'].includes(apt.status) && (
                                <Button size="sm" disabled={anyLoading(apt._id)}
                                  onClick={() => handleAppointmentAction(apt._id, 'Confirmed')}
                                  className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700">
                                  {isLoading(apt._id, 'Confirmed') ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {emergencyApts.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No emergency appointments.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* OTP Emergency Calls */}
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Emergency Calls (OTP)</h4>
                <div className="space-y-3">
                  {emergencies.map((em: any) => (
                    <div key={em._id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${em.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          <Ambulance className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold">{em.phone || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(em.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={em.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {em.status?.toUpperCase()}
                        </Badge>
                        {em.status === 'pending' && (
                          <Button size="sm" variant="destructive" disabled={anyLoading(em._id)}
                            onClick={() => handleEmergencyAction(em._id, 'accepted')}>
                            {isLoading(em._id, 'accepted') ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {emergencies.length === 0 && <p className="text-center py-8 text-muted-foreground">No emergency call history.</p>}
                </div>
              </div>
            )}

            {/* ─── DOCTORS TAB ──────────────────────────── */}
            {activeTab === 'doctors' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Doctor Management</h3>
                  <Button onClick={() => (document.getElementById('add-doctor-modal') as any).showModal()} className="gap-2">
                     <Users className="h-4 w-4" /> Add Doctor
                  </Button>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                   {doctors.map(doc => (
                     <div key={doc._id} className="p-4 border rounded-2xl bg-card flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                           {doc.image ? <img src={doc.image.startsWith('http') ? doc.image : `${API_BASE}/${doc.image}`} className="h-full w-full object-cover rounded-full" /> : doc.name[0]}
                         </div>
                         <div>
                           <p className="font-bold text-sm">Dr. {doc.name}</p>
                           <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                         </div>
                       </div>
                       <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={async () => {
                         if (confirm("Delete this doctor?")) {
                           const res = await fetch(`${API_BASE}/api/doctors/${doc._id}`, {
                             method: 'DELETE',
                             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                           });
                           if (res.ok) fetchBranchData();
                         }
                       }}>
                         <XCircle className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                </div>
                
                <dialog id="add-doctor-modal" className="modal p-0 rounded-2xl bg-transparent backdrop:bg-black/40">
                   <div className="bg-card border p-6 w-full max-w-md mx-auto rounded-2xl shadow-xl">
                      <h3 className="text-lg font-bold mb-4">Add New Doctor</h3>
                      <form className="space-y-4" onSubmit={async (e) => {
                         e.preventDefault();
                         setSavingDoctor(true);
                         const fd = new FormData(e.currentTarget);
                         const res = await fetch(`${API_BASE}/api/doctors/add`, {
                           method: 'POST',
                           headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                           body: fd
                         });
                         setSavingDoctor(false);
                         if (res.ok) {
                           (document.getElementById('add-doctor-modal') as any).close();
                           fetchBranchData();
                           toast({ title: "Doctor Added Successfully" });
                         } else {
                           const err = await res.json();
                           toast({ title: "Error", description: err.msg, variant: "destructive" });
                         }
                      }}>
                         <div><label className="text-xs font-bold mb-1 block">Name</label><input name="name" className="w-full border rounded-lg p-2 text-sm bg-background" required /></div>
                         <div><label className="text-xs font-bold mb-1 block">Email</label><input name="email" type="email" className="w-full border rounded-lg p-2 text-sm bg-background" required /></div>
                         <div><label className="text-xs font-bold mb-1 block">Password</label><input name="password" type="password" className="w-full border rounded-lg p-2 text-sm bg-background" required /></div>
                         <div><label className="text-xs font-bold mb-1 block">Specialization</label><input name="specialization" className="w-full border rounded-lg p-2 text-sm bg-background" required /></div>
                         <div><label className="text-xs font-bold mb-1 block">Experience (Years)</label><input name="experience" type="number" className="w-full border rounded-lg p-2 text-sm bg-background" required /></div>
                         <div><label className="text-xs font-bold mb-1 block">Doctor Image</label><input type="file" name="image" className="w-full text-xs" /></div>
                         <input type="hidden" name="branchId" value={branch?._id} />
                         <div className="flex gap-2 pt-2">
                           <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90" disabled={savingDoctor}>
                             {savingDoctor ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Doctor"}
                           </Button>
                           <Button type="button" variant="outline" className="flex-1" onClick={() => (document.getElementById('add-doctor-modal') as any).close()}>Cancel</Button>
                         </div>
                      </form>
                   </div>
                </dialog>
              </div>
            )}

            {/* ─── SETTINGS TAB ─────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-foreground">Branch Identity & Operational Settings</h3>
                <form className="space-y-8" onSubmit={async (e) => {
                   e.preventDefault();
                   if (!branch) return;
                   
                   const form = e.currentTarget;
                   const fd = new FormData(form);
                   
                   // Handle working days
                   const selectedDays = Array.from(form.querySelectorAll('input[name="workingDays"]:checked')).map((i: any) => i.value);
                   fd.delete('workingDays');
                   fd.append('workingDays', JSON.stringify(selectedDays));
                   
                   // Handle checkboxes (explicit true/false strings)
                   const emergency24x7 = (form.querySelector('input[name="emergency24x7"]') as HTMLInputElement)?.checked;
                   fd.set('emergency24x7', emergency24x7 ? 'true' : 'false');

                   // Handle address and coordinates
                   fd.append('latitude', String(branch.latitude || 20.5937));
                   fd.append('longitude', String(branch.longitude || 78.9629));
                   fd.append('city', branch.city || '');
                   fd.append('state', branch.state || '');
                   fd.append('pincode', branch.pincode || '');
                   fd.append('address', branch.address || '');

                   // Handle gallery and services
                   fd.append('existingGallery', JSON.stringify(branch.gallery || []));
                   fd.append('services', JSON.stringify(branch.services || []));
                   
                   if (!isLocationSelected) {
                     toast({ title: "Location Required", description: "Please select branch location on map.", variant: "destructive" });
                     setMapOpen(true);
                     return;
                   }
                   setSavingProfile(true);
                   try {
                     const res = await fetch(`${API_BASE}/api/branches/${branch._id}`, {
                       method: 'PUT',
                       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                       body: fd
                     });
                     
                     if (res.ok) {
                       toast({ title: "Profile Updated", description: "All changes saved successfully." });
                       fetchBranchData();
                       setNewGalleryPreviews([]);
                     } else {
                       const err = await res.json();
                       toast({ title: "Failed to update", description: err.msg, variant: "destructive" });
                     }
                   } catch (err: any) {
                     toast({ title: "Error", description: err.message, variant: "destructive" });
                   } finally {
                     setSavingProfile(false);
                   }
                }}>
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                           <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                              <Building2 className="h-4 w-4" />
                           </div>
                           <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">General Information</h4>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold mb-1.5 block text-muted-foreground uppercase tracking-widest px-1">About Branch</label>
                          <textarea name="about" defaultValue={branch?.about} className="w-full border border-border rounded-xl p-3.5 text-sm min-h-[140px] bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Describe your branch..." />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold mb-1.5 block text-muted-foreground uppercase tracking-widest px-1">Emergency Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input name="emergencyContactNumber" defaultValue={branch?.emergencyContactNumber} className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all" placeholder="+91 88888 77777" />
                          </div>
                        </div>

                        <div className="p-5 border border-dashed border-primary/30 rounded-2xl bg-primary/5 space-y-4">
                          <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                               <MapPin className="h-3 w-3" /> Branch Location
                             </h4>
                             <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold border-primary/20 text-primary hover:bg-primary/10" onClick={() => setMapOpen(true)}>
                               <Navigation className="h-3 w-3 mr-1" /> Update on Map
                             </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                               <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">City</label>
                               <Input value={branch?.city || ''} readOnly className="h-9 text-xs bg-white/60" />
                             </div>
                             <div className="space-y-1">
                               <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Pincode</label>
                               <Input value={branch?.pincode || ''} readOnly className="h-9 text-xs bg-white/60" />
                             </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Detailed Address</label>
                            <Input value={branch?.address || ''} readOnly className="h-9 text-xs bg-white/60" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl border bg-red-50/40 border-red-100 shadow-sm transition-all hover:shadow-md">
                           <input type="checkbox" name="emergency24x7" id="emergency24x7" defaultChecked={branch?.emergency24x7} className="h-5 w-5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                           <label htmlFor="emergency24x7" className="cursor-pointer flex-1">
                              <p className="text-sm font-bold text-red-700">24/7 Emergency Service</p>
                              <p className="text-[10px] text-red-600/70">Enable this if your branch operates emergency care round the clock.</p>
                           </label>
                        </div>
                       </div>

                       <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                           <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                              <Clock className="h-4 w-4" />
                           </div>
                           <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Working Day & Hour</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Opening Time</label>
                             <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input name="openingTime" type="time" defaultValue={branch?.openingTime} className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                             </div>
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Closing Time</label>
                             <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input name="closingTime" type="time" defaultValue={branch?.closingTime} className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                             </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl border bg-primary/5 border-primary/10">
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Slot Start Time</label>
                             <input name="startTime" type="time" defaultValue={branch?.startTime || "09:00"} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                             <p className="text-[9px] text-muted-foreground">Booking slots start from here.</p>
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Slot End Time</label>
                             <input name="endTime" type="time" defaultValue={branch?.endTime || "18:00"} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all" />
                             <p className="text-[9px] text-muted-foreground">Same-day booking blocks after this.</p>
                           </div>
                        </div>

                        <div className="p-4 rounded-2xl border bg-primary/5 border-primary/10">
                           <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1 block mb-2">Appointment Slot Time (e.g. 10 min)</label>
                           <input name="slotTime" defaultValue={branch?.slotTime || "15 min"} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 transition-all" placeholder="10 min" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold mb-3 block text-muted-foreground uppercase tracking-widest px-1">Active Working Days</label>
                          <div className="grid grid-cols-2 gap-2">
                             {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                               <label key={day} className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/60 text-xs font-medium cursor-pointer hover:bg-muted transition-all">
                                 <input type="checkbox" name="workingDays" value={day} defaultChecked={branch?.workingDays?.includes(day)} className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/20" />
                                 {day}
                               </label>
                             ))}
                          </div>
                        </div>
                       </div>
                    </div>

                   {/* ─── SERVICES ────────────────────────────── */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-sm uppercase text-primary">Services Offering</h4>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                           const title = prompt("Service Title:");
                           if (!title) return;
                           const desc = prompt("Short Description:");
                           setBranch({...branch, services: [...(branch.services || []), { title, description: desc || '' }]});
                        }}>Add Service</Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                         {(branch?.services || []).map((s: any, i: number) => (
                           <div key={i} className="p-3 border rounded-xl bg-card/50 relative group">
                              <p className="font-bold text-sm">{s.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                              <button type="button" className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm" onClick={() => {
                                 const newS = branch.services.filter((_: any, idx: number) => idx !== i);
                                 setBranch({...branch, services: newS});
                              }}><XCircle className="h-3 w-3" /></button>
                           </div>
                         ))}
                         {(!branch?.services || branch.services.length === 0) && <p className="text-xs text-muted-foreground col-span-full italic">No services added yet.</p>}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-bold text-sm border-b pb-2 uppercase text-primary">Gallery & Images</h4>
                      <p className="text-xs text-muted-foreground">Manage your branch photos. New uploads will appear in the slider on your details page.</p>
                      
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                         {/* Existing Gallery */}
                         {(branch?.gallery || []).map((img: string, i: number) => (
                           <div key={i} className="relative aspect-video border rounded-xl overflow-hidden group shadow-sm bg-muted/20">
                             <img src={img} className="h-full w-full object-cover" alt={`Gallery ${i}`} />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <button type="button" className="bg-red-600 text-white p-2 rounded-full shadow-lg" onClick={() => {
                                  const newG = branch.gallery.filter((_: any, idx: number) => idx !== i);
                                  setBranch({...branch, gallery: newG});
                                }}><XCircle className="h-5 w-5" /></button>
                             </div>
                             <span className="absolute bottom-1 left-1 bg-black/60 text-[8px] text-white px-1.5 rounded uppercase font-bold tracking-tighter">Live</span>
                           </div>
                         ))}
                         
                         {/* New Upload Previews */}
                         {newGalleryPreviews.map((url, i) => (
                           <div key={`new-${i}`} className="relative aspect-video border rounded-xl overflow-hidden group shadow-sm ring-2 ring-primary/20">
                             <img src={url} className="h-full w-full object-cover opacity-60" alt="New Preview" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-primary text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">Pending</span>
                             </div>
                           </div>
                         ))}
                         
                         <label className="aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary transition-all cursor-pointer group">
                            <Building2 className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                            <span className="text-xs font-bold text-center px-2">Select Images</span>
                            <span className="text-[10px] text-muted-foreground">JPG, PNG up to 5MB</span>
                            <input type="file" name="gallery" multiple className="hidden" accept="image/*" onChange={(e) => {
                               const files = Array.from(e.target.files || []);
                               const urls = files.map(f => URL.createObjectURL(f));
                               setNewGalleryPreviews(urls);
                               toast({ title: "Images Selected", description: `${files.length} images ready for upload.` });
                            }} />
                         </label>
                      </div>
                   </div>

                   <div className="flex justify-end gap-3 pt-6 border-t">
                      <Button variant="ghost" type="button" onClick={fetchBranchData}>Discard Changes</Button>
                      <Button type="submit" size="lg" className="px-8 shadow-md" disabled={savingProfile}>
                        {savingProfile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Profile Settings"
                        )}
                      </Button>
                   </div>
                </form>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    
    <Dialog open={mapOpen} onOpenChange={setMapOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[2rem]">
        <DialogHeader className="p-6 bg-white border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Update Branch Location
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 bg-slate-50">
          <GoogleMapPicker 
            initialLocation={{ lat: branch?.latitude || 20.5937, lng: branch?.longitude || 78.9629 }}
            onLocationSelect={(loc) => {
              setBranch({
                ...branch,
                latitude: loc.lat,
                longitude: loc.lng,
                address: loc.address,
                city: loc.city,
                state: loc.state,
                pincode: loc.pincode
              });
            }}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button 
              variant="default" 
              className="rounded-full px-8 h-11 font-bold shadow-lg shadow-primary/20"
              onClick={() => setMapOpen(false)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Location Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[2rem]">
          <DialogHeader className="p-6 bg-white border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Select Branch Location
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50">
            <GoogleMapPicker 
              initialLocation={{ 
                lat: branch?.latitude || 20.5937, 
                lng: branch?.longitude || 78.9629 
              }}
              onLocationSelect={(loc) => {
                setIsLocationSelected(true);
                setBranch((prev: any) => ({
                  ...prev,
                  latitude: loc.lat,
                  longitude: loc.lng,
                  address: loc.address,
                  city: loc.city,
                  state: loc.state,
                  pincode: loc.pincode
                }));
              }}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="default" 
                className="rounded-full px-8 h-11 font-bold shadow-lg shadow-primary/20"
                onClick={() => setMapOpen(false)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Branch Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Users, Ambulance, Building2, ArrowRight,
  Activity, AlertOctagon, CheckCircle2, Clock, XCircle,
  CalendarDays, Loader2, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

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
      const [aRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/api/appointments/hospital`, { headers }),
        fetch(`${API_BASE}/api/otp/emergency`, { headers }),
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
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleAppointmentAction = async (id: string, status: string, nextDate?: string) => {
    setUpdatingId(id);
    setActionType(status);
    try {
      const token = localStorage.getItem('token');
      const body: any = { status };
      if (nextDate) body.nextDate = nextDate;
      const res = await fetch(`${API_BASE}/api/appointments/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
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
    } catch { } finally { setUpdatingId(null); setActionType(null); }
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
                        <th className="pb-3 font-medium">Date & Time</th>
                        <th className="pb-3 font-medium">Token</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Status</th>
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
                            <p>{apt.date}</p>
                            <p className="text-xs text-muted-foreground">{apt.time}</p>
                          </td>
                          <td className="py-3.5 font-mono font-bold text-primary">
                            #{apt.tokenNumber || '—'}
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              {apt.type === 'Emergency'
                                ? <><AlertOctagon className="h-4 w-4 text-red-500" /><span className="text-red-600 font-semibold text-xs">Emergency</span></>
                                : <span className="text-xs text-muted-foreground">Normal</span>
                              }
                              {apt.ambulanceRequired && <Ambulance className="h-3.5 w-3.5 text-orange-500 ml-1" title="Ambulance requested" />}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <Badge variant="outline" className={getStatusColor(apt.status)}>
                              {apt.status}
                            </Badge>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Approve Button */}
                              {['Waiting', 'Rescheduled'].includes(apt.status) && (
                                <Button size="sm"
                                  disabled={anyLoading(apt._id)}
                                  onClick={() => handleAppointmentAction(apt._id, 'Confirmed')}
                                  className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700">
                                  {isLoading(apt._id, 'Confirmed')
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <><CheckCircle2 className="h-3 w-3 mr-1" />Approve</>}
                                </Button>
                              )}
                              {/* Move to Next Day */}
                              {['Waiting', 'Confirmed'].includes(apt.status) && (
                                <Button size="sm" variant="outline"
                                  disabled={anyLoading(apt._id)}
                                  onClick={() => handleAppointmentAction(apt._id, 'Rescheduled')}
                                  className="h-7 px-2.5 text-xs">
                                  {isLoading(apt._id, 'Rescheduled')
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <><CalendarDays className="h-3 w-3 mr-1" />Next Day</>}
                                </Button>
                              )}
                              {/* Reject */}
                              {['Waiting', 'Rescheduled'].includes(apt.status) && (
                                <Button size="sm" variant="outline"
                                  disabled={anyLoading(apt._id)}
                                  onClick={() => handleAppointmentAction(apt._id, 'Not Selected')}
                                  className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50">
                                  {isLoading(apt._id, 'Not Selected')
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <><XCircle className="h-3 w-3 mr-1" />Reject</>}
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

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

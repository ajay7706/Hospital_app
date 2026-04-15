import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Phone,
  Building2,
  Ambulance,
  User,
  Settings,
  Activity,
  ArrowRight,
  Search,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function BranchDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Data States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'branch') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchBranchData();
  }, [navigate]);

  const readErrorMessage = async (res: Response) => {
    try {
      const data = await res.json();
      return data?.msg || data?.message || 'Request failed';
    } catch {
      return 'Request failed';
    }
  };

  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get Appointments (Already filtered by branchId in backend for 'branch' role)
      const aRes = await fetch(`${API_BASE}/api/appointments/hospital`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAppointments(Array.isArray(aData.appointments) ? aData.appointments : []);
        setStats(aData.stats);
      }

      // Get Emergencies (Backend needs to support branchId filtering for emergencies too)
      const eRes = await fetch(`${API_BASE}/api/otp/emergency`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (eRes.ok) {
        const eData = await eRes.json();
        setEmergencies(Array.isArray(eData) ? eData : []);
      }

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, type: 'appointment' | 'emergency') => {
    try {
      const token = localStorage.getItem('token');
      const url = type === 'appointment' 
        ? `${API_BASE}/api/appointments/update/${id}`
        : `${API_BASE}/api/otp/emergency/${id}`;
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        toast({ title: `Marked as ${status}` });
        fetchBranchData();
        return;
      }
      toast({ title: 'Error', description: await readErrorMessage(res), variant: 'destructive' });
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const SidebarItem = ({ icon: Icon, label, id }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-cta/5 text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-card/70 backdrop-blur border-r border-border p-6 flex flex-col h-auto md:h-screen md:sticky top-0 z-10 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold truncate max-w-[150px]">Branch Dashboard</h2>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={Activity} label="Overview" id="dashboard" />
          <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
          <SidebarItem icon={Ambulance} label="Emergency" id="emergency" />
        </nav>
        
        <div className="mt-8 pt-6 border-t border-border space-y-2">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <ArrowRight className="h-5 w-5 mr-3" /> Exit Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground">Manage your branch operations here.</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0)}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Today Appointments', value: stats?.today || 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Pending Approval', value: stats?.pending || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                  ].map((s, i) => (
                    <div key={i} className={`border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm ${s.bg}`}>
                      <div>
                        <p className="text-muted-foreground text-sm">{s.label}</p>
                        <h3 className="text-3xl font-bold mt-1">{s.value}</h3>
                      </div>
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${s.color} bg-white shadow-sm`}>
                        <s.icon className="h-6 w-6" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Recent Activity */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent Appointments</h3>
                    <div className="space-y-4">
                      {appointments.slice(0, 5).map((apt: any) => (
                        <div key={apt._id} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {apt.patientName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{apt.patientName}</p>
                              <p className="text-xs text-muted-foreground">{apt.date} • {apt.time}</p>
                            </div>
                          </div>
                          <Badge className={apt.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                      {appointments.length === 0 && <p className="text-center py-10 text-muted-foreground">No appointments found.</p>}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-xl font-bold mb-4">Emergency Alerts</h3>
                      <div className="space-y-3">
                        {emergencies.filter(e => e.status === 'pending').slice(0, 3).map((em: any) => (
                          <div key={em._id} className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Ambulance className="h-5 w-5 text-red-600" />
                              <span className="font-bold text-red-700">{em.phone}</span>
                            </div>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(em._id, 'accepted', 'emergency')}>Accept</Button>
                          </div>
                        ))}
                        {emergencies.filter(e => e.status === 'pending').length === 0 && (
                          <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                            No active emergency alerts.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appointments' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Manage Appointments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-sm text-muted-foreground">
                        <th className="pb-4">Patient</th>
                        <th className="pb-4">Date & Time</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {appointments.map((apt: any) => (
                        <tr key={apt._id}>
                          <td className="py-4">
                            <p className="font-bold">{apt.patientName}</p>
                            <p className="text-xs text-muted-foreground">{apt.phone}</p>
                          </td>
                          <td className="py-4 text-sm">{apt.date} at {apt.time}</td>
                          <td className="py-4">
                            <Badge variant="outline" className="capitalize">{apt.status}</Badge>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {apt.status === 'pending' && (
                              <Button size="sm" onClick={() => handleStatusUpdate(apt._id, 'approved', 'appointment')}>Approve</Button>
                            )}
                            {apt.status === 'approved' && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(apt._id, 'completed', 'appointment')}>Complete</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'emergency' && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Emergency Requests History</h3>
                <div className="space-y-4">
                  {emergencies.map((em: any) => (
                    <div key={em._id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${em.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          <Ambulance className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold">{em.phone}</p>
                          <p className="text-xs text-muted-foreground">{new Date(em.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge className={em.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {em.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {emergencies.length === 0 && <p className="text-center py-10 text-muted-foreground">No history found.</p>}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

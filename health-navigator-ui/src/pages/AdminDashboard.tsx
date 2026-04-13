import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  CheckCircle2, 
  ShieldCheck,
  MapPin,
  Clock,
  Users,
  FileText,
  AlertCircle,
  LayoutDashboard,
  Calendar,
  Activity,
  Star,
  Trash2,
  Ban,
  RotateCcw,
  Eye,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Data States
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);

  // Selection for Modals
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const statsRes = await fetch(`${API_BASE}/api/admin/stats`, { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      if (activeTab === 'hospitals') {
        const res = await fetch(`${API_BASE}/api/admin/hospital/all`, { headers });
        if (res.ok) setHospitals(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers });
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === 'appointments') {
        const res = await fetch(`${API_BASE}/api/admin/appointments`, { headers });
        if (res.ok) setAppointments(await res.json());
      } else if (activeTab === 'reviews') {
        const res = await fetch(`${API_BASE}/api/admin/reviews`, { headers });
        if (res.ok) setReviews(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleAction = async (endpoint: string, method: string = 'PATCH', body?: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Action performed successfully' });
        fetchAdminData();
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.msg || 'Action failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  const statCards = [
    { label: 'Total Hospitals', value: stats?.totalHospitals || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Approvals', value: stats?.pendingHospitals || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Bookings', value: stats?.totalAppointments || 0, icon: FileText, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Emergencies (Today)', value: stats?.todayEmergencies || 0, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const SidebarItem = ({ icon: Icon, label, id }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const resolveUrl = (url: string) => url?.startsWith('http') ? url : `${API_BASE}/${url}`;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border p-6 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Healthcare System</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" />
          <SidebarItem icon={Building2} label="Hospitals" id="hospitals" />
          <SidebarItem icon={Users} label="Users" id="users" />
          <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
          <SidebarItem icon={Star} label="Reviews" id="reviews" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-bold text-foreground capitalize">{activeTab} Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and control system operations</p>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((card) => (
                  <div key={card.label} className={`rounded-2xl border border-border p-5 shadow-sm ${card.bg}`}>
                    <card.icon className={`mb-2 h-6 w-6 ${card.color}`} />
                    <p className="text-3xl font-bold text-foreground">{card.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Appointment Trends (Weekly)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.appointmentTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" /> Emergency Alerts (Weekly)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.emergencyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Top Hospitals (by Bookings)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.topHospitals} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="_id" type="category" width={120} fontSize={12} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Active Cities
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.activeCities}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="_id" fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Appointments</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Hospital</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recentAppointments?.map((apt: any) => (
                        <TableRow key={apt._id}>
                          <TableCell className="font-medium">{apt.patientName}</TableCell>
                          <TableCell className="text-xs">{apt.hospitalName}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{apt.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Live Emergencies</h3>
                  <div className="space-y-4">
                    {stats?.recentEmergencies?.map((em: any) => (
                      <div key={em._id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-red-700 truncate">{em.hospitalId?.hospitalName}</p>
                          <p className="text-xs text-red-600">{em.phone} • {new Date(em.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'hospitals' && (
            <motion.div key="hospitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospitals.map((h) => (
                      <TableRow key={h._id} className={h.isDeleted ? 'opacity-50 grayscale' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={resolveUrl(h.hospitalLogo)} className="h-10 w-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold">{h.hospitalName}</p>
                              <p className="text-xs text-muted-foreground">{h.adminName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs"><MapPin className="inline h-3 w-3 mr-1" /> {h.city}</TableCell>
                        <TableCell>
                          <Badge className={h.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {h.approvalStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedHospital(h); setDocModalOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {h.approvalStatus === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleAction(`/api/admin/hospital/${h._id}/approve`)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleAction(`/api/admin/hospital/${h._id}/reject`)}>
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className={h.isDeleted ? 'text-green-600' : 'text-red-600'} onClick={() => handleAction(`/api/admin/hospital/${h._id}`, 'DELETE')}>
                            {h.isDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-bold">{u.name}</TableCell>
                        <TableCell className="text-xs">
                          <p>{u.email}</p>
                          <p className="text-muted-foreground">{u.phone}</p>
                        </TableCell>
                        <TableCell>{u.bookingsCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className={u.isBlocked ? 'text-green-600' : 'text-red-600'} onClick={() => handleAction(`/api/admin/user/${u._id}/toggle-block`)}>
                            {u.isBlocked ? <RotateCcw className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div key="appointments" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Override</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium">{a.patientName}</TableCell>
                        <TableCell className="text-xs">{a.hospitalName}</TableCell>
                        <TableCell className="text-xs">{a.date}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{a.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {a.status !== 'cancelled' && (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleAction(`/api/admin/appointment/${a._id}/cancel`)}>
                              <XCircle className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid gap-4">
                {reviews.map((r) => (
                  <div key={r._id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">{r.patientName}</span>
                        <span className="text-xs text-muted-foreground">on</span>
                        <span className="text-xs font-medium text-primary">{r.hospitalId?.hospitalName}</span>
                      </div>
                      <div className="flex gap-0.5 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleAction(`/api/admin/review/${r._id}`, 'DELETE')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hospital Docs Modal */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hospital Verification Documents</DialogTitle>
          </DialogHeader>
          {selectedHospital && (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <p className="text-sm font-bold">License Certificate</p>
                <div className="border rounded-xl overflow-hidden bg-muted">
                  {selectedHospital.licenseCertificate?.endsWith('.pdf') ? (
                    <iframe src={resolveUrl(selectedHospital.licenseCertificate)} className="w-full h-64" />
                  ) : (
                    <img src={resolveUrl(selectedHospital.licenseCertificate)} className="w-full h-auto object-contain" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold">Owner ID Proof</p>
                <div className="border rounded-xl overflow-hidden bg-muted">
                  <img src={resolveUrl(selectedHospital.ownerIdProof)} className="w-full h-auto object-contain" />
                </div>
              </div>
              <div className="md:col-span-2 p-4 bg-muted/50 rounded-xl space-y-3">
                <h4 className="font-bold">Hospital Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><span className="text-muted-foreground">License:</span> {selectedHospital.hospitalLicenseNumber}</p>
                  <p><span className="text-muted-foreground">Admin:</span> {selectedHospital.adminName}</p>
                  <p><span className="text-muted-foreground">Contact:</span> {selectedHospital.contactNumber}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedHospital.officialEmail}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
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
  XCircle,
  Database,
  TrendingUp,
  Lock,
  Settings2,
  Mail,
  Phone as PhoneIcon,
  Globe,
  Percent,
  Shield,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [hospitalBranches, setHospitalBranches] = useState<any[]>([]);

  // Settings State
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

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
      } else if (activeTab === 'settings') {
        const res = await fetch(`${API_BASE}/api/admin/settings`, { headers });
        if (res.ok) setAdminSettings(await res.json());
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

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (endpoint: string, method: string = 'PATCH', body?: any, actionId?: string) => {
    if (actionId) setActionLoading(actionId);
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
    } finally {
      if (actionId) setActionLoading(null);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminSettings)
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Platform settings updated' });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchHospitalBranches = async (hospitalId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/hospital/${hospitalId}/branches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHospitalBranches(await res.json());
    } catch (err) {
      console.error('Failed to fetch branches');
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
          <SidebarItem icon={TrendingUp} label="Platform Insights" id="insights" />
          <SidebarItem icon={Users} label="Users" id="users" />
          <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
          <SidebarItem icon={Star} label="Reviews" id="reviews" />
          <SidebarItem icon={Settings2} label="Settings" id="settings" />
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
                    {hospitals?.map((h) => (
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { 
                              setSelectedHospital(h); 
                              fetchHospitalBranches(h._id);
                              setDocModalOpen(true); 
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>

                            {h.approvalStatus !== 'approved' && (
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="bg-primary hover:bg-primary/90 text-white"
                                isLoading={actionLoading === `approve-${h._id}`}
                                onClick={() => handleAction(`/api/admin/hospital/${h._id}/approve`, 'PATCH', null, `approve-${h._id}`)}
                              >
                                Approve
                              </Button>
                            )}

                            {h.approvalStatus !== 'rejected' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                isLoading={actionLoading === `reject-${h._id}`}
                                onClick={() => handleAction(`/api/admin/hospital/${h._id}/reject`, 'PATCH', null, `reject-${h._id}`)}
                              >
                                Reject
                              </Button>
                            )}

                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className={h.isDeleted ? 'text-green-600' : 'text-red-600'} 
                              isLoading={actionLoading === `delete-${h._id}`}
                              onClick={() => handleAction(`/api/admin/hospital/${h._id}`, 'DELETE', null, `delete-${h._id}`)}
                            >
                              {h.isDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
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
                    {users?.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-bold">{u.name}</TableCell>
                        <TableCell className="text-xs">
                          <p>{u.email}</p>
                          <p className="text-muted-foreground">{u.phone}</p>
                        </TableCell>
                        <TableCell>{u.bookingsCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={u.isBlocked ? 'text-green-600' : 'text-red-600'} 
                            isLoading={actionLoading === `block-${u._id}`}
                            onClick={() => handleAction(`/api/admin/user/${u._id}/toggle-block`, 'PATCH', null, `block-${u._id}`)}
                          >
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

          {activeTab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                  <h4 className="text-blue-700 font-bold mb-1">New Hospitals</h4>
                  <p className="text-3xl font-black text-blue-900">{stats?.platformInsights?.hospitals?.today || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Today's registrations</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                  <h4 className="text-indigo-700 font-bold mb-1">Total Branches</h4>
                  <p className="text-3xl font-black text-indigo-900">{stats?.totalBranches || 0}</p>
                  <p className="text-xs text-indigo-600 mt-1">Across all locations</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                  <h4 className="text-emerald-700 font-bold mb-1">Active Doctors</h4>
                  <p className="text-3xl font-black text-emerald-900">{stats?.totalDoctors || 0}</p>
                  <p className="text-xs text-emerald-600 mt-1">Verified professionals</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
                  <h4 className="text-rose-700 font-bold mb-1">Platform Staff</h4>
                  <p className="text-3xl font-black text-rose-900">{stats?.totalStaff || 0}</p>
                  <p className="text-xs text-rose-600 mt-1">Total support staff</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Hospital Registry
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {stats?.platformInsights?.hospitals?.all?.map((h: any) => (
                      <div key={h._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div>
                          <p className="font-bold text-sm">{h.hospitalName}</p>
                          <p className="text-xs text-muted-foreground">{h.city}</p>
                        </div>
                        <p className="text-[10px] font-medium bg-muted px-2 py-1 rounded-full">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Appointment Insights
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/30">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
                      <p className="text-2xl font-black mt-1">{stats?.platformInsights?.appointments?.total || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's</p>
                      <p className="text-2xl font-black mt-1 text-primary">{stats?.platformInsights?.appointments?.today || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</p>
                      <p className="text-2xl font-black mt-1 text-amber-900">{stats?.platformInsights?.appointments?.pending || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Completed</p>
                      <p className="text-2xl font-black mt-1 text-green-900">{stats?.platformInsights?.appointments?.completed || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <form onSubmit={handleUpdateSettings} className="space-y-8 max-w-4xl">
                {/* 1. GENERAL SETTINGS */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> 1. General Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Platform Name</Label>
                      <Input 
                        value={adminSettings?.platformName || ''} 
                        onChange={(e) => setAdminSettings({...adminSettings, platformName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Default City/Location</Label>
                      <Input 
                        value={adminSettings?.defaultCity || ''} 
                        onChange={(e) => setAdminSettings({...adminSettings, defaultCity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Support Email</Label>
                      <Input 
                        type="email"
                        value={adminSettings?.supportEmail || ''} 
                        onChange={(e) => setAdminSettings({...adminSettings, supportEmail: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Support Phone</Label>
                      <Input 
                        value={adminSettings?.supportPhone || ''} 
                        onChange={(e) => setAdminSettings({...adminSettings, supportPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. OPD SETTINGS */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" /> 2. OPD Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8 items-end">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enable OPD Fee Globally</Label>
                        <p className="text-xs text-muted-foreground">Charge platform fees on all bookings</p>
                      </div>
                      <Switch 
                        checked={adminSettings?.enableOpdFeeGlobally} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, enableOpdFeeGlobally: checked})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Default OPD Fee (₹)</Label>
                      <Input 
                        type="number"
                        value={adminSettings?.defaultOpdFee || 0} 
                        onChange={(e) => setAdminSettings({...adminSettings, defaultOpdFee: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-base">Allow Branch Override</Label>
                        <p className="text-xs text-muted-foreground">Branches can set custom fees</p>
                      </div>
                      <Switch 
                        checked={adminSettings?.allowBranchOverride} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, allowBranchOverride: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. APPOINTMENT SETTINGS */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> 3. Appointment Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Max Bookings Per Day</Label>
                      <Input 
                        type="number"
                        value={adminSettings?.maxBookingsPerDay || 300} 
                        onChange={(e) => setAdminSettings({...adminSettings, maxBookingsPerDay: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Approvals Per Day</Label>
                      <Input 
                        type="number"
                        value={adminSettings?.maxApprovalsPerDay || 200} 
                        onChange={(e) => setAdminSettings({...adminSettings, maxApprovalsPerDay: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slot Timing (Minutes)</Label>
                      <Input 
                        type="number"
                        value={adminSettings?.slotTimingMinutes || 15} 
                        onChange={(e) => setAdminSettings({...adminSettings, slotTimingMinutes: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-base">Allow Overbooking</Label>
                      </div>
                      <Switch 
                        checked={adminSettings?.allowOverbooking} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, allowOverbooking: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. NOTIFICATION SETTINGS */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" /> 4. Notifications
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <Label>Email</Label>
                      <Switch 
                        checked={adminSettings?.enableEmail} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, enableEmail: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <Label>SMS</Label>
                      <Switch 
                        checked={adminSettings?.enableSms} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, enableSms: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl opacity-50">
                      <Label>WhatsApp</Label>
                      <Switch disabled checked={false} />
                    </div>
                  </div>
                </div>

                {/* 5. RATING SETTINGS */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> 5. Rating Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <Label>Enable Rating System</Label>
                      <Switch 
                        checked={adminSettings?.enableRatingSystem} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, enableRatingSystem: checked})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Reminder Count</Label>
                      <Input 
                        type="number"
                        value={adminSettings?.maxReminderCount || 2} 
                        onChange={(e) => setAdminSettings({...adminSettings, maxReminderCount: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. SECURITY & DATA */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" /> 6. Security
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Auto Logout (Minutes)</Label>
                        <Input 
                          type="number"
                          value={adminSettings?.autoLogoutTimeMinutes || 60} 
                          onChange={(e) => setAdminSettings({...adminSettings, autoLogoutTimeMinutes: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Login Protection</Label>
                        <Switch 
                          checked={adminSettings?.enableLoginProtection} 
                          onCheckedChange={(checked) => setAdminSettings({...adminSettings, enableLoginProtection: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Trash2 className="h-5 w-5 text-primary" /> 7. Data Management
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-rose-700">Enable Soft Delete</Label>
                        <p className="text-xs text-rose-600">Items are hidden instead of removed</p>
                      </div>
                      <Switch 
                        checked={adminSettings?.enableSoftDelete} 
                        onCheckedChange={(checked) => setAdminSettings({...adminSettings, enableSoftDelete: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* 8. API SETTINGS */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" /> 8. API Configuration
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>SMS API Key</Label>
                      <Input 
                        type="password"
                        placeholder="••••••••••••••••"
                        value={adminSettings?.smsApiKey || ''} 
                        onChange={(e) => setAdminSettings({...adminSettings, smsApiKey: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email API Key (SendGrid/SMTP)</Label>
                      <Input 
                        type="password"
                        placeholder="••••••••••••••••"
                        value={adminSettings?.emailApiKey || ''} 
                        onChange={(e) => setAdminSettings({...adminSettings, emailApiKey: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button size="lg" className="px-10 gap-2 h-14 text-lg shadow-xl" type="submit" isLoading={settingsLoading}>
                    <Save className="h-5 w-5" /> Save All Settings
                  </Button>
                </div>
              </form>
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
                    {appointments?.map((a) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium">{a.patientName}</TableCell>
                        <TableCell className="text-xs">{a.hospitalName}</TableCell>
                        <TableCell className="text-xs">{a.date}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{a.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {a.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600" 
                              isLoading={actionLoading === `cancel-apt-${a._id}`}
                              onClick={() => handleAction(`/api/admin/appointment/${a._id}/cancel`, 'PATCH', null, `cancel-apt-${a._id}`)}
                            >
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
                {reviews?.map((r) => (
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
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600" 
                      isLoading={actionLoading === `del-rev-${r._id}`}
                      onClick={() => handleAction(`/api/admin/review/${r._id}`, 'DELETE', null, `del-rev-${r._id}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hospital Details Modal */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          {selectedHospital && (
            <div className="flex flex-col h-full">
              {/* Header Banner */}
              <div className="h-32 bg-gradient-to-r from-primary/20 to-indigo-500/10 flex items-end px-8 pb-4">
                <div className="flex items-center gap-4">
                  <img src={resolveUrl(selectedHospital.hospitalLogo)} className="h-20 w-20 rounded-2xl border-4 border-background shadow-lg object-cover" />
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold">{selectedHospital.hospitalName}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {selectedHospital.city}, {selectedHospital.state}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                    <Building2 className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-black">{hospitalBranches.length}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Branches</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                    <Users className="h-5 w-5 mx-auto mb-2 text-indigo-500" />
                    <p className="text-2xl font-black">
                      {hospitalBranches.reduce((acc, b) => acc + (b.doctorsCount || 0), 0)}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Doctors</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                    <ShieldCheck className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-black">
                      {hospitalBranches.reduce((acc, b) => acc + (b.staffCount || 0), 0)}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Support Staff</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column: Branches */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" /> Branch Network
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {hospitalBranches?.map((b) => (
                        <div key={b._id} className="p-4 rounded-xl border border-border bg-card shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm">{b.branchName}</h4>
                            <Badge variant="outline" className="text-[10px]">{b.location}</Badge>
                          </div>
                          <div className="flex gap-4 text-[11px] text-muted-foreground">
                            <span>{b.doctorsCount || 0} Doctors</span>
                            <span>{b.staffCount || 0} Staff</span>
                          </div>
                        </div>
                      ))}
                      {hospitalBranches.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No branches registered yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Verification Documents */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" /> Verification Assets
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">License</Label>
                        <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden border border-border group relative">
                          <img src={resolveUrl(selectedHospital.licenseCertificate)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            View Full
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Owner ID</Label>
                        <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden border border-border group relative">
                          <img src={resolveUrl(selectedHospital.ownerIdProof)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            View Full
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Contact Info */}
                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-indigo-900">Contact Administrator</h4>
                    <p className="text-sm text-indigo-700">{selectedHospital.adminName} • {selectedHospital.officialEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Mail className="h-4 w-4 mr-2" /> Email
                    </Button>
                    <Button size="sm" variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <PhoneIcon className="h-4 w-4 mr-2" /> Call
                    </Button>
                  </div>
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
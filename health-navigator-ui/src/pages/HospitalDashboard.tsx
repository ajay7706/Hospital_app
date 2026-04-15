import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Phone,
  Building2,
  Ambulance,
  User,
  Settings,
  Image as ImageIcon,
  Activity,
  ArrowRight,
  Search,
  Trash2,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function HospitalDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // Forms States
  const [doctorForm, setDoctorForm] = useState({ name: '', specialization: '', experience: '', image: null as File | null });
  const [branchForm, setBranchForm] = useState({ branchName: '', address: '', city: '', phone: '', image: null as File | null });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', branchId: '' });
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [navbarIconFile, setNavbarIconFile] = useState<File | null>(null);
  const [savingNavbarIcon, setSavingNavbarIcon] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [selectedBranchFilter]);

  const readErrorMessage = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return data?.msg || data?.message || 'Request failed';
      }
      const text = await res.text();
      return text?.slice(0, 180) || 'Request failed';
    } catch {
      return 'Request failed';
    }
  };

  const resolveAssetUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}/${url}`;
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get Hospital
      const hRes = await fetch(`${API_BASE}/api/hospitals/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!hRes.ok) throw new Error(await readErrorMessage(hRes));
      const hData = await hRes.json();
      setHospital(hData);

      // Get Appointments
      const aUrl = selectedBranchFilter === 'all' 
        ? `${API_BASE}/api/appointments/hospital` 
        : `${API_BASE}/api/appointments/hospital?branchId=${selectedBranchFilter}`;
      
      const aRes = await fetch(aUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAppointments(Array.isArray(aData.appointments) ? aData.appointments : []);
        setStats(aData.stats);
      }

      // Get Doctors
      const dRes = await fetch(`${API_BASE}/api/doctors/${hData._id}`);
      if (dRes.ok) setDoctors(await dRes.json());

      // Get Branches
      const bRes = await fetch(`${API_BASE}/api/branches/${hData._id}`);
      if (bRes.ok) setBranches(await bRes.json());

      // Get Emergencies
      const eRes = await fetch(`${API_BASE}/api/otp/emergency/${hData._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (eRes.ok) setEmergencies(await eRes.json());

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      formDataAppendObj(fd, doctorForm);
      const res = await fetch(`${API_BASE}/api/doctors/add`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Doctor added successfully' });
      setDoctorForm({ name: '', specialization: '', experience: '', image: null });
      fetchInitialData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/doctors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Doctor removed' });
      fetchInitialData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      formDataAppendObj(fd, branchForm);
      const res = await fetch(`${API_BASE}/api/branches/add`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Branch added successfully' });
      setBranchForm({ branchName: '', address: '', city: '', phone: '', image: null });
      fetchInitialData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/create-branch-staff`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(staffForm)
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Branch staff created successfully' });
      setStaffForm({ name: '', email: '', password: '', branchId: '' });
      fetchInitialData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const formDataAppendObj = (fd: FormData, obj: any) => {
    Object.keys(obj).forEach(key => { if (obj[key] !== null) fd.append(key, obj[key]); });
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/branches/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Branch removed' });
      fetchInitialData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const [uploadingGallery, setUploadingGallery] = useState(false);
  const handleUploadGallery = async () => {
    if (!galleryFiles.length) return;
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      galleryFiles.forEach((f) => fd.append('gallery', f));
      const res = await fetch(`${API_BASE}/api/hospitals/update`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: fd });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Gallery updated' });
      setGalleryFiles([]);
      fetchInitialData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleUpdateNavbarIcon = async () => {
    if (!navbarIconFile) {
      toast({ title: 'Error', description: 'Please select a logo file', variant: 'destructive' });
      return;
    }
    setSavingNavbarIcon(true);
    try {
      const fd = new FormData();
      fd.append('navbarIcon', navbarIconFile);
      const res = await fetch(`${API_BASE}/api/hospitals/update`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: fd });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = await res.json();
      if (data?.hospital) {
        setHospital(data.hospital);
        localStorage.setItem('hospitalProfile', JSON.stringify(data.hospital));
      }
      setNavbarIconFile(null);
      toast({ title: 'Navbar icon updated successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingNavbarIcon(false);
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
        fetchInitialData();
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
            <h2 className="text-xl font-bold truncate max-w-[150px]">{hospital?.hospitalName}</h2>
            <p className="text-xs text-muted-foreground">Hospital Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={Activity} label="Dashboard" id="dashboard" />
          <SidebarItem icon={Calendar} label="Appointments" id="appointments" />
          <SidebarItem icon={Ambulance} label="Emergency" id="emergency" />
          <SidebarItem icon={User} label="Doctors" id="doctors" />
          <SidebarItem icon={Building2} label="Branches" id="branches" />
          <SidebarItem icon={ImageIcon} label="Gallery" id="gallery" />
        </nav>
        
        <div className="mt-8 pt-6 border-t border-border space-y-2">
          <SidebarItem icon={Settings} label="Settings" id="settings" />
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <ArrowRight className="h-5 w-5 mr-3" /> Exit Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 h-screen overflow-y-auto">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-10">
          <div className="relative w-64 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-card/70 border border-border rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-muted border border-border overflow-hidden">
              {(hospital?.navbarIcon || hospital?.hospitalLogo) ? (
                <img src={resolveAssetUrl(hospital.navbarIcon || hospital.hospitalLogo)} alt="logo" className="h-full w-full object-cover"/>
              ) : null}
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Appointments', value: stats?.total || 0, icon: Calendar },
                    { label: 'Emergency Requests', value: emergencies.length, icon: Ambulance },
                    { label: 'Total Doctors', value: doctors.length, icon: User },
                    { label: 'Total Branches', value: branches.length, icon: Building2 },
                  ].map((s, i) => (
                    <div key={i} className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-muted-foreground text-sm">{s.label}</p>
                        <h3 className="text-3xl font-bold mt-1">{s.value}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                        <s.icon className="h-6 w-6" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Appointment History */}
                  <div className="lg:col-span-2 bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Recent Appointments</h3>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('appointments')}>View all</Button>
                    </div>
                    <div className="space-y-4">
                      {appointments.slice(0, 4).map((apt: any) => (
                        <div key={apt._id} className="flex items-center justify-between p-4 rounded-xl bg-background/60 border border-border">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {apt.patientName?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <p className="font-semibold">{apt.patientName}</p>
                              <p className="text-xs text-muted-foreground">{apt.date} • {apt.time}</p>
                            </div>
                          </div>
                          <Badge className={apt.status === 'approved' ? 'bg-primary/10 text-primary' : apt.status === 'completed' ? 'bg-success/10 text-success' : 'bg-amber-500/20 text-amber-600'}>
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                      {appointments.length === 0 && <p className="text-muted-foreground text-center py-4">No appointments yet.</p>}
                    </div>
                  </div>

                  {/* Share Photos Preview */}
                  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Gallery</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('gallery')} className="text-primary">See all</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {hospital?.gallery?.slice(0, 4).map((img: string, i: number) => (
                        <div key={i} className="rounded-lg overflow-hidden h-24 border border-border bg-muted">
                          <img src={resolveAssetUrl(img)} alt="Gallery" className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {(!hospital?.gallery || hospital.gallery.length === 0) && <p className="col-span-2 text-muted-foreground text-center py-4">No images</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appointments' && (
              <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-xl font-bold">Appointment Requests</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter by Branch:</span>
                    <select 
                      value={selectedBranchFilter} 
                      onChange={(e) => setSelectedBranchFilter(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="all">All Branches</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.branchName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-sm">
                        <th className="pb-4 font-medium">Patient</th>
                        <th className="pb-4 font-medium">Branch</th>
                        <th className="pb-4 font-medium">Contact</th>
                        <th className="pb-4 font-medium">Date & Time</th>
                        <th className="pb-4 font-medium">Status</th>
                        <th className="pb-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {appointments.map((apt: any) => (
                        <tr key={apt._id} className="text-sm">
                          <td className="py-4 font-medium">{apt.patientName}</td>
                          <td className="py-4 text-muted-foreground">{apt.branchId?.branchName || 'Main Hospital'}</td>
                          <td className="py-4 text-muted-foreground">{apt.phone}</td>
                          <td className="py-4 text-muted-foreground">{apt.date} at {apt.time}</td>
                          <td className="py-4">
                            <Badge className={apt.status === 'approved' ? 'bg-primary/10 text-primary' : apt.status === 'completed' ? 'bg-success/10 text-success' : 'bg-amber-500/20 text-amber-600'}>
                              {apt.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {apt.status === 'pending' && (
                              <Button size="sm" onClick={() => handleStatusUpdate(apt._id, 'approved', 'appointment')}>Approve</Button>
                            )}
                            {apt.status === 'approved' && (
                              <Button size="sm" onClick={() => handleStatusUpdate(apt._id, 'completed', 'appointment')} variant="outline">Complete</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {appointments.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No appointments found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'emergency' && (
              <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Live Emergency Requests</h3>
                <div className="grid gap-4">
                  {emergencies.map((em: any) => (
                    <div key={em._id} className="flex flex-col md:flex-row items-center justify-between p-5 rounded-xl bg-destructive/5 border border-destructive/20">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
                          <Ambulance className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Emergency Request</p>
                          <p className="text-sm text-destructive font-medium">Phone: {em.phone}</p>
                          <p className="text-xs text-muted-foreground mt-1">Requested: {new Date(em.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        {em.status === 'pending' ? (
                          <>
                            <Button className="flex-1 md:flex-none" onClick={() => handleStatusUpdate(em._id, 'accepted', 'emergency')}>Accept</Button>
                            <Button variant="outline" className="flex-1 md:flex-none" onClick={() => handleStatusUpdate(em._id, 'rejected', 'emergency')}>Reject</Button>
                          </>
                        ) : (
                          <Badge className={em.status === 'accepted' ? 'bg-success/10 text-success text-sm py-1' : 'bg-destructive/15 text-destructive text-sm py-1'}>
                            {em.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {emergencies.length === 0 && <p className="text-muted-foreground text-center py-8">No emergency requests.</p>}
                </div>
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Manage Doctors</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {doctors.map(doc => (
                      <div key={doc._id} className="p-4 bg-background/60 border border-border rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border">
                            {doc.image ? <img src={resolveAssetUrl(doc.image)} className="h-full w-full object-cover" alt={doc.name} /> : <User className="h-full w-full p-2 text-muted-foreground"/>}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Dr. {doc.name}</p>
                            <p className="text-xs text-primary">{doc.specialization}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDoctor(doc._id)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    ))}
                    {doctors.length === 0 && <p className="text-muted-foreground py-4 col-span-2">No doctors added yet.</p>}
                  </div>
                </div>
                <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 h-fit shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Add New Doctor</h3>
                  <form onSubmit={handleAddDoctor} className="space-y-4">
                    <Input placeholder="Doctor Name" value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} required />
                    <Input placeholder="Specialization" value={doctorForm.specialization} onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})} required />
                    <Input type="number" placeholder="Experience (Years)" value={doctorForm.experience} onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})} required />
                    <Input type="file" accept="image/*" onChange={e => setDoctorForm({...doctorForm, image: e.target.files?.[0] || null})} />
                    <Button type="submit" className="w-full">Add Doctor</Button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Manage Branches</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {branches.map(branch => (
                        <div key={branch._id} className="p-4 bg-background/60 border border-border rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold">{branch.branchName}</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBranch(branch._id)}><Trash2 className="h-4 w-4"/></Button>
                          </div>
                          <div className="h-32 w-full rounded-lg overflow-hidden mb-3 bg-muted">
                            <img src={branch.image || '/assets/hospital-1.jpg'} className="h-full w-full object-cover" alt="branch" />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> {branch.address}, {branch.city}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3"/> {branch.phone}</p>
                        </div>
                      ))}
                      {branches.length === 0 && <p className="text-muted-foreground py-4 col-span-2">No branches added yet.</p>}
                    </div>
                  </div>

                  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Branch Staff</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {branchStaff.map(staff => (
                        <div key={staff._id} className="p-4 bg-background/60 border border-border rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {staff.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{staff.name}</p>
                              <p className="text-xs text-muted-foreground">{staff.email}</p>
                              <Badge className="text-[10px] mt-1">{staff.branchId?.branchName || 'Unknown Branch'}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {branchStaff.length === 0 && <p className="text-muted-foreground py-4 col-span-2">No branch staff created yet.</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 h-fit shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Add New Branch</h3>
                    <form onSubmit={handleAddBranch} className="space-y-4">
                      <Input placeholder="Branch Name" value={branchForm.branchName} onChange={e => setBranchForm({...branchForm, branchName: e.target.value})} required />
                      <Input placeholder="City (e.g. Lucknow, Kanpur)" value={branchForm.city} onChange={e => setBranchForm({...branchForm, city: e.target.value})} required />
                      <Input placeholder="Address" value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})} required />
                      <Input placeholder="Phone Number" value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} required />
                      <Input type="file" accept="image/*" onChange={e => setBranchForm({...branchForm, image: e.target.files?.[0] || null})} required/>
                      <Button type="submit" className="w-full" disabled={branches.length >= 4}>
                        {branches.length >= 4 ? 'Max Branches Reached' : 'Add Branch'}
                      </Button>
                    </form>
                  </div>

                  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 h-fit shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Create Branch Staff</h3>
                    <form onSubmit={handleAddStaff} className="space-y-4">
                      <Input placeholder="Staff Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required />
                      <Input type="email" placeholder="Staff Email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} required />
                      <Input type="password" placeholder="Password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required />
                      <Select value={staffForm.branchId} onValueChange={val => setStaffForm({...staffForm, branchId: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(b => (
                            <SelectItem key={b._id} value={b._id}>{b.branchName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" className="w-full" disabled={branches.length === 0}>Create Staff Account</Button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-xl font-bold">Hospital Gallery</h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Input type="file" accept="image/*" multiple className="w-full sm:w-64" onChange={e => {
                      const files = Array.from(e.target.files || []);
                      const currentCount = Array.isArray(hospital?.gallery) ? hospital.gallery.length : 0;
                      const remaining = Math.max(0, 8 - currentCount);
                      if (files.length > remaining) {
                        toast({ title: 'Max 8 images', description: `Aap ${remaining} images aur add kar sakte ho.`, variant: 'destructive' });
                        setGalleryFiles(files.slice(0, remaining));
                        return;
                      }
                      setGalleryFiles(files);
                    }} />
                    <Button onClick={handleUploadGallery} isLoading={uploadingGallery} className="whitespace-nowrap">Upload Images</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {hospital?.gallery?.map((img: string, i: number) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-border bg-muted">
                      <img src={resolveAssetUrl(img)} alt="Gallery" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                  ))}
                  {(!hospital?.gallery || hospital.gallery.length === 0) && <p className="col-span-full text-center text-muted-foreground py-10">No images in gallery</p>}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Branding</h3>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="h-20 w-20 rounded-2xl border border-border bg-muted overflow-hidden">
                      {(hospital?.navbarIcon || hospital?.hospitalLogo) ? <img src={resolveAssetUrl(hospital.navbarIcon || hospital.hospitalLogo)} alt="logo" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input type="file" accept="image/*" onChange={(e) => setNavbarIconFile(e.target.files?.[0] || null)} />
                      <div className="flex gap-3">
                        <Button onClick={handleUpdateNavbarIcon} isLoading={savingNavbarIcon}>Save Navbar Icon</Button>
                        <Button variant="outline" onClick={() => setNavbarIconFile(null)} disabled={!navbarIconFile}>Cancel</Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ye icon website navbar ke right side profile icon me show hoga. Hospital card wala logo same rahega.
                      </p>
                      <div className="pt-2">
                        <Link to="/edit-profile">
                          <Button variant="outline">Edit Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approval</span>
                      <Badge className={hospital?.approvalStatus === 'approved' ? 'bg-success/10 text-success' : hospital?.approvalStatus === 'rejected' ? 'bg-destructive/15 text-destructive' : 'bg-amber-500/20 text-amber-600'}>
                        {hospital?.approvalStatus || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Branches</span>
                      <span className="text-sm font-medium">{branches.length}/4</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

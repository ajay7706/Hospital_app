import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Calendar, Users, Phone, Building2, Ambulance, User,
  Settings, Image as ImageIcon, Activity, ArrowRight,
  Search, Trash2, MapPin, AlertOctagon, Loader2,
  ShieldCheck, Users2, CheckCircle2, CalendarDays, XCircle, Navigation, Plus
} from 'lucide-react';
import GoogleMapPicker from '@/components/GoogleMapPicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'bg-green-100 text-green-700 border-green-200';
    case 'Waiting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Rescheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Not Selected':
    case 'Not Selected Today': return 'bg-red-100 text-red-700 border-red-200';
    case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const StatCard = ({ title, value, icon: Icon, trend, color = 'text-primary' }: {
  title: string; value: number; icon: any; trend: string; color?: string;
}) => (
  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
      <p className="text-xs text-muted-foreground mt-1">{trend}</p>
    </div>
    <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

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

  // Healthcare Features States
  const [govtSchemes, setGovtSchemes] = useState<string[]>([]);
  const [insurance, setInsurance] = useState({ accepted: false, providers: [] as string[] });
  const [labDetails, setLabDetails] = useState({ enabled: false, labName: '', sample_pickup: false, images: [] as string[] });
  const [medicalStore, setMedicalStore] = useState({ enabled: false, open_24_7: false, home_delivery: false, images: [] as string[] });
  const [customScheme, setCustomScheme] = useState('');
  const [customInsurance, setCustomInsurance] = useState('');
  const [labImages, setLabImages] = useState<File[]>([]);
  const [medicalImages, setMedicalImages] = useState<File[]>([]);
  const [savingFacilities, setSavingFacilities] = useState(false);
  const [services, setServices] = useState<{ title: string, description: string }[]>([]);

  // Forms States
  const [doctorForm, setDoctorForm] = useState({ name: '', email: '', password: '', specialization: '', experience: '', image: null as File | null });
  const [branchForm, setBranchForm] = useState({
    branchName: '', address: '', city: '', state: '', pincode: '',
    latitude: 20.5937, longitude: 78.9629,
    phone: '', specialties: '',
    ambulanceAvailable: false, emergency24x7: false, image: null as File | null,
    opdChargeType: 'hospitalDefault', opdCharge: ''
  });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', branchId: '' });

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [navbarIconFile, setNavbarIconFile] = useState<File | null>(null);
  const [savingNavbarIcon, setSavingNavbarIcon] = useState(false);

  // Individual Action Loading States
  const [processingDoctor, setProcessingDoctor] = useState(false);
  const [processingBranch, setProcessingBranch] = useState(false);
  const [processingStaff, setProcessingStaff] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<string | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null);
  const [branchMapOpen, setBranchMapOpen] = useState(false);

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

      // Sync healthcare features
      setGovtSchemes(hData.govtSchemes || []);
      setInsurance(hData.insurance || { accepted: false, providers: [] });
      setLabDetails(hData.labDetails || { enabled: false, labName: '', images: [] });
      setMedicalStore(hData.medicalStore || { enabled: false, images: [] });
      setServices(hData.services || []);

      // Fetch other data in parallel for speed
      const aUrl = selectedBranchFilter === 'all'
        ? `${API_BASE}/api/appointments/hospital`
        : `${API_BASE}/api/appointments/hospital?branchId=${selectedBranchFilter}`;

      const [aRes, dRes, bRes, eRes, sRes] = await Promise.all([
        fetch(aUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/doctors/${hData._id}`),
        fetch(`${API_BASE}/api/branches/${hData._id}`),
        fetch(`${API_BASE}/api/otp/emergency`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/auth/branch-staff`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (aRes.ok) {
        const aData = await aRes.json();
        setAppointments(Array.isArray(aData.appointments) ? aData.appointments : []);
        setStats(aData.stats);
      }
      if (dRes.ok) setDoctors(await dRes.json());
      if (bRes.ok) setBranches(await bRes.json());
      if (eRes.ok) setEmergencies(await eRes.json());
      if (sRes.ok) setBranchStaff(await sRes.json());

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingDoctor(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      formDataAppendObj(fd, doctorForm);
      const res = await fetch(`${API_BASE}/api/doctors/add`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Doctor added successfully' });
      setDoctorForm({ name: '', email: '', password: '', specialization: '', experience: '', image: null });
      fetchInitialData();

    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessingDoctor(false); }
  };

  const handleDeleteDoctor = async (id: string) => {
    setDeletingDoctor(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/doctors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Doctor removed' });
      await fetchInitialData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setDeletingDoctor(null); }
  };

  const [isBranchLocationSelected, setIsBranchLocationSelected] = useState(false);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBranchLocationSelected) {
      toast({
        title: 'Branch Location Required',
        description: 'Please select the branch location on the map and confirm.',
        variant: 'destructive'
      });
      setBranchMapOpen(true);
      return;
    }

    setProcessingBranch(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      formDataAppendObj(fd, branchForm);
      const res = await fetch(`${API_BASE}/api/branches/add`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Branch added successfully' });
      setBranchForm({
        branchName: '', address: '', city: '', state: '', pincode: '',
        latitude: 20.5937, longitude: 78.9629,
        phone: '', specialties: '',
        ambulanceAvailable: false, emergency24x7: false, image: null,
        opdChargeType: 'hospitalDefault', opdCharge: ''
      });
      setIsBranchLocationSelected(false);
      fetchInitialData();

    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessingBranch(false); }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingStaff(true);
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
    finally { setProcessingStaff(false); }
  };

  const formDataAppendObj = (fd: FormData, obj: any) => {
    Object.keys(obj).forEach(key => { if (obj[key] !== null) fd.append(key, obj[key]); });
  };

  const handleDeleteBranch = async (id: string) => {
    setDeletingBranch(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/branches/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Branch removed' });
      await fetchInitialData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingBranch(null);
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

  const handleUpdateFacilities = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFacilities(true);
    try {
      const fd = new FormData();
      fd.append('govtSchemes', JSON.stringify(govtSchemes));
      fd.append('insurance', JSON.stringify(insurance));
      fd.append('labDetails', JSON.stringify(labDetails));
      fd.append('medicalStore', JSON.stringify(medicalStore));
      fd.append('services', JSON.stringify(services));

      fd.append('existingLabImages', JSON.stringify(labDetails.images));
      fd.append('existingMedicalImages', JSON.stringify(medicalStore.images));

      labImages.forEach(img => fd.append('labImages', img));
      medicalImages.forEach(img => fd.append('medicalImages', img));

      const res = await fetch(`${API_BASE}/api/hospitals/update`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      toast({ title: 'Facilities updated successfully' });
      setLabImages([]);
      setMedicalImages([]);
      fetchInitialData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingFacilities(false);
    }
  };

  const removeFacilityImage = (type: 'lab' | 'medical', index: number) => {
    if (type === 'lab') {
      const newImages = [...labDetails.images];
      newImages.splice(index, 1);
      setLabDetails({ ...labDetails, images: newImages });
    } else {
      const newImages = [...medicalStore.images];
      newImages.splice(index, 1);
      setMedicalStore({ ...medicalStore, images: newImages });
    }
  };

  const handleStatusUpdate = async (id: string, status: string, type: 'appointment' | 'emergency', doctorId?: string, actionType?: string) => {
    const loadingKey = actionType ? id + actionType : id;
    setUpdatingStatus(loadingKey);
    try {
      const token = localStorage.getItem('token');
      const url = type === 'appointment'
        ? `${API_BASE}/api/appointments/update/${id}`
        : `${API_BASE}/api/otp/emergency/${id}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, doctorId })
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Marked as ${status}` });

        // Update state instantly (NO reload)
        if (type === 'appointment') {
          setAppointments(prev => prev.map(a => a._id === id ? { ...a, ...data.appointment } : a));
        } else {
          setEmergencies(prev => prev.map(e => e._id === id ? { ...e, status } : e));
        }
        return;
      }
      toast({ title: 'Error', description: await readErrorMessage(res), variant: 'destructive' });
    } catch (err) { console.error(err); }
    finally { setUpdatingStatus(null); }
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
    <>
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
            <SidebarItem icon={CheckCircle2} label="Facilities" id="facilities" />
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
                  <img src={resolveAssetUrl(hospital.navbarIcon || hospital.hospitalLogo)} alt="logo" className="h-full w-full object-cover" />
                ) : null}
              </div>
            </div>
          </header>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">

              {activeTab === 'dashboard' && (
                <>
                  {/* Stats Grid */}
                  <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Appointments" value={stats?.total || 0} icon={Calendar} trend="+12% from last month" />
                    <StatCard title="Pending Queue" value={stats?.waiting || 0} icon={Users2} trend="Awaiting approval" color="text-yellow-600" />
                    <StatCard title="Confirmed Today" value={stats?.confirmed || 0} icon={ShieldCheck} trend="Active today" color="text-green-600" />
                    <StatCard title="Emergency cases" value={stats?.emergency || 0} icon={AlertOctagon} trend="High priority" color="text-red-600" />
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
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-sm">{apt.patientName}</span>
                                  {apt.type === 'Emergency' && <AlertOctagon className="h-3.5 w-3.5 text-red-500" />}
                                </div>
                                <span className="text-xs text-muted-foreground">Token #{apt.tokenNumber || '—'} • {apt.time}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn(getStatusColor(apt.status))}>
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
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="pb-3 font-medium">Patient</th>
                          <th className="pb-3 font-medium">Problem</th>
                          <th className="pb-3 font-medium">Branch</th>
                          <th className="pb-3 font-medium">Date & Token</th>
                          <th className="pb-3 font-medium">Status / Doctor</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {appointments.map((apt: any) => (
                          <tr key={apt._id} className={`hover:bg-muted/20 transition-colors ${apt.type === 'Emergency' ? 'bg-red-50/30' : ''}`}>
                            <td className="py-3">
                              <p className="font-semibold">{apt.patientName}</p>
                              <p className="text-xs text-muted-foreground">{apt.phone}</p>
                            </td>
                            <td className="py-3">
                              <p className="text-xs max-w-[120px] truncate" title={apt.problem}>{apt.problem || '—'}</p>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {apt.branchId?.branchName || <span className="text-primary text-xs font-medium">Main Hospital</span>}
                            </td>
                            <td className="py-3">
                              <p>{apt.date}</p>
                              <p className="text-xs text-muted-foreground font-mono">Token #{apt.tokenNumber || '—'}</p>
                              <Badge variant="secondary" className="text-[9px] mt-1 h-4">{apt.type}</Badge>
                            </td>
                            <td className="py-3">
                              <Badge variant="outline" className={cn(getStatusColor(apt.status), "mb-1")}>
                                {apt.status === "Confirmed" ? "Approved" : apt.status}
                              </Badge>
                              {apt.assignedDoctorName && (
                                <p className="text-[10px] text-primary font-bold">Dr. {apt.assignedDoctorName}</p>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2 px-1">
                                {apt.status === "Waiting" || apt.status === "Rescheduled" ? (
                                  <>
                                    <div className="flex flex-col gap-1 items-end">
                                      <select
                                        id={`doc-select-${apt._id}`}
                                        className="h-8 text-[10px] border rounded bg-background px-1"
                                        defaultValue=""
                                        disabled={!!apt.branchId}
                                      >
                                        <option value="">Select Doctor</option>
                                        {doctors
                                          .filter(d => (!apt.branchId && !d.branchId) || (apt.branchId?._id === String(d.branchId)))
                                          .map(d => (
                                            <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
                                          ))
                                        }
                                      </select>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const select = document.getElementById(`doc-select-${apt._id}`) as HTMLSelectElement;
                                          handleStatusUpdate(apt._id, 'Confirmed', 'appointment', select.value, 'approve');
                                        }}
                                        disabled={updatingStatus !== null || !!apt.branchId || (stats?.confirmed || 0) >= 200}
                                        className="h-8 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold"
                                      >
                                        {updatingStatus === (apt._id + 'approve') ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                                        {apt.branchId ? 'Branch Appt' : 'Approve & Assign'}
                                      </Button>
                                    </div>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleStatusUpdate(apt._id, 'Rescheduled', 'appointment', undefined, 'reschedule')}
                                      disabled={updatingStatus !== null || !!apt.branchId || (stats?.confirmed || 0) >= 200}
                                      className="h-8 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                      {updatingStatus === (apt._id + 'reschedule') ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5 mr-1" />}
                                      Next Day
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleStatusUpdate(apt._id, 'Not Selected', 'appointment', undefined, 'reject')}
                                      disabled={updatingStatus !== null || !!apt.branchId}
                                      className="h-8 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                      {updatingStatus === (apt._id + 'reject') ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                                      Reject
                                    </Button>
                                  </>
                                ) : apt.status === "Confirmed" ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleStatusUpdate(apt._id, 'Rescheduled', 'appointment')}
                                    disabled={updatingStatus === apt._id || !!apt.branchId || (stats?.confirmed || 0) >= 200}
                                    className="h-8 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                                  >
                                    {updatingStatus === apt._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5 mr-1" />}
                                    Next Day
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">Processed</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {appointments.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No appointments found.</td></tr>}
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
                            <p className="font-bold text-lg leading-none mb-1">Emergency Request</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={`text-[10px] ${em.branchId ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                {em.branchId ? (branches.find(b => b._id === em.branchId)?.branchName || 'Branch Alert') : 'MAIN HOSPITAL'}
                              </Badge>
                              <span className="text-sm font-bold text-foreground">{em.phone}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Requested: {new Date(em.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          {em.status === 'pending' ? (
                            <>
                              <Button
                                className="flex-1 md:flex-none"
                                onClick={() => handleStatusUpdate(em._id, 'accepted', 'emergency')}
                                disabled={!!em.branchId}
                                isLoading={updatingStatus === em._id}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 md:flex-none"
                                onClick={() => handleStatusUpdate(em._id, 'rejected', 'emergency')}
                                disabled={!!em.branchId}
                                isLoading={updatingStatus === em._id}
                              >
                                Reject
                              </Button>
                              {!!em.branchId && (
                                <span className="text-[10px] text-muted-foreground block mt-1">Branch Alert (View Only)</span>
                              )}
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
                              {doc.image ? <img src={resolveAssetUrl(doc.image)} className="h-full w-full object-cover" alt={doc.name} /> : <User className="h-full w-full p-2 text-muted-foreground" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Dr. {doc.name}</p>
                              <p className="text-xs text-primary">{doc.specialization}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDoctor(doc._id)} isLoading={deletingDoctor === doc._id}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      {doctors.length === 0 && <p className="text-muted-foreground py-4 col-span-2">No doctors added yet.</p>}
                    </div>
                  </div>
                  <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 h-fit shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Add New Doctor</h3>
                    <form onSubmit={handleAddDoctor} className="space-y-4">
                      <Input placeholder="Doctor Name" value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })} required />
                      <Input type="email" placeholder="Doctor Email (for login)" value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} required />
                      <Input type="password" placeholder="Login Password" value={doctorForm.password} onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })} required />
                      <Input placeholder="Specialization (e.g. Cardiologist)" value={doctorForm.specialization} onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })} required />
                      <Input type="number" placeholder="Experience (Years)" value={doctorForm.experience} onChange={e => setDoctorForm({ ...doctorForm, experience: e.target.value })} />
                      <Input type="file" accept="image/*" onChange={e => setDoctorForm({ ...doctorForm, image: e.target.files?.[0] || null })} />
                      <Button type="submit" className="w-full" isLoading={processingDoctor}>Add Doctor</Button>
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
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBranch(branch._id)} isLoading={deletingBranch === branch._id}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            <div className="h-32 w-full rounded-lg overflow-hidden mb-3 bg-muted">
                              <img src={branch.image || '/assets/hospital-1.jpg'} className="h-full w-full object-cover" alt="branch" />
                            </div>
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {branch.address}, {branch.city}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {branch.phone}</p>
                            {branch.specialties && (
                              <p className="text-[10px] text-primary font-medium mt-1 truncate">{branch.specialties}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {branch.ambulanceAvailable && (
                                <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center text-red-600" title="Ambulance Available">
                                  <Ambulance className="h-4 w-4" />
                                </div>
                              )}
                              {branch.emergency24x7 && (
                                <div className="h-6 w-6 rounded bg-amber-100 flex items-center justify-center text-amber-600" title="24/7 Emergency">
                                  <Activity className="h-4 w-4" />
                                </div>
                              )}
                              {branch.labDetails?.enabled && (
                                <div className="h-6 w-6 rounded bg-purple-100 flex items-center justify-center text-purple-600" title="Lab Facility Available">
                                  <Activity className="h-4 w-4 text-purple-600" />
                                </div>
                              )}
                              {branch.medicalStore?.enabled && (
                                <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center text-blue-600" title="Medical Store Available">
                                  <Activity className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {branches.length === 0 && <p className="text-muted-foreground py-4 col-span-2">No branches added yet.</p>}
                      </div>
                    </div>

                    <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Branch Staff Accounts</h3>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {branchStaff.length} Staff Members
                        </Badge>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {branchStaff.map(staff => (
                          <div key={staff._id} className="p-4 bg-background/60 border border-border rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 group-hover:scale-110 transition-transform">
                                {staff.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{staff.name}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight mb-1">{staff.email}</p>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-2 w-2 text-primary" />
                                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                                    {staff.branchId?.branchName || 'Main Hospital Staff'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-success animate-pulse" title="Active Account" />
                          </div>
                        ))}
                        {branchStaff.length === 0 && (
                          <div className="col-span-2 py-10 text-center flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground opacity-30" />
                            <p className="text-muted-foreground text-sm italic">No branch staff created yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 h-fit shadow-sm">
                      <h3 className="text-xl font-bold mb-6">Add New Branch</h3>
                      <form onSubmit={handleAddBranch} className="space-y-4">
                        <Input placeholder="Branch Name" value={branchForm.branchName} onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })} required />

                        <div className="p-3 border border-dashed border-primary/30 rounded-xl bg-primary/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Branch Location</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-bold border-primary/20 text-primary hover:bg-primary/10"
                              onClick={() => setBranchMapOpen(true)}
                            >
                              <Navigation className="h-3 w-3 mr-1" /> Select on Map
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">City</label>
                              <Input placeholder="City" value={branchForm.city} readOnly className="h-8 text-xs bg-background/50" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Pincode</label>
                              <Input placeholder="Pincode" value={branchForm.pincode} readOnly className="h-8 text-xs bg-background/50" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Full Address</label>
                            <Input placeholder="Select location to auto-fill address" value={branchForm.address} readOnly className="h-8 text-xs bg-background/50" />
                          </div>
                        </div>

                        <Input placeholder="Phone Number" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} required />
                        <Input placeholder="Specialties (e.g. Heart, Eye)" value={branchForm.specialties} onChange={e => setBranchForm({ ...branchForm, specialties: e.target.value })} />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 border border-border p-2 rounded-lg">
                            <Checkbox id="amb" checked={branchForm.ambulanceAvailable} onCheckedChange={(val) => setBranchForm({ ...branchForm, ambulanceAvailable: !!val })} />
                            <label htmlFor="amb" className="text-xs cursor-pointer flex items-center gap-1">
                              <Ambulance className="h-3 w-3 text-red-500" /> Ambulance
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 border border-border p-2 rounded-lg">
                            <Checkbox id="emerg" checked={branchForm.emergency24x7} onCheckedChange={(val) => setBranchForm({ ...branchForm, emergency24x7: !!val })} />
                            <label htmlFor="emerg" className="text-xs cursor-pointer flex items-center gap-1">
                              <Activity className="h-3 w-3 text-amber-500" /> Emergency
                            </label>
                          </div>
                        </div>

                        <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">OPD Charge Settings</p>
                          <Select value={branchForm.opdChargeType} onValueChange={val => setBranchForm({ ...branchForm, opdChargeType: val })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Charge Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hospitalDefault">Use Hospital Default (₹{hospital?.opdCharge || 0})</SelectItem>
                              <SelectItem value="custom">Custom Branch Charge</SelectItem>
                            </SelectContent>
                          </Select>

                          {branchForm.opdChargeType === 'custom' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Input type="number" placeholder="Custom OPD Charge (₹)" value={branchForm.opdCharge} onChange={e => setBranchForm({ ...branchForm, opdCharge: e.target.value })} required className="bg-background mt-2" />
                            </motion.div>
                          )}
                        </div>

                        <Input type="file" accept="image/*" onChange={e => setBranchForm({ ...branchForm, image: e.target.files?.[0] || null })} required />

                        <Button type="submit" className="w-full" disabled={branches.length >= 4} isLoading={processingBranch}>
                          {branches.length >= 4 ? 'Max Branches Reached' : 'Add Branch'}
                        </Button>
                      </form>
                    </div>

                    <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 h-fit shadow-sm">
                      <h3 className="text-xl font-bold mb-6">Create Branch Staff</h3>
                      <form onSubmit={handleAddStaff} className="space-y-4">
                        <Input placeholder="Staff Name" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} required />
                        <Input type="email" placeholder="Staff Email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
                        <Input type="password" placeholder="Password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required />
                        <Select value={staffForm.branchId} onValueChange={val => setStaffForm({ ...staffForm, branchId: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map(b => (
                              <SelectItem key={b._id} value={b._id}>{b.branchName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="submit" className="w-full" disabled={branches.length === 0} isLoading={processingStaff}>Create Staff Account</Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'facilities' && (
                <div className="bg-card/70 backdrop-blur border border-border rounded-2xl p-6 shadow-sm max-w-4xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Healthcare Facilities & Services</h3>
                    <Button onClick={handleUpdateFacilities} disabled={savingFacilities}>
                      {savingFacilities ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>

                  <div className="space-y-8">
                    {/* Govt Schemes */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Govt Schemes Accepted</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          "Ayushman Bharat (PM-JAY)",
                          "Ayushman Vay Vandana (70+)",
                          "CGHS",
                          "ESIC",
                          "State Health Scheme",
                          "BPL Scheme",
                          "Jan Arogya Yojana",
                          "Rashtriya Swasthya Bima Yojana (RSBY)"
                        ].map(scheme => (
                          <label key={scheme} className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <Checkbox
                              checked={govtSchemes.includes(scheme)}
                              onCheckedChange={(checked) => {
                                if (checked) setGovtSchemes([...govtSchemes, scheme]);
                                else setGovtSchemes(govtSchemes.filter(s => s !== scheme));
                              }}
                            />
                            <span className="text-xs">{scheme}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 max-w-md">
                        <Input placeholder="+ Add Other Scheme" value={customScheme} onChange={e => setCustomScheme(e.target.value)} className="h-9 text-xs" />
                        <Button size="sm" onClick={() => {
                          if (!customScheme) return;
                          if (!govtSchemes.some(s => s.toLowerCase() === customScheme.toLowerCase())) {
                            setGovtSchemes([...govtSchemes, customScheme]);
                          }
                          setCustomScheme('');
                        }}>Add</Button>
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Insurance Partners</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Accept Insurance?</span>
                          <Checkbox checked={insurance.accepted} onCheckedChange={(val) => setInsurance({ ...insurance, accepted: !!val })} />
                        </div>
                      </div>
                      {insurance.accepted && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              "Star Health",
                              "HDFC ERGO",
                              "ICICI Lombard",
                              "New India Assurance",
                              "Care Health Insurance"
                            ].map(provider => (
                              <label key={provider} className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                <Checkbox
                                  checked={insurance.providers.includes(provider)}
                                  onCheckedChange={(checked) => {
                                    if (checked) setInsurance({ ...insurance, providers: [...insurance.providers, provider] });
                                    else setInsurance({ ...insurance, providers: insurance.providers.filter(p => p !== provider) });
                                  }}
                                />
                                <span className="text-xs">{provider}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2 max-w-md">
                            <Input placeholder="+ Add Other Provider" value={customInsurance} onChange={e => setCustomInsurance(e.target.value)} className="h-9 text-xs" />
                            <Button size="sm" onClick={() => {
                              if (!customInsurance) return;
                              if (!insurance.providers.some(p => p.toLowerCase() === customInsurance.toLowerCase())) {
                                setInsurance({ ...insurance, providers: [...insurance.providers, customInsurance] });
                              }
                              setCustomInsurance('');
                            }}>Add</Button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Lab */}
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Lab & Diagnostics</h4>
                        <Checkbox checked={labDetails.enabled} onCheckedChange={(val) => setLabDetails({ ...labDetails, enabled: !!val })} />
                      </div>
                      {labDetails.enabled && (
                        <div className="space-y-4">
                          <Input placeholder="Lab Name (e.g. Apollo Lab Center)" value={labDetails.labName} onChange={e => setLabDetails({ ...labDetails, labName: e.target.value })} />
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="sample_pickup" 
                              checked={labDetails.sample_pickup} 
                              onCheckedChange={(val) => setLabDetails({ ...labDetails, sample_pickup: !!val })} 
                            />
                            <label htmlFor="sample_pickup" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Home Sample Pickup Available
                            </label>
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Current Images</label>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                              {labDetails.images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg border bg-muted overflow-hidden group">
                                  <img src={resolveAssetUrl(img)} className="h-full w-full object-cover" />
                                  <button
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    onClick={() => removeFacilityImage('lab', i)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <Input type="file" multiple accept="image/*" onChange={e => setLabImages(Array.from(e.target.files || []))} className="mt-2" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Medical Store */}
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider">In-house Medical Store</h4>
                        <Checkbox checked={medicalStore.enabled} onCheckedChange={(val) => setMedicalStore({ ...medicalStore, enabled: !!val })} />
                      </div>
                      {medicalStore.enabled && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="open_24_7" 
                                checked={medicalStore.open_24_7} 
                                onCheckedChange={(val) => setMedicalStore({ ...medicalStore, open_24_7: !!val })} 
                              />
                              <label htmlFor="open_24_7" className="text-xs font-medium leading-none">
                                Open 24/7
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="home_delivery" 
                                checked={medicalStore.home_delivery} 
                                onCheckedChange={(val) => setMedicalStore({ ...medicalStore, home_delivery: !!val })} 
                              />
                              <label htmlFor="home_delivery" className="text-xs font-medium leading-none">
                                Home Delivery Available
                              </label>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Current Images</label>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                              {medicalStore.images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg border bg-muted overflow-hidden group">
                                  <img src={resolveAssetUrl(img)} className="h-full w-full object-cover" />
                                  <button
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    onClick={() => removeFacilityImage('medical', i)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <Input type="file" multiple accept="image/*" onChange={e => setMedicalImages(Array.from(e.target.files || []))} className="mt-2" />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Services Management */}
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Hospital Services</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setServices([...services, { title: '', description: '' }])}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Service
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.map((svc, i) => (
                          <div key={i} className="p-4 border rounded-xl bg-background/50 space-y-3 relative group">
                            <button
                              type="button"
                              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                              onClick={() => setServices(services.filter((_, index) => index !== i))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Service Title</label>
                              <Input
                                placeholder="e.g. Cardiology"
                                value={svc.title}
                                onChange={e => {
                                  const newSvcs = [...services];
                                  newSvcs[i].title = e.target.value;
                                  setServices(newSvcs);
                                }}
                                className="h-9 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Description</label>
                              <Textarea
                                placeholder="Brief description..."
                                value={svc.description}
                                onChange={e => {
                                  const newSvcs = [...services];
                                  newSvcs[i].description = e.target.value;
                                  setServices(newSvcs);
                                }}
                                className="min-h-[60px] text-xs resize-none"
                              />
                            </div>
                          </div>
                        ))}
                        {services.length === 0 && (
                          <div className="col-span-full py-8 text-center border border-dashed rounded-xl text-muted-foreground text-xs italic">
                            No services added yet. Click "Add Service" to get started.
                          </div>
                        )}
                      </div>
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

      <Dialog open={branchMapOpen} onOpenChange={setBranchMapOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[2rem]">
          <DialogHeader className="p-6 bg-white border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Select Branch Location
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50">
            <GoogleMapPicker
              initialLocation={{
                lat: branchForm.latitude || 20.5937,
                lng: branchForm.longitude || 78.9629
              }}
              onLocationSelect={(loc) => {
                setIsBranchLocationSelected(true);
                setBranchForm(prev => ({
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
                onClick={() => setBranchMapOpen(false)}
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

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Search,
  MapPin,
  Clock,
  Users,
  FileText,
  Plus,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const [pendingRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/hospital/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setHospitals(data);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      
      const res = await fetch(`${API_BASE}/api/admin/hospital/${id}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchAdminData();
        
        toast({
          title: `Hospital ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          description: `The hospital has been ${status} successfully.`,
          variant: status === 'approved' ? 'default' : 'destructive',
        });
      } else {
        const errorData = await res.json();
        toast({
          title: 'Update failed',
          description: errorData.msg || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Update failed:', err);
      toast({
        title: 'Network Error',
        description: 'Failed to connect to the server.',
        variant: 'destructive',
      });
    }
  };

  const statCards = [
    { label: 'Total Hospitals', value: stats?.totalHospitals || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approved', value: stats?.approvedHospitals || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: stats?.pendingHospitals || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Appointments', value: stats?.totalAppointments || 0, icon: FileText, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Incomplete Setup', value: stats?.incompleteHospitals || 0, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">System Overview & Management</p>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Stats Grid */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border border-border p-4 shadow-sm ${card.bg}`}
            >
              <card.icon className={`mb-2 h-5 w-5 ${card.color}`} />
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Pending Approvals Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Pending Approvals ({hospitals.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="py-10 text-center">Loading...</TableCell></TableRow>
                  ) : hospitals.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">No pending approvals.</TableCell></TableRow>
                  ) : (
                    hospitals.map((h) => (
                      <TableRow key={h._id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            {h.hospitalLogo && (
                              <img src={h.hospitalLogo} className="h-8 w-8 rounded-full object-cover border" alt="logo" />
                            )}
                            {h.hospitalName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {h.city}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-green-600 text-green-600 hover:bg-green-50 h-8"
                              onClick={() => handleUpdateStatus(h._id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-destructive text-destructive hover:bg-destructive/5 h-8"
                              onClick={() => handleUpdateStatus(h._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {/* Newly Added Hospitals List */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Recently Added (7 Days)</h2>
            <div className="space-y-4">
              {stats?.newHospitals?.length > 0 ? (
                stats.newHospitals.map((h: any) => (
                  <div key={h._id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">{h.hospitalName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${h.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {h.approvalStatus}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No new hospitals this week.</p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

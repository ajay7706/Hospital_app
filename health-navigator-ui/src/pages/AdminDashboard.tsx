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
  Clock
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingHospitals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/admin/hospital/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingHospitals();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      // Fix: Match backend routes (/approve or /reject)
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      
      const res = await fetch(`${API_BASE}/api/admin/hospital/${id}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Refetch hospitals to ensure UI is in sync with backend
        fetchPendingHospitals();
        
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
              <p className="text-sm text-muted-foreground">Manage Hospital Approvals</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Pending Approvals ({hospitals.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital Name</TableHead>
                  <TableHead>Admin Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading...</TableCell></TableRow>
                ) : hospitals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No pending approvals.</TableCell></TableRow>
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
                      <TableCell>{h.adminName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {h.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">{h.officialEmail}</div>
                        <div className="text-xs text-muted-foreground">{h.contactNumber}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(h._id, 'approved')}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-destructive text-destructive hover:bg-destructive/5"
                            onClick={() => handleUpdateStatus(h._id, 'rejected')}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Reject
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
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

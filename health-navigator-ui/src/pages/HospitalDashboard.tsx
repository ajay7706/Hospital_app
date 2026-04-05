import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Phone,
  Building2,
  ChevronDown,
  Ambulance,
  XCircle,
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
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Approved: 'bg-primary/10 text-primary',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const HospitalDashboard = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [hospitalName, setHospitalName] = useState('Your Hospital');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

        // Get hospital name from localStorage
        const hospitalProfile = JSON.parse(localStorage.getItem('hospitalProfile') || '{}');
        if (hospitalProfile.hospitalName) {
          setHospitalName(hospitalProfile.hospitalName);
        }

        const res = await fetch(`${API_BASE}/api/appointments/hospital`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

      const res = await fetch(`${API_BASE}/api/appointments/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Refetch to update everything in real-time
        const fetchDashboardData = async () => {
          try {
            const res = await fetch(`${API_BASE}/api/appointments/hospital`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
              setStats(data.stats);
            }
          } catch (err) { console.error(err); }
        };
        fetchDashboardData();

        toast({
          title: `Status Updated`,
          description: `Appointment marked as ${newStatus}.`,
        });
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filtered =
    statusFilter === 'All'
      ? appointments
      : appointments.filter((a) => a.status?.toLowerCase() === statusFilter.toLowerCase());

  const summaryCards = [
    {
      label: 'Total Patients',
      value: stats?.total || 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: "Today's",
      value: stats?.today || 0,
      icon: Calendar,
      color: 'text-cta',
      bg: 'bg-cta/10',
    },
    {
      label: "Yesterday's",
      value: stats?.yesterday || 0,
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: 'Pending',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
    },
    {
      label: 'Approved',
      value: stats?.approved || 0,
      icon: CheckCircle2,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 md:py-14">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">{hospitalName}</h1>
                <p className="text-sm text-muted-foreground">Hospital Dashboard</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/profile">
                <Button variant="outline" size="default" className="gap-2">
                  <Users className="h-4 w-4" />
                  View Profile
                </Button>
              </Link>
              <Link to="/book">
                <Button variant="cta" size="default" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Manage Bookings
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-3"
        >
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card shadow-sm"
        >
          {/* Table Header */}
          <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Appointments</h2>
            </div>
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {['All', 'Pending', 'Approved', 'Completed'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Ambulance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No appointments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((appt, idx) => (
                    <TableRow key={appt._id || appt.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{appt.patientName}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {appt.phone}
                        </span>
                      </TableCell>
                      <TableCell>
                        {appt.ambulanceRequired ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                            <XCircle className="h-3 w-3" /> No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">{appt.date}</TableCell>
                      <TableCell className="text-foreground">{appt.time}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${appt.status ? (statusStyles[appt.status.charAt(0).toUpperCase() + appt.status.slice(1)] || '') : ''}`}
                        >
                          {appt.status || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {appt.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-primary text-primary hover:bg-primary/10"
                              onClick={() => handleStatusUpdate(appt._id, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {appt.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-green-600 text-green-600 hover:bg-green-50"
                              onClick={() => handleStatusUpdate(appt._id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          {appt.status === 'completed' && (
                            <span className="text-xs text-muted-foreground py-2">No actions</span>
                          )}
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

export default HospitalDashboard;

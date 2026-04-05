import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  FileText,
  Edit,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const HospitalProfile = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<any>(null);

  useEffect(() => {
    const fetchHospitalProfile = async () => {
      const user = localStorage.getItem('user');
      if (!user) {
        navigate('/login');
        return;
      }
      const parsed = JSON.parse(user);
      if (parsed.role !== 'hospital') {
        navigate('/');
        return;
      }

      // Try to fetch from backend first to get fresh data
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/api/hospitals/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHospital(data);
          localStorage.setItem('hospitalProfile', JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.error("Failed to fetch hospital profile:", err);
      }

      // Fallback to localStorage
      const profile = localStorage.getItem('hospitalProfile');
      if (profile) {
        setHospital(JSON.parse(profile));
      }
    };

    fetchHospitalProfile();
  }, [navigate]);

  if (!hospital) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="text-muted-foreground">No hospital profile found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const infoItems = [
    { icon: MapPin, label: 'Address', value: hospital.city || 'Not provided' },
    { icon: Mail, label: 'Email', value: hospital.officialEmail || 'Not provided' },
    { icon: Phone, label: 'Phone', value: hospital.contactNumber || 'Not provided' },
    {
      icon: Calendar,
      label: 'Working Days',
      value: hospital.workingDays?.length ? hospital.workingDays.join(', ') : 'Not set',
    },
    {
      icon: Clock,
      label: 'Timing',
      value:
        hospital.openTime && hospital.closeTime
          ? `${hospital.openTime} – ${hospital.closeTime}`
          : 'Not set',
    },
  ];

  const initials = hospital.hospitalName
    ? hospital.hospitalName.slice(0, 2).toUpperCase()
    : 'H';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        {/* Back */}
        <button
          onClick={() => navigate('/hospital-dashboard')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-primary/5 px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                {hospital.hospitalLogo ? (
                  <AvatarImage src={hospital.hospitalLogo} alt={hospital.hospitalName} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold text-foreground">{hospital.hospitalName}</h1>
                <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {hospital.city || 'Location not set'}
                </p>
                {hospital.emergencyAvailable && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <Shield className="h-3 w-3" />
                    24/7 Emergency Available
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                className="gap-2 shrink-0"
                onClick={() => navigate('/edit-profile')}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="divide-y divide-border">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-4 px-6 py-4 sm:px-8">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border-t border-border px-6 py-5 sm:px-8">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">About</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {hospital.aboutHospital || 'No description provided.'}
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default HospitalProfile;

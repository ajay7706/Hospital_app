import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const serviceSchema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().max(250, 'Max 250 characters').optional(),
});

const editSchema = z.object({
  hospitalName: z.string().min(2, 'Required'),
  adminName: z.string().min(2, 'Required'),
  contactNumber: z.string().min(10, 'Required'),
  emergencyContactNumber: z.string().min(10, 'Required'),
  officialEmail: z.string().email('Invalid email'),
  fullAddress: z.object({
    address: z.string().min(5, 'Required'),
    city: z.string().min(2, 'Required'),
    state: z.string().min(2, 'Required'),
    pincode: z.string().min(4, 'Required'),
  }),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  description: z.string().max(500, 'Max 500 characters').optional(),
  specialties: z.array(z.string().min(1, 'Required')).optional(),
  services: z.array(serviceSchema).optional(),
  ambulanceAvailable: z.boolean().default(false),
  emergency24x7: z.boolean().default(false),
  workingDays: z.array(z.string()).min(1, 'Select at least one day'),
  openingTime: z.string().min(1, 'Required'),
  closingTime: z.string().min(1, 'Required'),
  appointmentSlots: z.object({
    startTime: z.string().min(1, 'Required'),
    endTime: z.string().min(1, 'Required'),
  }),
});

type EditForm = z.infer<typeof editSchema>;

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [hospitalLogoFile, setHospitalLogoFile] = useState<File | null>(null);
  const [navbarIconFile, setNavbarIconFile] = useState<File | null>(null);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      hospitalName: '',
      adminName: '',
      contactNumber: '',
      emergencyContactNumber: '',
      officialEmail: '',
      fullAddress: { address: '', city: '', state: '', pincode: '' },
      location: { lat: 20.5937, lng: 78.9629 },
      description: '',
      specialties: [],
      services: [],
      ambulanceAvailable: false,
      emergency24x7: false,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      openingTime: '08:00',
      closingTime: '20:00',
      appointmentSlots: { startTime: '09:00', endTime: '17:00' },
    },
  });

  const servicesArray = useFieldArray<EditForm, 'services'>({ control: form.control, name: 'services' });
  // @ts-ignore
  const specialtiesArray = useFieldArray({ control: form.control, name: 'specialties' });

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== 'hospital') {
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/hospitals/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.msg || 'Failed to fetch profile');
        }
        const data = await res.json();
        localStorage.setItem('hospitalProfile', JSON.stringify(data));

        form.reset({
          hospitalName: data.hospitalName || '',
          adminName: data.adminName || '',
          contactNumber: data.contactNumber || '',
          emergencyContactNumber: data.emergencyContactNumber || '',
          officialEmail: data.officialEmail || '',
          fullAddress: data.fullAddress || { address: '', city: '', state: '', pincode: '' },
          location: data.location || { lat: 20.5937, lng: 78.9629 },
          description: data.description || '',
          specialties: Array.isArray(data.specialties) ? data.specialties : [],
          services: Array.isArray(data.services) ? data.services : [],
          ambulanceAvailable: Boolean(data.ambulanceAvailable),
          emergency24x7: Boolean(data.emergency24x7),
          workingDays: Array.isArray(data.workingDays) ? data.workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          openingTime: data.openingTime || '08:00',
          closingTime: data.closingTime || '20:00',
          appointmentSlots: data.appointmentSlots || { startTime: '09:00', endTime: '17:00' },
        });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [form, navigate]);

  const geocodeAddress = async (fullAddress: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        form.setValue('location.lat', parseFloat(lat), { shouldValidate: true });
        form.setValue('location.lng', parseFloat(lon), { shouldValidate: true });
        toast({ title: 'Location found!', description: `Map updated to ${fullAddress}` });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  useEffect(() => {
    const address = form.watch('fullAddress.address');
    const city = form.watch('fullAddress.city');
    const state = form.watch('fullAddress.state');
    
    if (address && city && state) {
      const fullAddress = `${address}, ${city}, ${state}`;
      const timer = setTimeout(() => geocodeAddress(fullAddress), 1500);
      return () => clearTimeout(timer);
    }
  }, [form.watch('fullAddress.address'), form.watch('fullAddress.city'), form.watch('fullAddress.state')]);

  const onSubmit = async (data: EditForm) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Login required');

      const fd = new FormData();
      fd.append('hospitalName', data.hospitalName);
      fd.append('adminName', data.adminName);
      fd.append('contactNumber', data.contactNumber);
      fd.append('emergencyContactNumber', data.emergencyContactNumber);
      fd.append('officialEmail', data.officialEmail);
      fd.append('description', data.description || '');
      fd.append('ambulanceAvailable', String(Boolean(data.ambulanceAvailable)));
      fd.append('emergency24x7', String(Boolean(data.emergency24x7)));
      fd.append('openingTime', data.openingTime);
      fd.append('closingTime', data.closingTime);
      fd.append('workingDays', JSON.stringify(data.workingDays || []));
      fd.append('fullAddress', JSON.stringify(data.fullAddress));
      fd.append('location', JSON.stringify(data.location));
      fd.append('appointmentSlots', JSON.stringify(data.appointmentSlots));
      fd.append('services', JSON.stringify(data.services || []));
      fd.append('specialties', (data.specialties || []).join(','));

      if (hospitalLogoFile) fd.append('hospitalLogo', hospitalLogoFile);
      if (navbarIconFile) fd.append('navbarIcon', navbarIconFile);

      const res = await fetch(`${API_BASE}/api/hospitals/update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.msg || 'Failed to update profile');
      }

      const result = await res.json();
      if (result?.hospital) localStorage.setItem('hospitalProfile', JSON.stringify(result.hospital));
      toast({ title: 'Profile updated' });
      navigate('/profile');
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const lat = form.watch('location.lat');
  const lng = form.watch('location.lng');
  const mapSrc = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}&hl=es;z=14&output=embed` : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Basic profile update karein. Doctors, branches, gallery, documents yaha include nahi hai.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Basic Info</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="hospitalName" render={({ field }) => (
                    <FormItem><FormLabel>Hospital Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="adminName" render={({ field }) => (
                    <FormItem><FormLabel>Admin Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="emergencyContactNumber" render={({ field }) => (
                    <FormItem><FormLabel>Emergency Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="officialEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="space-y-2">
                    <FormLabel>Logo upload</FormLabel>
                    <Input type="file" accept="image/*" onChange={(e) => setHospitalLogoFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <FormLabel>Navbar Icon</FormLabel>
                  <Input type="file" accept="image/*" onChange={(e) => setNavbarIconFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Address & Map</h2>
                <FormField control={form.control} name="fullAddress.address" render={({ field }) => (
                  <FormItem><FormLabel>Address *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField control={form.control} name="fullAddress.city" render={({ field }) => (
                    <FormItem><FormLabel>City *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fullAddress.state" render={({ field }) => (
                    <FormItem><FormLabel>State *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fullAddress.pincode" render={({ field }) => (
                    <FormItem><FormLabel>Pincode *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> Location
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)}>
                      Select Location on Map
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="location.lat" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Latitude</FormLabel>
                        <FormControl><Input value={String(field.value ?? '')} readOnly /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location.lng" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Longitude</FormLabel>
                        <FormControl><Input value={String(field.value ?? '')} readOnly /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  {mapSrc ? (
                    <div className="h-56 overflow-hidden rounded-lg border border-border bg-muted">
                      <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={mapSrc}></iframe>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">About</h2>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>About (max 500 chars)</FormLabel><FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Specialties</h2>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Editable list</p>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => specialtiesArray.append('')}>
                    <Plus className="h-4 w-4" /> Add Specialty
                  </Button>
                </div>
                {specialtiesArray.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No specialties added.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {specialtiesArray.fields.map((f, index) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`specialties.${index}`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => specialtiesArray.remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Services</h2>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Title + description (max 250 chars)</p>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => servicesArray.append({ title: '', description: '' })}>
                    <Plus className="h-4 w-4" /> Add Service
                  </Button>
                </div>
                {servicesArray.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services added.</p>
                ) : (
                  <div className="space-y-3">
                    {servicesArray.fields.map((f, index) => (
                      <div key={f.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Service #{index + 1}</p>
                          <Button type="button" variant="ghost" size="sm" onClick={() => servicesArray.remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField control={form.control} name={`services.${index}.title`} render={({ field }) => (
                            <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`services.${index}.description`} render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Availability</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="ambulanceAvailable" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="m-0 cursor-pointer">Ambulance Available</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="emergency24x7" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="m-0 cursor-pointer">24/7 Emergency</FormLabel>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Working Hours</h2>
                <FormField control={form.control} name="workingDays" render={() => (
                  <FormItem>
                    <FormLabel>Working Days *</FormLabel>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const selected = (form.watch('workingDays') || []).includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              const current = form.getValues('workingDays') || [];
                              form.setValue('workingDays', selected ? current.filter((d) => d !== day) : [...current, day], { shouldValidate: true });
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                              selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="openingTime" render={({ field }) => (
                    <FormItem><FormLabel>Opening Time *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="closingTime" render={({ field }) => (
                    <FormItem><FormLabel>Closing Time *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="appointmentSlots.startTime" render={({ field }) => (
                    <FormItem><FormLabel>Appointment From *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="appointmentSlots.endTime" render={({ field }) => (
                    <FormItem><FormLabel>Appointment To *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="cta"
                className="w-full" 
                size="lg" 
                isLoading={saving}
              >
                Save Profile Changes
              </Button>
            </form>
          </Form>
        </motion.div>
      </main>
      <Footer />

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Location on Map</DialogTitle>
          </DialogHeader>
          <div className="h-[420px] w-full overflow-hidden rounded-lg border border-border relative">
            <MapContainer 
              key={`${lat}-${lng}`}
              {...({
                center: [Number(lat) || 20.5937, Number(lng) || 78.9629],
                zoom: 13,
                style: { height: '100%', width: '100%' }
              } as any)}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker
                onPick={(a, b) => {
                  form.setValue('location.lat', Number(a), { shouldValidate: true });
                  form.setValue('location.lng', Number(b), { shouldValidate: true });
                }}
              />
              <Marker position={[Number(lat) || 20.5937, Number(lng) || 78.9629] as any} />
            </MapContainer>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMapOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditProfile;

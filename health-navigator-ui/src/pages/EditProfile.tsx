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
import { CheckCircle2, Loader2, MapPin, Plus, Trash2, Navigation } from 'lucide-react';
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
import GoogleMapPicker from '@/components/GoogleMapPicker';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const serviceSchema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().max(250, 'Max 250 characters').optional(),
});

const specialtySchema = z.object({
  value: z.string().min(1, 'Required'),
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
  specialties: z.array(specialtySchema).optional(),
  services: z.array(serviceSchema).optional(),
  ambulanceAvailable: z.boolean().default(false),
  emergency24x7: z.boolean().default(false),
  workingDays: z.array(z.string()).min(1, 'Select at least one day'),
  openingTime: z.string().min(1, 'Required'),
  closingTime: z.string().min(1, 'Required'),
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  opdCharge: z.string().min(1, 'Required'),
  gstNumber: z.string().optional(),
  labDetails: z.object({
    enabled: z.boolean().default(false),
    labName: z.string().optional(),
    images: z.array(z.string()).default([]),
  }).optional(),
  medicalStore: z.object({
    enabled: z.boolean().default(false),
    images: z.array(z.string()).default([]),
  }).optional(),
});


type EditForm = z.infer<typeof editSchema>;


const EditProfile = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [hospitalLogoFile, setHospitalLogoFile] = useState<File | null>(null);
  const [navbarIconFile, setNavbarIconFile] = useState<File | null>(null);
  const [gstDocumentFile, setGstDocumentFile] = useState<File | null>(null);
  const [labImages, setLabImages] = useState<File[]>([]);
  const [medicalImages, setMedicalImages] = useState<File[]>([]);


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
      startTime: '09:00',
      endTime: '18:00',
      opdCharge: '0',
      gstNumber: '',
      labDetails: { enabled: false, labName: '', images: [] },
      medicalStore: { enabled: false, images: [] },
    },
  });


  const servicesArray = useFieldArray<EditForm, 'services'>({ control: form.control, name: 'services' });
  const specialtiesArray = useFieldArray<EditForm, 'specialties'>({ control: form.control, name: 'specialties' });

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
          specialties: Array.isArray(data.specialties) ? data.specialties.map((s: any) => ({ value: typeof s === 'string' ? s : (s.value || '') })) : [],
          services: Array.isArray(data.services) ? data.services : [],
          ambulanceAvailable: Boolean(data.ambulanceAvailable),
          emergency24x7: Boolean(data.emergency24x7),
          workingDays: Array.isArray(data.workingDays) ? data.workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          openingTime: data.openingTime || '08:00',
          closingTime: data.closingTime || '20:00',
          startTime: data.appointmentSlots?.startTime || data.startTime || '09:00',
          endTime: data.appointmentSlots?.endTime || data.endTime || '18:00',
          opdCharge: String(data.opdCharge || 0),
          gstNumber: data.gstNumber || '',
          labDetails: data.labDetails || { enabled: false, labName: '', images: [] },
          medicalStore: data.medicalStore || { enabled: false, images: [] },
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

  const [isLocationSelected, setIsLocationSelected] = useState(true); // Default to true because they already have a location

  const onSubmit = async (data: EditForm) => {
    if (!isLocationSelected) {
      toast({ title: 'Location Required', description: 'Please select location on map.', variant: 'destructive' });
      setMapOpen(true);
      return;
    }
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
      fd.append('startTime', data.startTime);
      fd.append('endTime', data.endTime);
      fd.append('services', JSON.stringify(data.services || []));
      fd.append('specialties', (data.specialties || []).map(s => s.value).join(','));
      fd.append('opdCharge', data.opdCharge);
      fd.append('gstNumber', data.gstNumber || '');


      if (hospitalLogoFile) fd.append('hospitalLogo', hospitalLogoFile);
      if (navbarIconFile) fd.append('navbarIcon', navbarIconFile);
      if (gstDocumentFile) fd.append('gstDocument', gstDocumentFile);

      fd.append('labDetails', JSON.stringify(data.labDetails));
      fd.append('medicalStore', JSON.stringify(data.medicalStore));
      fd.append('existingLabImages', JSON.stringify(data.labDetails?.images || []));
      fd.append('existingMedicalImages', JSON.stringify(data.medicalStore?.images || []));

      labImages.forEach(img => fd.append('labImages', img));
      medicalImages.forEach(img => fd.append('medicalImages', img));


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
                <div className="rounded-lg border border-border p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> Hospital Location
                    </h3>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-bold border-primary/20 text-primary hover:bg-primary/5" onClick={() => setMapOpen(true)}>
                      <Navigation className="h-3 w-3 mr-1" /> Select Location on Map
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="location.lat" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-bold uppercase text-muted-foreground">Latitude</FormLabel>
                        <FormControl><Input value={String(field.value ?? '')} readOnly className="h-8 text-xs bg-white/50" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location.lng" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-bold uppercase text-muted-foreground">Longitude</FormLabel>
                        <FormControl><Input value={String(field.value ?? '')} readOnly className="h-8 text-xs bg-white/50" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
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
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => specialtiesArray.append({ value: '' })}>
                    <Plus className="h-4 w-4" /> Add Specialty
                  </Button>
                </div>
                {specialtiesArray.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No specialties added.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {specialtiesArray.fields.map((f, index) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`specialties.${index}.value`} render={({ field }) => (
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
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>Appointment Start Time *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem><FormLabel>Appointment End Time *</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                   Facilities (Lab & Medical)
                </h2>
                <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
                  {/* Lab */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base">Lab & Diagnostics</FormLabel>
                      <Checkbox 
                        checked={form.watch('labDetails.enabled')} 
                        onCheckedChange={(val) => form.setValue('labDetails.enabled', !!val)} 
                      />
                    </div>
                    {form.watch('labDetails.enabled') && (
                      <div className="space-y-4 pt-2">
                        <FormField control={form.control} name="labDetails.labName" render={({ field }) => (
                          <FormItem><FormLabel>Lab Name</FormLabel><FormControl><Input {...field} placeholder="Apollo Lab Center" /></FormControl></FormItem>
                        )} />
                        <div className="space-y-2">
                          <FormLabel className="text-xs">Existing Lab Images</FormLabel>
                          <div className="grid grid-cols-4 gap-2">
                            {form.watch('labDetails.images')?.map((img, i) => (
                              <div key={i} className="relative aspect-square rounded-lg border bg-muted overflow-hidden group">
                                <img src={img.startsWith('http') ? img : `${API_BASE}/${img}`} className="h-full w-full object-cover" />
                                <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm" onClick={() => {
                                  const current = form.getValues('labDetails.images') || [];
                                  form.setValue('labDetails.images', current.filter((_, idx) => idx !== i));
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <FormLabel className="text-xs mt-2 block">Upload New Images</FormLabel>
                          <Input type="file" multiple accept="image/*" onChange={e => setLabImages(Array.from(e.target.files || []))} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Medical Store */}
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base">In-house Medical Store</FormLabel>
                      <Checkbox 
                        checked={form.watch('medicalStore.enabled')} 
                        onCheckedChange={(val) => form.setValue('medicalStore.enabled', !!val)} 
                      />
                    </div>
                    {form.watch('medicalStore.enabled') && (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <FormLabel className="text-xs">Existing Medical Images</FormLabel>
                          <div className="grid grid-cols-4 gap-2">
                            {form.watch('medicalStore.images')?.map((img, i) => (
                              <div key={i} className="relative aspect-square rounded-lg border bg-muted overflow-hidden group">
                                <img src={img.startsWith('http') ? img : `${API_BASE}/${img}`} className="h-full w-full object-cover" />
                                <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm" onClick={() => {
                                  const current = form.getValues('medicalStore.images') || [];
                                  form.setValue('medicalStore.images', current.filter((_, idx) => idx !== i));
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <FormLabel className="text-xs mt-2 block">Upload New Images</FormLabel>
                          <Input type="file" multiple accept="image/*" onChange={e => setMedicalImages(Array.from(e.target.files || []))} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                   Billing & Legal System
                </h2>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-5 shadow-sm">
                  <FormField control={form.control} name="opdCharge" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-bold flex items-center gap-1.5 underline decoration-primary/30 underline-offset-4">
                        OPD Consultation Charge (₹) *
                      </FormLabel>
                      <FormControl><Input type="number" placeholder="e.g. 500" {...field} className="bg-background border-primary/20 focus:ring-primary/40 h-11 text-lg font-semibold" /></FormControl>
                      <p className="text-[11px] text-muted-foreground italic font-medium">Ye charge patients ko website ke Hospital Cards pe dikhaya jayega.</p>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField control={form.control} name="gstNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Hospital GST Number</FormLabel>
                        <FormControl><Input placeholder="Enter GSTIN" {...field} className="bg-background h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="space-y-2">
                       <FormLabel className="text-foreground font-medium">GST Document (PDF/Image)</FormLabel>
                       <Input type="file" accept="image/*,.pdf" onChange={(e) => setGstDocumentFile(e.target.files?.[0] || null)} className="bg-background h-11" />
                    </div>
                  </div>
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[2rem]">
          <DialogHeader className="p-6 bg-white border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Select Hospital Location
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50">
            <GoogleMapPicker 
              initialLocation={{ 
                lat: form.getValues().location.lat || 20.5937, 
                lng: form.getValues().location.lng || 78.9629 
              }}
              onLocationSelect={(loc) => {
                setIsLocationSelected(true);
                form.setValue('location.lat', loc.lat);
                form.setValue('location.lng', loc.lng);
                form.setValue('fullAddress.address', loc.address);
                form.setValue('fullAddress.city', loc.city);
                form.setValue('fullAddress.state', loc.state);
                form.setValue('fullAddress.pincode', loc.pincode);
              }}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="default" 
                className="rounded-full px-8 h-11 font-bold shadow-lg shadow-primary/20"
                onClick={() => setMapOpen(false)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditProfile;

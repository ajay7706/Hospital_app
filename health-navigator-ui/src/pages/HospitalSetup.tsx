import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, ArrowRight, ArrowLeft, MapPin, Plus, Trash2, CheckCircle2, Navigation
} from 'lucide-react';
import GoogleMapPicker from '@/components/GoogleMapPicker';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const serviceSchema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().max(250, 'Max 250 characters').optional(),
});

const step1Schema = z.object({
  hospitalName: z.string().min(2, 'Required'),
  adminName: z.string().min(2, 'Required'),
  city: z.string().min(2, 'Required'),
  contactNumber: z.string().min(10, 'Required'),
  officialEmail: z.string().email('Invalid email'),
  description: z.string().max(500).optional(),
  specialties: z.string().optional(),
  services: z.array(serviceSchema).optional(),
  ambulanceAvailable: z.boolean().default(false),
  emergency24x7: z.boolean().default(false),
  openingTime: z.string().min(1, 'Required'),
  closingTime: z.string().min(1, 'Required'),
  workingDays: z.array(z.string()).min(1, 'Select at least one day'),
});

const step2Schema = z.object({
  hospitalLicenseNumber: z.string().min(6, 'License number must be at least 6 characters'),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter valid GST number'),
  emergencyContactNumber: z.string().min(10, 'Required'),
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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  appointmentSlots: z.object({
    startTime: z.string().min(1, 'Required'),
    endTime: z.string().min(1, 'Required'),
  }),
});



export default function HospitalSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  
  // Files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [gstFile, setGstFile] = useState<File | null>(null);

  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      hospitalName: '',
      adminName: '',
      city: '',
      contactNumber: '',
      officialEmail: '',
      description: '',
      specialties: '',
      services: [],
      ambulanceAvailable: false,
      emergency24x7: false,
      openingTime: '08:00',
      closingTime: '20:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    }
  });

  const form2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      hospitalLicenseNumber: '',
      gstNumber: '',
      emergencyContactNumber: '',
      fullAddress: { address: '', city: '', state: '', pincode: '' },
      location: { lat: 20.5937, lng: 78.9629 }, // Default India
      appointmentSlots: { startTime: '09:00', endTime: '17:00' },
    }
  });

  const servicesArray = useFieldArray({
    control: form1.control,
    name: 'services',
  });

  const onNextStep = async (data: z.infer<typeof step1Schema>) => {
    if (!logoFile) {
      toast({ title: 'Error', description: 'Hospital logo is required', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const geocodeAddress = async (fullAddress: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        form2.setValue('location.lat', parseFloat(lat), { shouldValidate: true });
        form2.setValue('location.lng', parseFloat(lon), { shouldValidate: true });
        toast({ title: 'Location found!', description: `Map updated to ${fullAddress}` });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  useEffect(() => {
    const address = form2.watch('fullAddress.address');
    const city = form2.watch('fullAddress.city');
    const state = form2.watch('fullAddress.state');
    
    if (address && city && state) {
      const fullAddress = `${address}, ${city}, ${state}`;
      const timer = setTimeout(() => geocodeAddress(fullAddress), 1500);
      return () => clearTimeout(timer);
    }
  }, [form2.watch('fullAddress.address'), form2.watch('fullAddress.city'), form2.watch('fullAddress.state')]);

  const onSubmit = async (data2: z.infer<typeof step2Schema>) => {
    if (!licenseFile || !idProofFile || !gstFile) {
      toast({ title: 'Error', description: 'Please upload all required documents (License, ID Proof, and GST Certificate)', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const data1 = form1.getValues();

      const formData = new FormData();
      
      // Append Step 1 data
      Object.entries(data1).forEach(([key, value]) => {
        if (key === 'workingDays') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'services') {
          formData.append(key, JSON.stringify(value || []));
        } else {
          formData.append(key, value as any);
        }
      });
      formData.append('hospitalLogo', logoFile);

      // Append Step 2 data
      formData.append('hospitalLicenseNumber', data2.hospitalLicenseNumber);
      formData.append('gstNumber', data2.gstNumber);
      formData.append('emergencyContactNumber', data2.emergencyContactNumber);
      formData.append('fullAddress', JSON.stringify(data2.fullAddress));
      formData.append('location', JSON.stringify(data2.location));
      formData.append('latitude', String(data2.latitude || data2.location.lat));
      formData.append('longitude', String(data2.longitude || data2.location.lng));
      formData.append('appointmentSlots', JSON.stringify(data2.appointmentSlots));
      
      formData.append('licenseCertificate', licenseFile);
      formData.append('ownerIdProof', idProofFile);
      formData.append('gstDocument', gstFile);

      const res = await fetch(`${API_BASE}/api/hospitals/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || 'Failed to submit');
      }

      const result = await res.json();
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.hospitalAdded = true;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      toast({ title: 'Success', description: 'Hospital setup complete. Redirecting to dashboard...' });
      navigate('/hospital-dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>1</div>
          <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">{step === 1 ? 'Basic Information' : 'Verification & Details'}</h2>
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Form {...form1}>
                  <form onSubmit={form1.handleSubmit(onNextStep)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form1.control} name="hospitalName" render={({ field }) => (
                        <FormItem><FormLabel>Hospital Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form1.control} name="adminName" render={({ field }) => (
                        <FormItem><FormLabel>Admin Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form1.control} name="contactNumber" render={({ field }) => (
                        <FormItem><FormLabel>Contact Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form1.control} name="officialEmail" render={({ field }) => (
                        <FormItem><FormLabel>Official Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form1.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form1.control} name="specialties" render={({ field }) => (
                        <FormItem><FormLabel>Specialties (comma separated)</FormLabel><FormControl><Input placeholder="Cardiology, Neurology" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Hospital Logo *</FormLabel>
                      <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </div>

                    <FormField control={form1.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>About</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage/></FormItem>
                    )} />

                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">Services</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => servicesArray.append({ title: '', description: '' })}
                        >
                          <Plus className="h-4 w-4" />
                          Add Service
                        </Button>
                      </div>

                      {servicesArray.fields.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Add services to show on hospital details page.</p>
                      ) : (
                        <div className="space-y-3">
                          {servicesArray.fields.map((f, index) => (
                            <div key={f.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Service #{index + 1}</p>
                                <Button type="button" variant="ghost" size="sm" onClick={() => servicesArray.remove(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <FormField
                                control={form1.control}
                                name={`services.${index}.title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Title *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form1.control}
                                name={`services.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Description</FormLabel>
                                    <FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form1.control} name="openingTime" render={({ field }) => (
                        <FormItem><FormLabel>Opening Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form1.control} name="closingTime" render={({ field }) => (
                        <FormItem><FormLabel>Closing Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                    </div>

                    <div className="flex gap-4">
                      <FormField control={form1.control} name="ambulanceAvailable" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="m-0 cursor-pointer">Ambulance Available</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={form1.control} name="emergency24x7" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="m-0 cursor-pointer">24/7 Emergency</FormLabel>
                        </FormItem>
                      )} />
                    </div>

                    <Button type="submit" className="w-full mt-6">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Form {...form2}>
                  <form onSubmit={form2.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form2.control} name="hospitalLicenseNumber" render={({ field }) => (
                        <FormItem><FormLabel>License Number *</FormLabel><FormControl><Input placeholder="Enter License No." {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form2.control} name="gstNumber" render={({ field }) => (
                        <FormItem><FormLabel>GST Number *</FormLabel><FormControl><Input placeholder="22AAAAA0000A1Z5" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField control={form2.control} name="emergencyContactNumber" render={({ field }) => (
                        <FormItem><FormLabel>Emergency Contact Number *</FormLabel><FormControl><Input placeholder="Enter Phone" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                    </div>

                    <div className="rounded-2xl border border-border bg-slate-50/50 p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">Hospital Location</h3>
                            <p className="text-[10px] text-muted-foreground font-medium">Select precise location for patients</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-9 border-primary/20 text-primary hover:bg-primary/5 font-bold"
                          onClick={() => setMapOpen(true)}
                        >
                          <Navigation className="h-3.5 w-3.5 mr-1.5" /> Select Location on Map
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form2.control} name="location.lat" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Latitude</FormLabel><FormControl><Input value={String(field.value ?? '')} readOnly className="bg-white/50" /></FormControl></FormItem>
                        )} />
                        <FormField control={form2.control} name="location.lng" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Longitude</FormLabel><FormControl><Input value={String(field.value ?? '')} readOnly className="bg-white/50" /></FormControl></FormItem>
                        )} />
                      </div>

                      <div className="space-y-4 pt-2 border-t border-slate-200">
                        <FormField control={form2.control} name="fullAddress.address" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Detailed Address *</FormLabel><FormControl><Input placeholder="Building, Street, Area" {...field} className="bg-white" /></FormControl><FormMessage/></FormItem>
                        )} />
                        <div className="grid grid-cols-3 gap-4">
                          <FormField control={form2.control} name="fullAddress.city" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">City</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl></FormItem>
                          )} />
                          <FormField control={form2.control} name="fullAddress.state" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">State</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl></FormItem>
                          )} />
                          <FormField control={form2.control} name="fullAddress.pincode" render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Pincode</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl></FormItem>
                          )} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <h3 className="font-semibold text-sm">Appointment Slots</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form2.control} name="appointmentSlots.startTime" render={({ field }) => (
                          <FormItem><FormLabel>From</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage/></FormItem>
                        )} />
                        <FormField control={form2.control} name="appointmentSlots.endTime" render={({ field }) => (
                          <FormItem><FormLabel>To</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage/></FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">License Certificate *</FormLabel>
                        <Input type="file" accept=".pdf,image/*" className="h-10 text-xs" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} />
                      </div>
                      <div className="space-y-2">
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">GST Certificate *</FormLabel>
                        <Input type="file" accept=".pdf,image/*" className="h-10 text-xs" onChange={(e) => setGstFile(e.target.files?.[0] || null)} />
                      </div>
                      <div className="space-y-2">
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Owner ID Proof *</FormLabel>
                        <Input type="file" accept="image/*" className="h-10 text-xs" onChange={(e) => setIdProofFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                      <Button 
                        type="submit" 
                        className="flex-1" 
                        size="lg"
                        isLoading={isLoading}
                      >
                        Save & Continue
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                lat: form2.getValues().location.lat || 20.5937, 
                lng: form2.getValues().location.lng || 78.9629 
              }}
              onLocationSelect={(loc) => {
                form2.setValue('location.lat', loc.lat);
                form2.setValue('location.lng', loc.lng);
                form2.setValue('latitude', loc.lat);
                form2.setValue('longitude', loc.lng);
                form2.setValue('fullAddress.address', loc.address);
                form2.setValue('fullAddress.city', loc.city);
                form2.setValue('fullAddress.state', loc.state);
                form2.setValue('fullAddress.pincode', loc.pincode);
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
}

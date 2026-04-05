import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  User, 
  Upload, 
  Loader2,
  Shield,
  CheckCircle2,
  Clock,
  ShieldCheck, // Added ShieldCheck import
  XCircle // Added XCircle import
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

const hospitalSetupSchema = z.object({
  hospitalName: z.string().trim().min(2, 'Hospital name must be at least 2 characters').max(150, 'Hospital name must be less than 150 characters'),
  adminName: z.string().trim().min(2, 'Admin name must be at least 2 characters').max(100, 'Admin name must be less than 100 characters'),
  city: z.string().trim().min(2, 'City is required').max(100, 'City must be less than 100 characters'),
  contactNumber: z.string().trim().min(10, 'Please enter a valid contact number').max(15, 'Contact number must be less than 15 characters'),
  officialEmail: z.string().trim().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  identificationNumber: z.string().trim().min(5, 'Please enter a valid identification number').max(50, 'Identification number must be less than 50 characters'),
  aboutHospital: z.string().max(500, 'Description must be less than 500 characters').optional(),
  specialties: z.string().optional(), // Comma-separated string for specialties
  services: z.array(z.object({
    title: z.string().min(1, 'Service title is required').max(100, 'Service title too long'),
    description: z.string().max(250, 'Service description too long').optional(),
  })).optional(),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  openTime: z.string().min(1, 'Opening time is required'),
  closeTime: z.string().min(1, 'Closing time is required'),
  emergencyAvailable: z.boolean().optional(),
  ambulanceAvailable: z.boolean().optional(), // New field
});

type HospitalSetupFormValues = z.infer<typeof hospitalSetupSchema>;

const HospitalSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<HospitalSetupFormValues>({
    resolver: zodResolver(hospitalSetupSchema),
    defaultValues: {
      hospitalName: '',
      adminName: '',
      city: '',
      contactNumber: '',
      officialEmail: '',
      identificationNumber: '',
      aboutHospital: '',
      specialties: '', // Default for new field
      services: [],    // Default for new field
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openTime: '08:00',
      closeTime: '21:00',
      emergencyAvailable: false,
      ambulanceAvailable: false, // Default for new field
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: HospitalSetupFormValues) => {
    setIsLoading(true);
    try {
      // Get user info from localStorage (stored after signup)
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast({
          title: 'Error',
          description: 'User session not found. Please login again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      
      // Upload logo if provided
      let logoPat = null;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        try {
          const uploadRes = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            logoPat = uploadData.filePath;
          }
        } catch (err) {
          console.warn('Logo upload failed, continuing without logo', err);
        }
      }

      // Call backend to save hospital
      const response = await fetch(`${API_BASE}/api/hospitals/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: user.id,
          hospitalName: data.hospitalName,
          adminName: data.adminName,
          city: data.city,
          contactNumber: data.contactNumber,
          officialEmail: data.officialEmail,
          hospitalId: data.identificationNumber,
          description: data.aboutHospital || "",
          hospitalLogo: logoPat,
          specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()) : [],
          services: data.services,
          workingDays: data.workingDays,
          openingTime: data.openTime,
          closingTime: data.closeTime,
          emergency24x7: data.emergencyAvailable,
          ambulanceAvailable: data.ambulanceAvailable,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to save hospital profile',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      // Update user info in localStorage to reflect hospitalAdded
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.hospitalAdded = true;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      // Store hospital info in localStorage for reference
      localStorage.setItem('hospitalProfile', JSON.stringify({
        ...data,
        hospitalId: result.hospital._id,
        hospitalLogo: result.hospital.hospitalLogo,
        completedAt: new Date().toISOString(),
      }));
      
      toast({
        title: 'Hospital profile created successfully!',
        description: 'Your profile is pending approval. Check your email for updates.',
      });
      
      // Redirect to hospital dashboard after a short delay
      setTimeout(() => {
        navigate('/hospital-dashboard');
      }, 1500);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save hospital profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (() => { // Added IIFE wrapper for temporary error boundary
    try {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-cta/5 py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl"
          >
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-primary">Account Created</span>
                </div>
                <div className="h-px w-12 bg-primary" />
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    2
                  </div>
                  <span className="text-sm font-medium text-primary">Hospital Profile</span>
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">Step 2 of 2</p>
            </div>

            {/* Main Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Complete Your Hospital Profile
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Add verified details so patients can trust and book appointments easily
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Hospital Name */}
                  <FormField
                    control={form.control}
                    name="hospitalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="City General Hospital"
                              className="h-12 pl-10"
                              disabled={isLoading}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">
                      Hospital Logo <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-primary/20">
                          <img
                            src={logoPreview}
                            alt="Hospital logo preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label
                          htmlFor="logo-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Upload className="h-4 w-4" />
                          {logoFile ? 'Change Logo' : 'Upload Logo'}
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                          disabled={isLoading}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          PNG, JPG up to 2MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Name */}
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin / Owner Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Dr. John Smith"
                              className="h-12 pl-10"
                              disabled={isLoading}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City / Location */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City / Location *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Mumbai, Maharashtra"
                              className="h-12 pl-10"
                              disabled={isLoading}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Number & Email Row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder="+91 98765 43210"
                                className="h-12 pl-10"
                                disabled={isLoading}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="officialEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Official Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="admin@hospital.com"
                                className="h-12 pl-10"
                                disabled={isLoading}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hospital Identification */}
                  <FormField
                    control={form.control}
                    name="identificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital Identification *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="GST / Registration / License Number"
                              className="h-12 pl-10"
                              disabled={isLoading}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Used for verification and trust (GST Number, Government Registration, or License Number)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* About Hospital */}
                  <FormField
                    control={form.control}
                    name="aboutHospital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          About Hospital <span className="text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell patients about your hospital — services offered, specializations, facilities, and what makes you unique..."
                            className="min-h-[120px] resize-none"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Specialties */}
                  <FormField
                    control={form.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Specialties <span className="text-muted-foreground">(optional, comma-separated)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Cardiology, Dental, Pediatrics"
                            className="h-12"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          List your hospital's main specialties, separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Services */}
                  <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">Services Offered <span className="text-muted-foreground">(optional)</span></h3>
                    </div>
                    {(form.watch('services') || []).map((service, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                        <div className="flex-1 space-y-3">
                          <FormField
                            control={form.control}
                            name={`services.${index}.title`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormLabel>Service Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Emergency Care"
                                    disabled={isLoading}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`services.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormLabel>Description <span className="text-muted-foreground">(optional)</span></FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Briefly describe this service (max 250 chars)"
                                    className="min-h-[80px] resize-none"
                                    disabled={isLoading}
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  {field.value?.length || 0}/250 characters
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const currentServices = form.getValues('services') || [];
                            form.setValue('services', currentServices.filter((_, i) => i !== index), { shouldValidate: true });
                          }}
                          disabled={isLoading}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const currentServices = form.getValues('services') || [];
                        form.setValue('services', [...currentServices, { title: '', description: '' }], { shouldValidate: true });
                      }}
                      disabled={isLoading}
                    >
                      Add Service
                    </Button>
                  </div>

                  {/* Ambulance Available */}
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <Checkbox
                      id="ambulance"
                      checked={form.watch('ambulanceAvailable')}
                      onCheckedChange={(val) => form.setValue('ambulanceAvailable', !!val)}
                      disabled={isLoading}
                    />
                    <label htmlFor="ambulance" className="cursor-pointer text-sm font-medium text-foreground">
                      Ambulance Service Available
                    </label>
                  </div>

                  {/* Working Hours & Days */}
                  <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">Working Hours & Days *</h3>
                    </div>

                    {/* Days Selection */}
                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">Working Days</p>
                      <div className="flex flex-wrap gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const selected = form.watch('workingDays') || [];
                          const isSelected = selected.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const current = form.getValues('workingDays') || [];
                                if (current.includes(day)) {
                                  form.setValue('workingDays', current.filter((d: string) => d !== day), { shouldValidate: true });
                                } else {
                                  form.setValue('workingDays', [...current, day], { shouldValidate: true });
                                }
                              }}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      {form.formState.errors.workingDays && (
                        <p className="mt-1 text-sm text-destructive">{form.formState.errors.workingDays.message}</p>
                      )}
                    </div>

                    {/* Time Selection */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="openTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Time *</FormLabel>
                            <FormControl>
                              <Input type="time" className="h-12" disabled={isLoading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="closeTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Closing Time *</FormLabel>
                            <FormControl>
                              <Input type="time" className="h-12" disabled={isLoading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Emergency */}
                    <div className="flex items-center gap-3 rounded-lg bg-background p-3">
                      <Checkbox
                        id="emergency"
                        checked={form.watch('emergencyAvailable')}
                        onCheckedChange={(val) => form.setValue('emergencyAvailable', !!val)}
                      />
                      <label htmlFor="emergency" className="cursor-pointer text-sm font-medium text-foreground">
                        24/7 Emergency Services Available
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="cta"
                    size="xl"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save & Continue'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Trust Note */}
              <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary/5 p-4">
                <Shield className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Your details are safe and visible only to verified users
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    } catch (error) {
      console.error("HospitalSetup rendering error:", error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 p-4">
          <p className="text-center">An error occurred during rendering the Hospital Setup form. Please check the browser console for more details.</p>
        </div>
      );
    }
  })(); // End of IIFE
};

export default HospitalSetup;
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Clock,
  Upload,
  Loader2,
  Save,
  Calendar,
} from 'lucide-react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const editSchema = z.object({
  aboutHospital: z.string().max(500, 'Max 500 characters').optional(),
  workingDays: z.array(z.string()).min(1, 'Select at least one day'),
  openTime: z.string().min(1, 'Required'),
  closeTime: z.string().min(1, 'Required'),
  emergencyAvailable: z.boolean().optional(),
});

type EditForm = z.infer<typeof editSchema>;

const EditProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hospital, setHospital] = useState<any>(null);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      aboutHospital: '',
      workingDays: [],
      openTime: '',
      closeTime: '',
      emergencyAvailable: false,
    },
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) { navigate('/login'); return; }
    const parsed = JSON.parse(user);
    if (parsed.role !== 'hospital') { navigate('/'); return; }

    const profile = localStorage.getItem('hospitalProfile');
    if (profile) {
      const p = JSON.parse(profile);
      setHospital(p);
      setImagePreview(p.profileImage || null);
      form.reset({
        aboutHospital: p.aboutHospital || '',
        workingDays: p.workingDays || [],
        openTime: p.openTime || '',
        closeTime: p.closeTime || '',
        emergencyAvailable: p.emergencyAvailable || false,
      });
    }
  }, [navigate, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: EditForm) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));

    const updated = { ...hospital, ...data, profileImage: imagePreview };
    localStorage.setItem('hospitalProfile', JSON.stringify(updated));

    // Also update hospital in allHospitals list
    try {
      const allRaw = localStorage.getItem('hospitals');
      if (allRaw) {
        const all = JSON.parse(allRaw);
        const idx = all.findIndex((h: any) => h.name === hospital.hospitalName || h.id === hospital._id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...data };
          localStorage.setItem('hospitals', JSON.stringify(all));
        }
      }
    } catch { /* ignore */ }

    setSaving(false);
    toast({ title: 'Profile updated successfully!' });
    navigate('/profile');
  };

  const initials = hospital?.hospitalName?.slice(0, 2).toUpperCase() || 'H';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-10 md:py-14">
        <button
          onClick={() => navigate('/profile')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8"
        >
          <h1 className="text-xl font-bold text-foreground mb-6">Edit Hospital Profile</h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md cursor-pointer" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt="Hospital" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  Change Photo
                </Button>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="aboutHospital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell patients about your hospital..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Working Days */}
              <FormField
                control={form.control}
                name="workingDays"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Working Days
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAYS.map((day) => {
                        const selected = form.watch('workingDays').includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              const current = form.getValues('workingDays');
                              form.setValue(
                                'workingDays',
                                selected ? current.filter((d) => d !== day) : [...current, day],
                                { shouldValidate: true }
                              );
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timing */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Opening Time
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Closing Time
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency */}
              <FormField
                control={form.control}
                name="emergencyAvailable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      24/7 Emergency Services Available
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button type="submit" variant="cta" size="lg" className="w-full gap-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProfile;

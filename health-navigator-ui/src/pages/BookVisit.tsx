import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { User, Phone, Mail, CalendarIcon, Clock, Building2, Loader2, CheckCircle2, FileText, Ambulance } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const bookingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email'),
  age: z.string().min(1, 'Age is required'),
  gender: z.string().min(1, 'Select gender'),
  symptoms: z.string().min(5, 'Describe your symptoms'),
  date: z.date({ required_error: 'Select appointment date' }),
  time: z.string().min(1, 'Select appointment time'),
  ambulanceRequired: z.boolean().default(false),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  '04:30 PM', '05:00 PM',
];

const BookVisit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hospitalName = searchParams.get('hospitalName') || searchParams.get('name') || 'CityCare Hospital';
  const hospitalLocation = searchParams.get('branchAddress') || searchParams.get('location') || 'Downtown, New York';
  const hospitalId = searchParams.get('id');
  const branchId = searchParams.get('branchId');
  const branchName = searchParams.get('branchName');
  const autoCall = searchParams.get('autoCall') === '1';
  const branchPhone = searchParams.get('branchPhone');
  const isEmergency = searchParams.get('emergency') === '1';
  const returnTo = searchParams.get('returnTo');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingData, setPendingData] = useState<BookingFormValues | null>(null);
  const [timer, setTimer] = useState(120);

  const startTimer = () => {
    setTimer(120);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return interval;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please login or sign up to book an appointment.',
        variant: 'destructive',
      });
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    // Validation: Ensure hospital ID exists in URL
    const id = searchParams.get('id');
    if (!id) {
      toast({
        title: 'No Hospital Selected',
        description: 'Please select a hospital card first to book an appointment.',
        variant: 'destructive',
      });
      navigate('/hospitals');
    }
  }, [navigate, searchParams]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      age: '',
      gender: '',
      symptoms: '',
      time: '',
      ambulanceRequired: false,
    },
  });

  useEffect(() => {
    if (isEmergency) {
      form.setValue('ambulanceRequired', true);
    }
  }, [form, isEmergency]);

  const handleInitialSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/otp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.msg || 'Failed to send OTP');
      }
      
      setPendingData(data);
      setOtpStep(true);
      startTimer();
      toast({ title: 'OTP Sent', description: `Development OTP logged in console for ${data.phone}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp || !pendingData) return;
    setIsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      // Verify OTP
      const verifyRes = await fetch(`${API_BASE}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingData.phone, otp })
      });
      
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.msg || 'Invalid OTP');
      }

      // Proceed with booking or emergency log
      const bookingUrl = isEmergency ? `${API_BASE}/api/otp/emergency` : `${API_BASE}/api/appointments/book`;
      const bookingBody = isEmergency 
        ? { phone: pendingData.phone, hospitalId, branchId }
        : {
            hospitalId,
            branchId,
            hospitalName,
            location: hospitalLocation,
            patientName: pendingData.fullName,
            patientEmail: pendingData.email,
            date: format(pendingData.date, 'yyyy-MM-dd'),
            time: pendingData.time,
            age: pendingData.age,
            gender: pendingData.gender,
            symptoms: pendingData.symptoms,
            problem: pendingData.symptoms,
            phone: pendingData.phone,
            ambulanceRequired: pendingData.ambulanceRequired
          };

      const response = await fetch(bookingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to process request');
      }

      setIsSuccess(true);
      toast({
        title: 'Appointment Booked Successfully!',
        description: autoCall ? 'Verification successful. Opening dialer...' : `Confirmation PDF sent to ${pendingData.email}`,
      });

      if (autoCall && branchPhone) {
        window.location.href = `tel:${branchPhone}`;
      }

      setTimeout(() => {
        if (returnTo) {
          navigate(decodeURIComponent(returnTo));
          return;
        }
        navigate('/hospitals');
      }, autoCall ? 1000 : 3000);
    } catch (err: any) {
      toast({
        title: 'Booking Failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cta/10">
              <CheckCircle2 className="h-10 w-10 text-cta" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Appointment Booked Successfully!</h2>
            <p className="mt-3 text-muted-foreground">
              A confirmation PDF with appointment details has been sent to your email.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-card p-4 text-left shadow-sm inline-block mx-auto">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <FileText className="h-5 w-5" />
                <span className="font-semibold text-sm">Appointment_Receipt.pdf</span>
              </div>
              <p className="text-xs text-muted-foreground">Sent to: {form.getValues('email')}</p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Button
                variant="default"
                size="lg"
                onClick={() => {
                  setIsSuccess(false);
                  form.reset();
                }}
              >
                Book Another Visit
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Book Your Visit</h1>
            <p className="mt-2 text-muted-foreground">
              Fill in the details below to schedule your appointment at {hospitalName}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
            {/* Dynamic hospital info */}
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{hospitalName}</p>
                <p className="text-xs text-muted-foreground">{hospitalLocation}</p>
              </div>
            </div>
            {isEmergency && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                <Ambulance className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Emergency Booking</p>
                  <p className="text-xs text-red-700/80">Form submit karne ke baad aapko hospital details page par redirect kiya jayega.</p>
                </div>
              </div>
            )}

            {otpStep ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Verify OTP</h3>
                  <span className={cn("text-sm font-bold", timer < 30 ? "text-destructive" : "text-primary")}>
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to {pendingData?.phone}</p>
                <Input 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000" 
                  maxLength={6} 
                  className="text-center text-3xl h-14 tracking-[0.5em] font-bold"
                  disabled={isLoading}
                />
                <p className="text-xs text-center text-muted-foreground">
                  Development OTP logged in console/Render logs
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" className="w-full" onClick={() => setOtpStep(false)} disabled={isLoading}>Back</Button>
                  <Button className="w-full" onClick={handleOtpSubmit} disabled={isLoading || otp.length < 4} isLoading={isLoading}>
                    Verify & Book
                  </Button>
                </div>
                {timer === 0 && (
                  <button 
                    onClick={() => handleInitialSubmit(pendingData!)} 
                    className="w-full text-sm text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="John Doe" className="h-12 pl-10" disabled={isLoading} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="+91 98765 43210" className="h-12 pl-10" disabled={isLoading} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input type="email" placeholder="name@example.com" className="h-12 pl-10" disabled={isLoading} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="25" className="h-12" disabled={isLoading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem / Symptoms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your symptoms or reason for visit..."
                          className="min-h-[100px] resize-none"
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
                  name="ambulanceRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none flex items-center gap-2">
                        <Ambulance className="h-4 w-4 text-primary" />
                        <FormLabel>
                          Ambulance Service Required?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Appointment Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'h-12 w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className={cn('p-3 pointer-events-auto')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {slot}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Confirm Appointment
            </Button>
              </form>
            </Form>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BookVisit;

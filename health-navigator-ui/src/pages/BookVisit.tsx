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
  date: z.date({ required_error: 'Select appointment date' }).optional(),
  time: z.string().optional(),
  ambulanceRequired: z.boolean().default(false),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const timeSlots = []; // Will be generated dynamically

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

  const displayName = branchName ? `${hospitalName} - ${branchName}` : hospitalName;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingData, setPendingData] = useState<BookingFormValues | null>(null);
  const [timer, setTimer] = useState(120);
  const [todayCount, setTodayCount] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [opdCharge, setOpdCharge] = useState(0);
  const [branchData, setBranchData] = useState<any>(null);
  const [bookingClosed, setBookingClosed] = useState(false);
  const [occupancy, setOccupancy] = useState<Record<string, number>>({});
  const [generatedSlots, setGeneratedSlots] = useState<string[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);

  const generateSlots = (start: string, end: string): string[] => {
    const slots: string[] = [];
    let current = new Date(`2000-01-01T${start}:00`);
    const stop = new Date(`2000-01-01T${end}:00`);
    while (current < stop) {
      slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      current = new Date(current.getTime() + 30 * 60000);
    }
    return slots;
  };

  const fetchOccupancy = async (date: Date) => {
    if (!hospitalId) return;
    try {
      setSlotLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`${API_BASE}/api/appointments/slot-occupancy?hospitalId=${hospitalId}&branchId=${branchId || 'null'}&date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setOccupancy(data.occupancy || {});
      }
    } catch (err) {}
    finally { setSlotLoading(false); }
  };

  const fetchDetails = async () => {
    if (!hospitalId) return;
    try {
      setCheckingAvailability(true);
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const [availRes, hospRes] = await Promise.all([
        fetch(`${API_BASE}/api/appointments/availability?hospitalId=${hospitalId}&branchId=${branchId || 'null'}&date=${today}`),
        fetch(`${API_BASE}/api/hospitals/${hospitalId}`)
      ]);

      if (availRes.ok) {
        const data = await availRes.json();
        setTodayCount(data.count || 0);
      }

      if (hospRes.ok) {
        const hData = await hospRes.json();
        const hospital = hData.hospital || hData;
        let charge = hospital?.opdCharge || 0;
        let start = hospital?.startTime || '09:00';
        let end = hospital?.endTime || '18:00';
        
        if (branchId) {
          const branchRes = await fetch(`${API_BASE}/api/branches/single/${branchId}`);
          if (branchRes.ok) {
            const branch = await branchRes.json();
            setBranchData(branch);
            if (branch.opdChargeType === 'custom') charge = branch.opdCharge;
            if (branch.startTime) start = branch.startTime;
            if (branch.endTime) end = branch.endTime;

            if (end) {
              const [h, m] = end.split(':').map(Number);
              const endDate = new Date();
              endDate.setHours(h, m, 0, 0);
              if (new Date() > endDate) setBookingClosed(true);
            }
          }
        }
        setOpdCharge(charge);
        const slots = generateSlots(start, end);
        setGeneratedSlots(slots);
        fetchOccupancy(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch details', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [hospitalId, branchId]);

  const getAvailableSlots = (selectedDate: Date | undefined): string[] => {
    const slots = generatedSlots.length > 0 ? generatedSlots : generateSlots('09:00', '18:00');
    if (!selectedDate) return slots;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const selectedStr = format(selectedDate, 'yyyy-MM-dd');
    if (selectedStr !== todayStr) return slots;
    const now = new Date();
    return slots.filter(slot => {
      const match = slot.match(/(\d+):(\d+)\s(AM|PM)/i);
      if (!match) return true;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      return slotTime > now;
    });
  };

  const MAX_PER_SLOT = 30;
  const getSlotCount = (slot: string) => occupancy[slot] || 0;
  const isSlotFull = (slot: string) => getSlotCount(slot) >= MAX_PER_SLOT;
  const getNextAvailableSlot = (selectedDate: Date | undefined): string | null => {
    const slots = getAvailableSlots(selectedDate);
    return slots.find(s => !isSlotFull(s)) || null;
  };

  const isTodayDisabled = todayCount >= 300 || getAvailableSlots(new Date()).length === 0 || bookingClosed;

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
      // Auto-set for emergency as per request
      form.setValue('date', new Date());
      form.setValue('time', 'Emergency Now');
    } else {
      // For normal booking, if today is disabled, default to tomorrow
      if (isTodayDisabled) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        form.setValue('date', tomorrow);
      } else {
        form.setValue('date', new Date());
      }
    }
  }, [form, isEmergency, isTodayDisabled]);

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

      // Proceed with booking (Using same endpoint for better data capture if form is filled)
      const bookingUrl = `${API_BASE}/api/appointments/book`;
      const bookingBody = {
            hospitalId,
            branchId,
            hospitalName: displayName,
            location: hospitalLocation,
            patientName: pendingData.fullName,
            patientEmail: pendingData.email,
            date: pendingData.date ? format(pendingData.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            time: (isEmergency && (!pendingData.time || pendingData.time === 'Emergency Now')) ? 'Emergency' : pendingData.time,
            age: pendingData.age,
            gender: pendingData.gender,
            symptoms: pendingData.symptoms,
            problem: pendingData.symptoms,
            phone: pendingData.phone,
            ambulanceRequired: pendingData.ambulanceRequired,
            type: isEmergency ? 'Emergency' : 'Normal'
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
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
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
              {branchPhone && (
                <Button
                  variant="cta"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.location.href = `tel:${branchPhone}`}
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </Button>
              )}
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
              Fill in the details below to schedule your appointment at {displayName}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
            {/* Dynamic hospital info */}
            <div className="mb-6 flex items-center justify-between rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{hospitalLocation}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Consultation Fee</p>
                <p className="text-lg font-black text-primary">₹{opdCharge || 0}</p>
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
                              onSelect={(d) => {
                                field.onChange(d);
                                if (d) fetchOccupancy(d);
                                form.setValue('time', '');
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                const isBeforeToday = date < today;
                                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                return isBeforeToday || (isToday && isTodayDisabled);
                              }}
                              initialFocus
                              className={cn('p-3 pointer-events-auto')}
                            />
                          </PopoverContent>
                        </Popover>
                        {format(form.getValues('date') || new Date(), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && isTodayDisabled && (
                           <p className="text-[10px] text-red-500 font-bold mt-1 uppercase animate-pulse">
                             {bookingClosed ? "Today's booking closed. Please select next date." : "Today's slots full. Select next date."}
                           </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => {
                      const selectedDate = form.getValues('date');
                      const availableSlots = getAvailableSlots(selectedDate);
                      const nextSlot = getNextAvailableSlot(selectedDate);
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Appointment Time</span>
                            {slotLoading && <span className="text-xs text-muted-foreground">Loading slots...</span>}
                          </FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                            {availableSlots.map((slot) => {
                              const count = getSlotCount(slot);
                              const full = isSlotFull(slot);
                              const selected = field.value === slot;
                              const isNext = !full && slot === nextSlot && !field.value;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => {
                                    if (full) {
                                      toast({ title: 'Slot Full', description: `This slot is full. ${nextSlot ? `Try ${nextSlot}` : 'All slots are full for this date.'}`, variant: 'destructive' });
                                    } else {
                                      field.onChange(slot);
                                    }
                                  }}
                                  className={cn(
                                    'relative text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-150',
                                    selected && 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]',
                                    full && !selected && 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed opacity-80',
                                    !full && !selected && 'bg-card border-border hover:border-primary/60 hover:bg-primary/5',
                                    isNext && !selected && 'border-green-400 bg-green-50 text-green-700'
                                  )}
                                >
                                  <div>{slot}</div>
                                  <div className={cn('text-[10px] font-bold mt-0.5',
                                    full ? 'text-red-500' : selected ? 'text-primary-foreground/70' : isNext ? 'text-green-600' : 'text-muted-foreground'
                                  )}>
                                    {full ? '🔴 FULL' : isNext ? `✅ ${count}/${MAX_PER_SLOT} (Suggested)` : `${count}/${MAX_PER_SLOT}`}
                                  </div>
                                </button>
                              );
                            })}
                            {availableSlots.length === 0 && (
                              <p className="col-span-2 text-center text-sm text-muted-foreground py-4">No slots available for this date.</p>
                            )}
                          </div>
                          {field.value && (
                            <p className="text-xs text-primary font-semibold mt-1">✅ Selected: {field.value}</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
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

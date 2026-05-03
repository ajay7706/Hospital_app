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
import { User, Phone, Mail, CalendarIcon, Clock, Building2, CheckCircle2, FileText, Ambulance, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

// OTP FEATURE FLAG
// Enable when DLT is ready
const ENABLE_OTP = false;

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

const BookVisit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hospitalName = searchParams.get('hospitalName') || searchParams.get('name') || 'Hospital';
  const hospitalLocation = searchParams.get('branchAddress') || searchParams.get('location') || '';
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
  const [successData, setSuccessData] = useState<any>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingData, setPendingData] = useState<BookingFormValues | null>(null);
  const [timer, setTimer] = useState(120);
  const [todayCount, setTodayCount] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [opdCharge, setOpdCharge] = useState(0);
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
            if (branch.opdChargeType === 'custom') charge = branch.opdCharge;
            if (branch.startTime) start = branch.startTime;
            if (branch.endTime) end = branch.endTime;
          }
        }
        setOpdCharge(charge);
        setGeneratedSlots(generateSlots(start, end));
        fetchOccupancy(new Date());
      }
    } catch (err) {} finally { setCheckingAvailability(false); }
  };

  useEffect(() => { fetchDetails(); }, [hospitalId, branchId]);

  const getAvailableSlots = (selectedDate: Date | undefined): string[] => {
    const slots = generatedSlots.length > 0 ? generatedSlots : generateSlots('09:00', '18:00');
    if (!selectedDate) return slots;
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return slots;
    const now = new Date();
    return slots.filter(slot => {
      const match = slot.match(/(\d+):(\d+)\s(AM|PM)/i);
      if (!match) return true;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      return slotTime > now;
    });
  };

  const isTodayDisabled = todayCount >= 300 || getAvailableSlots(new Date()).length === 0 || bookingClosed;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!hospitalId) {
      toast({ title: 'No Hospital Selected', variant: 'destructive' });
      navigate('/hospitals');
    }
  }, [navigate, hospitalId]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { fullName: '', phone: '', email: '', age: '', gender: '', symptoms: '', time: '', ambulanceRequired: false },
  });

  useEffect(() => {
    if (isEmergency) {
      form.setValue('ambulanceRequired', true);
      form.setValue('date', new Date());
      form.setValue('time', 'Emergency Now');
    } else if (isTodayDisabled) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      form.setValue('date', tomorrow);
    } else {
      form.setValue('date', new Date());
    }
  }, [form, isEmergency, isTodayDisabled]);

  const processBooking = async (data: BookingFormValues) => {
    setIsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          hospitalId, branchId, hospitalName: displayName, location: hospitalLocation,
          patientName: data.fullName, patientEmail: data.email,
          date: data.date ? format(data.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          time: (isEmergency && (!data.time || data.time === 'Emergency Now')) ? 'Emergency' : data.time,
          age: data.age, gender: data.gender, symptoms: data.symptoms, phone: data.phone,
          ambulanceRequired: data.ambulanceRequired, type: isEmergency ? 'Emergency' : 'Normal'
        }),
      });

      if (!response.ok) throw new Error((await response.json()).msg || 'Failed to process request');
      
      const result = await response.json();
      setSuccessData(result.appointment);
      setIsSuccess(true);
      toast({ title: 'Appointment Booked Successfully!' });

      if (autoCall && branchPhone) window.location.href = `tel:${branchPhone}`;
    } catch (err: any) {
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleInitialSubmit = async (data: BookingFormValues) => {
    if (!ENABLE_OTP) {
      await processBooking(data);
      return;
    }
    // OTP logic if enabled...
    setIsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/otp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone })
      });
      if (!res.ok) throw new Error((await res.json()).msg || 'Failed to send OTP');
      setPendingData(data);
      setOtpStep(true);
      setTimer(120);
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setIsLoading(false); }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-16">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-foreground mb-2">Success!</h2>
            <p className="text-muted-foreground font-medium mb-8">Appointment Request Submitted Successfully</p>
            
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm text-left space-y-4 mb-8">
               <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Appointment ID</span>
                  <span className="font-black text-primary">{successData?.customId || successData?._id}</span>
               </div>
               <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl text-emerald-700">
                  <MessageSquare className="h-5 w-5" />
                  <p className="text-xs font-bold leading-tight">WhatsApp confirmation has been sent to your number.</p>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" className="h-14 rounded-2xl font-bold" onClick={() => navigate(`/track-appointment/${successData?.customId || successData?._id}`)}>
                Track Appointment Now
              </Button>
              <Button variant="outline" size="lg" className="h-14 rounded-2xl font-bold" onClick={() => navigate('/hospitals')}>
                Back to Hospitals
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-foreground md:text-4xl">Book Your Visit</h1>
            <p className="mt-2 text-muted-foreground font-medium">Fill in the details below for {displayName}</p>
          </div>

          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-2xl shadow-primary/5 sm:p-10">
            <div className="mb-8 flex items-center justify-between rounded-3xl bg-primary/5 p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground font-medium">{hospitalLocation}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">OPD Fee</p>
                <p className="text-xl font-black text-primary">₹{opdCharge || 0}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Patient Name</FormLabel>
                      <FormControl><div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="John Doe" className="h-12 pl-12 rounded-xl" {...field} />
                      </div></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Phone Number</FormLabel>
                      <FormControl><div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="+91 00000 00000" className="h-12 pl-12 rounded-xl" {...field} />
                      </div></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Email Address</FormLabel>
                      <FormControl><div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="email" placeholder="name@example.com" className="h-12 pl-12 rounded-xl" {...field} />
                      </div></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Age</FormLabel>
                        <FormControl><Input type="number" placeholder="25" className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl>
                          <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                        </FormControl><SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent></Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <FormField control={form.control} name="symptoms" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Problem / Symptoms</FormLabel>
                    <FormControl><Textarea placeholder="Describe symptoms..." className="min-h-[100px] rounded-2xl resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold">Date</FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn('h-12 w-full justify-start rounded-xl font-medium', !field.value && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" /> {field.value ? format(field.value, 'PPP') : 'Select Date'}
                        </Button>
                      </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={(d) => { field.onChange(d); d && fetchOccupancy(d); form.setValue('time', ''); }} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus className="p-3" /></PopoverContent></Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Time Slot</FormLabel>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {getAvailableSlots(form.getValues('date')).map((slot) => (
                          <button key={slot} type="button" onClick={() => field.onChange(slot)} className={cn('px-3 py-2 rounded-xl border text-xs font-bold transition-all', field.value === slot ? 'bg-primary text-white border-primary shadow-lg' : 'bg-card border-border hover:border-primary/50')}>
                            {slot}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Confirm Appointment'}
                </Button>
              </form>
            </Form>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BookVisit;

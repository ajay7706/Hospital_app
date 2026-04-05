import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
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
import { User, Phone, Mail, CalendarIcon, Clock, Building2, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const bookingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email'),
  age: z.string().min(1, 'Age is required'),
  gender: z.string().min(1, 'Select gender'),
  symptoms: z.string().min(5, 'Describe your symptoms'),
  date: z.date({ required_error: 'Select appointment date' }),
  time: z.string().min(1, 'Select appointment time'),
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
  const hospitalName = searchParams.get('name') || 'CityCare Hospital';
  const hospitalLocation = searchParams.get('location') || 'Downtown, New York';
  const hospitalId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    },
  });

  const onSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospitalId,
          hospitalName,
          location: hospitalLocation,
          patientName: data.fullName,
          patientEmail: data.email,
          date: format(data.date, 'yyyy-MM-dd'),
          time: data.time,
          age: data.age,
          gender: data.gender,
          symptoms: data.symptoms,
          phone: data.phone
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to book appointment');
      }

      setIsSuccess(true);
      toast({
        title: 'Appointment Booked Successfully!',
        description: `Confirmation PDF sent to ${data.email}`,
      });

      // Clear search params to prevent re-booking on refresh if needed
      // or redirect to a dashboard
      setTimeout(() => {
        navigate('/hospitals'); // Redirect back to hospitals list or dashboard
      }, 3000);
    } catch (err) {
      toast({
        title: 'Booking Failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
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

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                <Button type="submit" variant="cta" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Appointment'
                  )}
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

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminParam = searchParams.get('role') === 'admin';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: 'Login failed',
          description: error.message || 'Invalid credentials',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      toast({
        title: 'Login successful!',
        description: `Welcome back, ${result.user?.role || 'user'}!`,
      });

      setTimeout(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(redirect);
          return;
        }

        if (result.user?.role === 'admin' || result.user?.role === 'hospital') {
          if (result.user?.hospitalAdded || result.user?.role === 'admin') {
            navigate('/hospital-dashboard');
          } else {
            navigate('/hospital-setup');
          }
        } else if (result.user?.role === 'branch') {
          navigate('/branch-dashboard');
        } else if (result.user?.role === 'doctor') {
          navigate('/doctor-dashboard');
        } else if (result.user?.role === 'patient') {
          navigate('/patient-dashboard');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden flex-1 bg-primary lg:flex lg:flex-col lg:justify-center lg:px-12">
        <div className="mx-auto max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground">
              <Plus className="h-7 w-7 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Apna Clinic</span>
          </Link>
          <h1 className="text-3xl font-bold text-primary-foreground">
            Welcome back to your healthcare companion
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Access your appointments, medical records, and find the best healthcare
            providers near you.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Plus className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Apna Clinic</span>
          </Link>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Login to your account</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {/* Identifier (Email or Phone) */}
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Email or Phone"
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

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="h-12 pl-10 pr-10"
                          disabled={isLoading}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin Login Shortcut - Only visible if ?role=admin is in URL */}
              {isAdminParam && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:text-primary"
                    onClick={() => {
                      form.setValue('identifier', 'admin@gmail.com');
                      form.setValue('password', '123456789');
                      toast({
                        title: 'Admin Credentials Loaded',
                        description: 'Click login to access admin dashboard.',
                      });
                    }}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Fill Admin Credentials
                  </Button>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Login
            </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link to="/signup">
            <Button variant="outline" size="lg" className="w-full">
              Create new account
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
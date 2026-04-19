import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export function ReviewPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUnratedAppointments = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) return;
      
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toLowerCase();
        if (role !== 'patient' && role !== 'user') return;
      } catch (e) { return; }

      // Check "Remind me later" logic
      const reminderTime = localStorage.getItem('reviewReminderTime');
      if (reminderTime && new Date().getTime() < parseInt(reminderTime)) {
        return; 
      }
      
      try {
        const res = await fetch(`${API_BASE}/api/appointments/patient`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const appointments = Array.isArray(data.appointments) ? data.appointments : (Array.isArray(data) ? data : []);
          
          // Find first unrated completed appointment
          const unrated = appointments.find((a: any) => {
            const s = a.status?.toLowerCase();
            return (s === 'completed') && !a.isRated;
          });
          
          if (unrated) {
            setAppointment(unrated);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch appointments for review', err);
      }
    };

    // Check immediately on mount/navigate
    checkUnratedAppointments();
    
    // Also check after a 1s delay to be safe
    const timer = setTimeout(checkUnratedAppointments, 1000);
    return () => clearTimeout(timer);
  }, [navigate, location.pathname]); 

  const handleRemindLater = () => {
    const tomorrow = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem('reviewReminderTime', tomorrow.toString());
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: appointment._id,
          rating,
          reviewText,
          patientName: user.name
        })
      });

      if (res.ok) {
        setSuccess(true);
        toast({ title: 'Feedback received!' });
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setRating(0);
          setReviewText('');
          // Refresh list to see if there are MORE unrated ones
          window.location.reload();
        }, 2000);
      } else {
        const data = await res.json();
        toast({ title: data.msg || 'Failed to submit review', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Server error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-white/10"
        >
          {success ? (
            <div className="p-8 text-center">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Thank You!</h2>
              <p className="text-slate-600">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            <>
              <button 
                onClick={handleRemindLater}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">How was your visit?</h2>
                <p className="text-slate-500 text-sm text-center mb-6">
                  You recently visited <span className="font-semibold text-slate-700">{appointment.hospitalName}</span>. 
                  Please rate your experience.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star 
                          className={`h-10 w-10 ${
                            star <= (hoveredRating || rating) 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-200'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Write a review (Optional)
                    </label>
                    <Textarea
                      placeholder="Tell us about your experience..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="resize-none h-24"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full text-slate-600"
                      onClick={handleRemindLater}
                    >
                      Remind Me Later
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={loading || rating === 0}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Submit
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

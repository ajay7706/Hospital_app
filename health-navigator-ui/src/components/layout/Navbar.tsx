import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, X, Stethoscope, Search, LogOut, LayoutDashboard, UserCircle2, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewPopup } from './ReviewPopup';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Book Visit', path: '/book' },
  { name: 'Hospitals', path: '/hospitals' },
  { name: 'Support', path: '/support' },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const resolveAssetUrl = (url?: string) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${API_BASE}/${url}`;
    };

    const stored = localStorage.getItem('user');
    if (stored) {
      try { 
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        
        // If user is hospital, try to get logo from profile
        if (parsedUser.role === 'hospital') {
          const profile = localStorage.getItem('hospitalProfile');
          if (profile) {
            const parsedProfile = JSON.parse(profile);
            setHospitalLogo(resolveAssetUrl(parsedProfile.navbarIcon || parsedProfile.hospitalLogo));
          }
        }
      } catch { setUser(null); }
    } else {
      setUser(null);
      setHospitalLogo(null);
    }

    const handleHighlight = () => {
      setIsSearchHighlighted(true);
      setTimeout(() => setIsSearchHighlighted(false), 2000);
    };

    window.addEventListener('highlight-search', handleHighlight);
    return () => window.removeEventListener('highlight-search', handleHighlight);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hospitals?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md">
        {/* ... existing nav content ... */}
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 p-1">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-primary">
                <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 6V11M12 11V16M12 11H7M12 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
                <path d="M8 18C8 18 9.5 15.5 12 15.5C14.5 15.5 16 18 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M18 18C18 18 19 19 19 20C19 21 17 21 17 21C17 21 16 20 16 19" fill="currentColor" opacity="0.5"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black leading-none tracking-tight text-foreground">
                Clinoza
              </span>
              <div className="flex items-center gap-1">
                <div className="h-[1px] w-4 bg-primary/30" />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 whitespace-nowrap">
                  Care That Connects
                </span>
                <div className="h-[1px] w-4 bg-primary/30" />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="ml-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search hospitals..."
                  className={`h-9 w-40 pl-8 text-sm lg:w-64 focus:w-72 transition-all ${
                    isSearchHighlighted ? 'ring-2 ring-primary ring-offset-2 animate-pulse scale-105 border-primary shadow-lg shadow-primary/20' : ''
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm uppercase transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden">
                    {hospitalLogo ? (
                      <img src={hospitalLogo} alt="Hospital logo" className="h-full w-full object-cover" />
                    ) : (
                      (user.name || user.email || 'U').charAt(0).toUpperCase()
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
                  {/* User info header */}
                  <div className="flex flex-col items-center gap-2 bg-muted/40 px-4 py-4 border-b border-border">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg uppercase overflow-hidden">
                      {hospitalLogo ? (
                        <img src={hospitalLogo} alt="Hospital logo" className="h-full w-full object-cover" />
                      ) : (
                        (user.name || user.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground capitalize">{user.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    {/* Common Profile Link */}
                    <DropdownMenuItem onClick={() => navigate('/edit-profile')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    
                    {/* Role-Specific Dashboard Links */}
                    {user.role === 'hospital' && (
                      <DropdownMenuItem onClick={() => navigate('/hospital-dashboard')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Hospital Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'branch' && (
                      <DropdownMenuItem onClick={() => navigate('/branch-dashboard')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Staff Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'doctor' && (
                      <DropdownMenuItem onClick={() => navigate('/doctor-dashboard')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Doctor Portal</span>
                      </DropdownMenuItem>
                    )}
                    {(user.role === 'patient' || user.role === 'user') && (
                      <DropdownMenuItem onClick={() => navigate('/patient-dashboard')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Track Appointment</span>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin-dashboard')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="gap-2 rounded-md px-3 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="default">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="cta" size="default">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="flex items-center justify-center rounded-lg p-2 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-card md:hidden"
            >
              <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent ${
                      location.pathname === link.path
                        ? 'bg-accent text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <Button variant="outline" className="w-full gap-2" onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Login</Button>
                      </Link>
                      <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="cta" className="w-full">Sign Up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <ReviewPopup />
    </>
  );
};

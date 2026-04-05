import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, X, Calendar, Search, LogOut, LayoutDashboard, UserCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
            setHospitalLogo(parsedProfile.hospitalLogo || null);
          }
        }
      } catch { setUser(null); }
    } else {
      setUser(null);
      setHospitalLogo(null);
    }
  }, [location, localStorage.getItem('hospitalProfile')]); // Added hospitalProfile as dependency

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
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BookVisit</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                location.pathname === link.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <form onSubmit={handleSearch} className="ml-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                className="h-9 w-40 pl-8 text-sm lg:w-52"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Auth Buttons / Profile */}
        <div className="hidden items-center gap-3 md:flex">
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
                  {user.role !== 'admin' && (
                    <DropdownMenuItem className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'hospital' && (
                    <DropdownMenuItem onClick={() => navigate('/hospital-dashboard')} className="gap-2 rounded-md px-3 py-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>Hospital Dashboard</span>
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
  );
};

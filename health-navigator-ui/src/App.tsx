import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import HospitalSetup from "./pages/HospitalSetup";
import Hospitals from "./pages/Hospitals";
import HospitalDetails from "./pages/HospitalDetails";
import HospitalDashboard from "./pages/HospitalDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BookVisit from "./pages/BookVisit";
import ForgotPassword from "./pages/ForgotPassword";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import HospitalProfile from "./pages/HospitalProfile";
import EditProfile from "./pages/EditProfile";
import BranchDashboard from "./pages/BranchDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import TrackAppointment from "./pages/TrackAppointment";
import BranchDetails from "./pages/BranchDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/hospital-setup" element={<HospitalSetup />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/hospital-details" element={<HospitalDetails />} />
          <Route path="/branch-details" element={<BranchDetails />} />
          <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
          <Route path="/branch-dashboard" element={<BranchDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/track-appointment" element={<TrackAppointment />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          <Route path="/book" element={<BookVisit />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<HospitalProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

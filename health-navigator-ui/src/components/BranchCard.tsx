import { Link } from 'react-router-dom';
import { MapPin, Phone, Ambulance } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BranchCardProps {
  branch: any;
  hospital: any;
  onEmergencyClick: (branchId: string, branchName: string) => void;
}

export const BranchCard = ({ branch, hospital, onEmergencyClick }: BranchCardProps) => {
  const opdCharge = branch.opdChargeType === 'custom' ? branch.opdCharge : hospital.opdCharge;
  const emergencyNum = branch.emergencyContactNumber || branch.phone || hospital.phone;

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md flex flex-col h-full">
      {/* Image Section */}
      <Link 
        to={`/branch-details?id=${branch._id}`} 
        className="relative w-full h-[220px] overflow-hidden shrink-0"
      >
        <img 
          src={branch.image || '/assets/hospital-1.jpg'} 
          alt={branch.branchName} 
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/hospital-1.jpg';
          }}
        />
      </Link>

      {/* Content Section */}
      <div className="p-3.5 flex flex-col flex-1 min-w-0">
        <div className="flex-1">
          <Link to={`/branch-details?id=${branch._id}`} className="hover:text-primary transition-colors block">
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-1 mb-0.5">
              {branch.branchName}
            </h3>
          </Link>
          
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground mb-2.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /> 
            <span className="truncate">{branch.city}</span>
          </div>
          
          {/* Healthcare Feature Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {branch.govtSchemes?.length > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-bold px-1.5 py-0">
                🟢 Govt Scheme
              </Badge>
            )}
            {branch.insurance?.accepted && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-bold px-1.5 py-0">
                🔵 Insurance
              </Badge>
            )}
            {branch.labDetails?.enabled && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[9px] font-bold px-1.5 py-0">
                🧪 Lab
              </Badge>
            )}
            {branch.medicalStore?.enabled && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[9px] font-bold px-1.5 py-0">
                💊 Medical
              </Badge>
            )}
          </div>

          {/* Legacy Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {branch.ambulanceAvailable && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0">
                AMB
              </Badge>
            )}
            {branch.emergency24x7 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0">
                24/7
              </Badge>
            )}
            {branch.specialties && branch.specialties.split(',').slice(0, 1).map((spec: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[9px] font-medium px-1.5 py-0 max-w-[100px] truncate">
                {spec.trim()}
              </Badge>
            ))}
          </div>

          {/* OPD Fee - Show only if > 0 */}
          {opdCharge > 0 && (
            <div className="mb-3.5 flex items-center justify-between border-t border-border/50 pt-2.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">OPD Charge</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{opdCharge}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 text-[11px] sm:text-xs font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all" 
              onClick={() => {
                if (emergencyNum) window.location.href = `tel:${emergencyNum}`;
              }}
            >
              <Phone className="mr-1 h-3 w-3" /> Call
            </Button>
            <Link to={`/book?id=${hospital._id || hospital.id}&branchId=${branch._id}&branchName=${encodeURIComponent(branch.branchName)}&branchAddress=${encodeURIComponent(branch.address)}&hospitalName=${encodeURIComponent(hospital.hospitalName || hospital.name || '')}`} className="w-full">
              <Button size="sm" className="w-full h-9 text-[11px] sm:text-xs font-bold shadow-sm hover:shadow-md transition-all">
                Book
              </Button>
            </Link>
          </div>
          
          {(branch.emergency24x7 || branch.ambulanceAvailable) && (
            <Button 
              size="sm" 
              variant="destructive" 
              className="w-full h-9 text-[11px] sm:text-xs font-bold bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md transition-all"
              onClick={() => onEmergencyClick(branch._id, branch.branchName)}
            >
              <Ambulance className="mr-1 h-3.5 w-3.5" /> Emergency
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

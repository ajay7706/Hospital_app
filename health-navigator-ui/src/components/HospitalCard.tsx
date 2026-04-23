import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Ambulance, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HospitalCardProps {
  hospital: any;
}

export const HospitalCard = ({ hospital }: HospitalCardProps) => {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md flex flex-col h-full">
      {/* Image Section */}
      <Link 
        to={`/hospital-details?id=${hospital.id}`} 
        className="relative w-full h-[150px] overflow-hidden shrink-0"
      >
        <img 
          src={hospital.image || '/assets/hospital-1.jpg'} 
          alt={hospital.name} 
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-bold shadow-sm z-10">
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          {hospital.rating}
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-3.5 flex flex-col flex-1 min-w-0">
        <div className="flex-1">
          <Link to={`/hospital-details?id=${hospital.id}`} className="hover:text-primary transition-colors block">
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-1 mb-0.5">
              {hospital.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground mb-2.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /> 
            <span className="truncate">{hospital.location}</span>
          </div>
          
          {/* Healthcare Feature Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {hospital.govtSchemes?.length > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-bold px-1.5 py-0">
                🟢 Govt Scheme
              </Badge>
            )}
            {hospital.insurance?.accepted && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-bold px-1.5 py-0">
                🔵 Insurance
              </Badge>
            )}
            {hospital.labDetails?.enabled && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[9px] font-bold px-1.5 py-0">
                🧪 Lab
              </Badge>
            )}
            {hospital.medicalStore?.enabled && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[9px] font-bold px-1.5 py-0">
                💊 Medical
              </Badge>
            )}
          </div>

          {/* Legacy Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {hospital.ambulanceAvailable && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0">
                AMB
              </Badge>
            )}
            {hospital.branchCount > 0 && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0">
                {hospital.branchCount} Branches
              </Badge>
            )}
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mb-3.5">
            {hospital.specialties.slice(0, 2).map((spec: string, i: number) => (
              <span key={i} className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium">
                {spec}
              </span>
            ))}
          </div>

          {/* OPD Fee */}
          {hospital.opdCharge > 0 && (
            <div className="mb-3.5 flex items-center justify-between border-t border-border/50 pt-2.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Consultation</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{hospital.opdCharge}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Link to={`/hospital-details?id=${hospital.id}`}>
            <Button variant="default" size="sm" className="w-full h-9 text-[11px] sm:text-xs font-bold shadow-sm hover:shadow-md transition-all group/btn">
              View Hospital <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

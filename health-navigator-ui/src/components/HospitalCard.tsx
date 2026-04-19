import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Ambulance, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HospitalCardProps {
  hospital: any;
}

export const HospitalCard = ({ hospital }: HospitalCardProps) => {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md flex flex-col md:flex-row h-full">
      {/* Image Section */}
      <Link 
        to={`/hospital-details?id=${hospital.id}`} 
        className="relative w-full md:w-[40%] lg:w-[280px] h-[180px] md:h-auto overflow-hidden shrink-0"
      >
        <img 
          src={hospital.image || '/assets/hospital-1.jpg'} 
          alt={hospital.name} 
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm z-10">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {hospital.rating}
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
        <div className="flex-1">
          <Link to={`/hospital-details?id=${hospital.id}`} className="hover:text-primary transition-colors block">
            <h3 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1 mb-1">
              {hospital.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary" /> 
            <span className="truncate">{hospital.location}</span>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {hospital.ambulanceAvailable && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                <Ambulance className="mr-1 h-3 w-3" /> Ambulance
              </Badge>
            )}
            {hospital.branchCount > 0 && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                <Building2 className="mr-1 h-3 w-3" /> {hospital.branchCount} Branches
              </Badge>
            )}
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hospital.specialties.slice(0, 3).map((spec: string, i: number) => (
              <span key={i} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium">
                {spec}
              </span>
            ))}
            {hospital.specialties.length > 3 && (
              <span className="text-[10px] bg-secondary/60 text-secondary-foreground px-2 py-0.5 rounded font-medium">
                +{hospital.specialties.length - 3}
              </span>
            )}
          </div>

          {/* OPD Fee */}
          {hospital.opdCharge > 0 && (
            <div className="mb-4 flex items-center justify-between border-t border-border/50 pt-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Consultation</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{hospital.opdCharge}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Link to={`/hospital-details?id=${hospital.id}`}>
            <Button variant="default" className="w-full h-10 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all group/btn">
              View Hospital <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

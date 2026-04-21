import React from 'react';
import { MapPin } from 'lucide-react';

interface GoogleMapViewProps {
  lat: number;
  lng: number;
  zoom?: number;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ lat, lng, zoom = 15 }) => {
  const openInMaps = () => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  // Use free OpenStreetMap embed iframe — no API key needed
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm relative group">
      <iframe
        src={osmUrl}
        width="100%"
        height="320"
        style={{ border: 0 }}
        title="Branch Location Map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {/* Open in Google Maps button overlay */}
      <button
        onClick={openInMaps}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md hover:bg-white transition border border-slate-200"
      >
        <MapPin className="h-3.5 w-3.5 text-red-500" />
        Open in Google Maps
      </button>
    </div>
  );
};

export default GoogleMapView;

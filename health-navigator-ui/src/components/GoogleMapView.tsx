import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '350px'
};

interface GoogleMapViewProps {
  lat: number;
  lng: number;
  zoom?: number;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ lat, lng, zoom = 15 }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const center = { lat, lng };

  if (!isLoaded) return <div className="h-[350px] flex items-center justify-center bg-muted rounded-2xl"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          draggable: false,
          scrollwheel: false,
          disableDefaultUI: true,
          zoomControl: true
        }}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
};

export default GoogleMapView;

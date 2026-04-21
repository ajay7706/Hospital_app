import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Search, Navigation } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 20.5937,
  lng: 78.9629
};

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface GoogleMapPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: { lat: number; lng: number };
}

const libraries: ("places")[] = ["places"];

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({ onLocationSelect, initialLocation }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>(initialLocation || center);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;
    setIsLoading(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsLoading(false);
      if (status === "OK" && results && results[0]) {
        const address = results[0].formatted_address;
        setSelectedAddress(address);
        
        let city = '';
        let state = '';
        let pincode = '';
        
        results[0].address_components.forEach(component => {
          if (component.types.includes("locality")) city = component.long_name;
          if (component.types.includes("administrative_area_level_1")) state = component.long_name;
          if (component.types.includes("postal_code")) pincode = component.long_name;
        });

        onLocationSelect({
          lat,
          lng,
          address,
          city,
          state,
          pincode
        });
      }
    });
  }, [onLocationSelect]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [reverseGeocode]);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        map?.panTo({ lat, lng });
        reverseGeocode(lat, lng);
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPosition({ lat, lng });
          map?.panTo({ lat, lng });
          reverseGeocode(lat, lng);
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
          alert("Could not get your location.");
        }
      );
    }
  };

  if (!isLoaded) return <div className="h-[400px] flex items-center justify-center bg-muted rounded-xl"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Autocomplete
            onLoad={(ac) => setAutocomplete(ac)}
            onPlaceChanged={onPlaceChanged}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search hospital or area..." 
                className="pl-9 h-11"
              />
            </div>
          </Autocomplete>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          className="h-11 px-3" 
          onClick={getCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Navigation className="h-4 w-4" />}
        </Button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={markerPosition}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          <Marker position={markerPosition} draggable={true} onDragEnd={(e) => {
             if (e.latLng) {
               const lat = e.latLng.lat();
               const lng = e.latLng.lng();
               setMarkerPosition({ lat, lng });
               reverseGeocode(lat, lng);
             }
          }} />
        </GoogleMap>
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Loader2 className="animate-spin h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-slate-700">Getting location details...</span>
            </div>
          </div>
        )}
      </div>

      {selectedAddress && (
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Selected Address</p>
            <p className="text-sm font-bold text-slate-800 leading-snug">{selectedAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapPicker;

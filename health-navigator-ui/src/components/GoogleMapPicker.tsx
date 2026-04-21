import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Navigation, Search, CheckCircle2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

// Component to handle map click events
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Nominatim reverse geocode (free OpenStreetMap API)
const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  const addr = data.address || {};
  return {
    lat,
    lng,
    address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    city: addr.city || addr.town || addr.village || addr.county || '',
    state: addr.state || '',
    pincode: addr.postcode || '',
  };
};

// Nominatim forward search
const searchPlaces = async (query: string) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
    { headers: { 'Accept-Language': 'en' } }
  );
  return await res.json();
};

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({ onLocationSelect, initialLocation }) => {
  const defaultPos: [number, number] = [20.5937, 78.9629]; // India center
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : defaultPos
  );
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const mapRef = useRef<any>(null);
  const searchTimeout = useRef<any>(null);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setIsGeocoding(true);
    setIsConfirmed(false);
    try {
      const data = await reverseGeocode(lat, lng);
      setSelectedAddress(data.address);
      onLocationSelect(data);
      setIsConfirmed(true);
    } catch (e) {
      setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      onLocationSelect({ lat, lng, address: '', city: '', state: '', pincode: '' });
    } finally {
      setIsGeocoding(false);
    }
  }, [onLocationSelect]);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    setSuggestions([]);
    clearTimeout(searchTimeout.current);
    if (val.length < 3) return;
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlaces(val);
        setSuggestions(results);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const selectSuggestion = async (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setPosition([lat, lng]);
    setSuggestions([]);
    setSearchQuery(item.display_name?.split(',').slice(0, 2).join(',') || '');
    mapRef.current?.flyTo([lat, lng], 17);
    await handleMapClick(lat, lng);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        mapRef.current?.flyTo([lat, lng], 17);
        await handleMapClick(lat, lng);
      },
      () => setIsGeocoding(false)
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            value={searchQuery}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search hospital name, area or city..."
            className="pl-9 h-11"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white rounded-xl border border-border shadow-xl max-h-60 overflow-y-auto">
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 border-b border-border last:border-0 flex items-start gap-2 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-slate-700">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3 shrink-0"
          onClick={useCurrentLocation}
          title="Use my current location"
          disabled={isGeocoding}
        >
          {isGeocoding ? <Loader2 className="animate-spin h-4 w-4" /> : <Navigation className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 <strong>Tip:</strong> Search your hospital name above, or click directly on the map to pin location.
      </p>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: '380px' }}>
        <MapContainer
          center={position}
          zoom={initialLocation ? 15 : 5}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <Marker position={position} draggable={true} eventHandlers={{
            dragend: (e) => {
              const m = e.target;
              const pos = m.getLatLng();
              handleMapClick(pos.lat, pos.lng);
            }
          }} />
        </MapContainer>

        {isGeocoding && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-[1000]">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Loader2 className="animate-spin h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-slate-700">Fetching address...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Address */}
      {selectedAddress && (
        <div className={`p-4 rounded-xl border flex gap-3 transition-all ${isConfirmed ? 'bg-green-50 border-green-200' : 'bg-primary/5 border-primary/10'}`}>
          {isConfirmed
            ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            : <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          }
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isConfirmed ? 'text-green-600' : 'text-primary'}`}>
              {isConfirmed ? '✅ Location Confirmed' : 'Selected Location'}
            </p>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{selectedAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapPicker;

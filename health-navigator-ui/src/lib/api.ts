const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export interface BackendHospital {
  _id: string;
  userId: string;
  hospitalName: string;
  hospitalLogo?: string;
  navbarIcon?: string;
  adminName: string;
  city: string;
  contactNumber: string;
  officialEmail: string;
  description?: string;
  specialties?: string[];
  services?: { title: string; description?: string }[]; // Updated to array of objects
  workingDays?: string[];
  openingTime?: string;
  closingTime?: string;
  appointmentSlots?: { startTime?: string; endTime?: string };
  emergencyContactNumber?: string;
  emergency24x7?: boolean;
  ambulanceAvailable?: boolean; // New field
  fullAddress?: { address: string; city: string; state: string; pincode: string };
  location?: { lat: number; lng: number };
  gallery?: string[];
}

function toLocal(h: BackendHospital, index: number) {
  const resolveAssetUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE}/${url}`;
  };

  let image = "/assets/hospital-1.jpg";
  if (h.hospitalLogo) image = resolveAssetUrl(h.hospitalLogo) || image;

  return {
    _id: h._id,
    id: h._id,
    name: h.hospitalName,
    image,
    hospitalLogo: image, // Added for consistency
    navbarIcon: resolveAssetUrl(h.navbarIcon) || image,
    location: h.city || 'Unknown',
    city: h.city || 'Unknown',
    address: h.fullAddress?.address || h.city || 'Unknown',
    fullAddress: h.fullAddress,
    geoLocation: h.location,
    rating: 4.5,
    specialty: h.specialties && h.specialties.length > 0 ? h.specialties[0] : (h.description ? h.description.slice(0, 40) : 'General'),
    description: h.description || '',
    phone: h.contactNumber || '+91 98765 43210',
    email: h.officialEmail || `contact@${h.hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
    specialties: h.specialties || [],
    services: h.services || [],
    workingDays: h.workingDays || ['Monday - Friday'],
    hours: h.openingTime && h.closingTime ? `${h.openingTime} - ${h.closingTime}` : '8:00 AM - 9:00 PM',
    openingTime: h.openingTime,
    closingTime: h.closingTime,
    appointmentSlots: h.appointmentSlots,
    emergencyContactNumber: h.emergencyContactNumber,
    emergency24x7: h.emergency24x7 || false,
    ambulanceAvailable: h.ambulanceAvailable || false,
    gallery: Array.isArray(h.gallery) ? h.gallery.map(resolveAssetUrl).filter(Boolean) : [],
  };
}

export async function getHospitals() {
  try {
    const res = await fetch(`${BASE}/api/hospitals/all`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data: BackendHospital[] = await res.json();
    return data.map(toLocal);
  } catch (err) {
    console.warn('API getHospitals failed', err);
    return [];
  }
}

export async function getHospitalById(id: string) {
  try {
    const res = await fetch(`${BASE}/api/hospitals/${id}`);
    if (!res.ok) throw new Error('Not found');
    const h: BackendHospital = await res.json();
    return toLocal(h, 0);
  } catch (err) {
    console.warn('API getHospitalById failed', err);
    return null;
  }
}

export default {
  getHospitals,
  getHospitalById,
};

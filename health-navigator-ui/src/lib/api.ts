const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export interface BackendHospital {
  _id: string;
  userId: string;
  hospitalName: string;
  hospitalLogo?: string;
  adminName: string;
  city: string;
  address?: string;
  contactNumber: string;
  officialEmail: string;
  hospitalId: string;
  description?: string;
  specialties?: string[];
  services?: { title: string; description?: string }[]; // Updated to array of objects
  workingDays?: string[];
  openingTime?: string;
  closingTime?: string;
  emergency24x7?: boolean;
  ambulanceAvailable?: boolean; // New field
}

function toLocal(h: BackendHospital, index: number) {
  let image = "/assets/hospital-1.jpg";
  if (h.hospitalLogo) {
    if (h.hospitalLogo.startsWith('http')) {
      image = h.hospitalLogo;
    } else if (h.hospitalLogo.startsWith('uploads')) {
      image = `${BASE}/${h.hospitalLogo}`;
    } else {
      // Handle cases where it might just be a path or cloud url without protocol
      image = h.hospitalLogo;
    }
  }

  return {
    id: h._id,
    name: h.hospitalName,
    image,
    hospitalLogo: image, // Added for consistency
    location: h.city || 'Unknown',
    city: h.city || 'Unknown',
    address: h.address || h.city || 'Unknown',
    rating: 4.5,
    specialty: h.specialties && h.specialties.length > 0 ? h.specialties[0] : (h.description ? h.description.slice(0, 40) : 'General'),
    description: h.description || '',
    phone: h.contactNumber || '+91 98765 43210',
    email: h.officialEmail || `contact@${h.hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
    specialties: h.specialties || [],
    services: h.services || [],
    workingDays: h.workingDays || ['Monday - Friday'],
    hours: h.openingTime && h.closingTime ? `${h.openingTime} - ${h.closingTime}` : '8:00 AM - 9:00 PM',
    emergency24x7: h.emergency24x7 || false,
    ambulanceAvailable: h.ambulanceAvailable || false,
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

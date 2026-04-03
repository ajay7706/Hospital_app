import hospital1 from '@/assets/hospital-1.jpg';
import hospital2 from '@/assets/hospital-2.jpg';
import hospital3 from '@/assets/hospital-3.jpg';
import hospital4 from '@/assets/hospital-4.jpg';

export interface Hospital {
  id: string | number;
  name: string;
  image: string;
  location: string;
  rating: number;
  specialty: string;
}

const defaultHospitals: Hospital[] = [
  { id: 1, name: 'CityCare Hospital', image: hospital1, location: 'Downtown, New York', rating: 4.8, specialty: 'Cardiology' },
  { id: 2, name: 'MediLife Clinic', image: hospital2, location: 'Westside, Los Angeles', rating: 4.9, specialty: 'Pediatrics' },
  { id: 3, name: 'HealWell Hospital', image: hospital3, location: 'Northgate, Chicago', rating: 4.7, specialty: 'Oncology' },
  { id: 4, name: 'Global Heart Center', image: hospital4, location: 'Central, Houston', rating: 4.9, specialty: 'Cardiac Surgery' },
  { id: 5, name: 'Sunrise Medical Center', image: hospital1, location: 'Midtown, Dallas', rating: 4.6, specialty: 'Orthopedics' },
  { id: 6, name: 'GreenLeaf Dental Clinic', image: hospital2, location: 'Eastside, San Francisco', rating: 4.8, specialty: 'Dental' },
  { id: 7, name: 'NeuroLife Hospital', image: hospital3, location: 'Uptown, Boston', rating: 4.5, specialty: 'Neurology' },
  { id: 8, name: 'PrimeCare Hospital', image: hospital4, location: 'Downtown, Miami', rating: 4.7, specialty: 'Dermatology' },
  { id: 9, name: 'Metro Health Center', image: hospital1, location: 'Central, Philadelphia', rating: 4.6, specialty: 'Cardiology' },
  { id: 10, name: 'WellCare Clinic', image: hospital2, location: 'Lakeside, Seattle', rating: 4.8, specialty: 'Pediatrics' },
  { id: 11, name: 'BrightLife Hospital', image: hospital3, location: 'Southside, Atlanta', rating: 4.5, specialty: 'Neurology' },
  { id: 12, name: 'OrthoPlus Medical', image: hospital4, location: 'Downtown, Denver', rating: 4.7, specialty: 'Orthopedics' },
  { id: 13, name: 'HeartBeat Hospital', image: hospital1, location: 'Uptown, Phoenix', rating: 4.9, specialty: 'Cardiac Surgery' },
  { id: 14, name: 'KidsCare Clinic', image: hospital2, location: 'Westend, San Diego', rating: 4.8, specialty: 'Pediatrics' },
  { id: 15, name: 'CancerCare Institute', image: hospital3, location: 'Midtown, Washington DC', rating: 4.6, specialty: 'Oncology' },
  { id: 16, name: 'SkinGlow Dermatology', image: hospital4, location: 'Central, Las Vegas', rating: 4.4, specialty: 'Dermatology' },
];

const STORAGE_KEY = 'custom_hospitals';

export function getCustomHospitals(): Hospital[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addCustomHospital(hospital: Omit<Hospital, 'id'>): Hospital {
  const customs = getCustomHospitals();
  const maxId = Math.max(...defaultHospitals.map(h => h.id), ...customs.map(h => h.id), 0);
  const newHospital: Hospital = { ...hospital, id: maxId + 1 };
  customs.push(newHospital);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
  return newHospital;
}

export function getAllHospitals(): Hospital[] {
  return [...defaultHospitals, ...getCustomHospitals()];
}
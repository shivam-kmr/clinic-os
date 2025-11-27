import { create } from 'zustand';

interface Patient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hospitalId: string;
  patientId: string;
}

interface PatientState {
  patient: Patient | null;
  setPatient: (patient: Patient | null) => void;
  clearPatient: () => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patient: null,
  setPatient: (patient) => {
    set({ patient });
    if (patient) {
      localStorage.setItem('patient', JSON.stringify(patient));
    } else {
      localStorage.removeItem('patient');
    }
  },
  clearPatient: () => {
    set({ patient: null });
    localStorage.removeItem('patient');
    localStorage.removeItem('patientToken');
  },
}));

// Initialize from localStorage
const storedPatient = localStorage.getItem('patient');
if (storedPatient) {
  try {
    usePatientStore.getState().setPatient(JSON.parse(storedPatient));
  } catch (e) {
    // Invalid stored data
    localStorage.removeItem('patient');
  }
}


import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const HOSPITAL_ID = import.meta.env.VITE_HOSPITAL_ID;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and hospital ID to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('patientToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For localhost development, add hospital ID from env or localStorage
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    const hospitalId = HOSPITAL_ID || localStorage.getItem('hospitalId');
    if (hospitalId) {
      config.headers['X-Hospital-Id'] = hospitalId;
    }
  }
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patient');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Patient API endpoints
export const patientApi = {
  // Auth
  login: (data: { email: string; password: string }) =>
    api.post('/patient/auth/login', data),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/patient/auth/register', data),
  getMe: () => api.get('/patient/auth/me'),

  // Hospital info (public)
  getHospitalInfo: (hospitalId?: string) => {
    const params = hospitalId ? { hospitalId } : {};
    return api.get('/public/hospital', { params });
  },

  // Departments & Doctors
  getDepartments: () => api.get('/patient/departments'),
  getDoctors: (params?: { departmentId?: string }) =>
    api.get('/patient/doctors', { params }),
  getDoctor: (doctorId: string) => api.get(`/patient/doctors/${doctorId}`),

  // Appointments
  createAppointment: (data: {
    doctorId?: string;
    departmentId?: string;
    scheduledAt: string;
    type: 'TOKEN' | 'TIME_SLOT';
  }) => api.post('/patient/appointments', data),
  getAppointments: (params?: { status?: string }) =>
    api.get('/patient/appointments', { params }),
  getAppointment: (appointmentId: string) =>
    api.get(`/patient/appointments/${appointmentId}`),
  cancelAppointment: (appointmentId: string) =>
    api.patch(`/patient/appointments/${appointmentId}/cancel`),
  rescheduleAppointment: (appointmentId: string, scheduledAt: string) =>
    api.patch(`/patient/appointments/${appointmentId}/reschedule`, {
      scheduledAt,
    }),

  // Queue
  getQueuePosition: () => api.get('/patient/queue-position'),

  // History
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/patient/history', { params }),
};


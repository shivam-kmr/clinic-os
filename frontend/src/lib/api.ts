import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const appointmentsApi = {
  create: (data: any) => api.post('/appointments', data),
  list: (params?: any) => api.get('/appointments', { params }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  checkIn: (id: string) => api.post(`/appointments/${id}/check-in`),
  cancel: (id: string) => api.delete(`/appointments/${id}`),
  reschedule: (id: string, scheduledAt: string) =>
    api.patch(`/appointments/${id}/reschedule`, { scheduledAt }),
};

export const visitsApi = {
  create: (data: any) => api.post('/visits', data),
  getById: (id: string) => api.get(`/visits/${id}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/visits/${id}/status`, { status, notes }),
  reassign: (id: string, doctorId: string) =>
    api.post(`/visits/${id}/reassign`, { doctorId }),
  delay: (id: string, doctorId: string) =>
    api.post(`/visits/${id}/delay`, { doctorId }),
};

export const queueApi = {
  getDoctorQueue: (doctorId: string) => api.get(`/queue/doctor/${doctorId}`),
  getDepartmentQueue: (departmentId: string) =>
    api.get(`/queue/department/${departmentId}`),
  callNext: (doctorId: string) => api.post(`/queue/doctor/${doctorId}/next`),
  skip: (doctorId: string, visitId: string) =>
    api.post(`/queue/doctor/${doctorId}/skip`, { visitId }),
  complete: (doctorId: string, visitId: string) =>
    api.post(`/queue/doctor/${doctorId}/complete`, { visitId }),
};

export const setupApi = {
  getSetup: () => api.get('/setup'),
  createHospital: (data: any) => api.post('/setup/hospital', data),
  updateConfig: (data: any) => api.put('/setup/hospital/config', data),
  createDepartment: (data: any) => api.post('/setup/departments', data),
  createDoctor: (data: any) => api.post('/setup/doctors', data),
  createReceptionist: (data: any) => api.post('/setup/receptionists', data),
};

export const doctorsApi = {
  updateOnDuty: (doctorId: string, onDuty: boolean) =>
    api.patch(`/doctors/${doctorId}/on-duty`, { onDuty }),
};


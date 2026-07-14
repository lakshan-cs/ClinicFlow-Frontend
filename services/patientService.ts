import axios from 'axios';
import type { PatientPayload, PatientResponse } from '@/types/patient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5064';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Bearer token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type { PatientPayload, PatientResponse };

export const createPatient = (data: PatientPayload): Promise<PatientResponse> =>
  apiClient.post<PatientResponse>('/api/Patient', data).then((r) => r.data);

export const getAllPatients = (): Promise<PatientResponse[]> =>
  apiClient.get<PatientResponse[]>('/api/Patient').then((r) => r.data);

export const getPatientById = (id: string | number): Promise<PatientResponse> =>
  apiClient.get<PatientResponse>(`/api/Patient/${id}`).then((r) => r.data);

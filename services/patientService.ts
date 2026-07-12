import axios from 'axios';

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

export interface PatientPayload {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
}

export interface PatientResponse {
  id: string | number;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  [key: string]: unknown;
}

export const createPatient = (data: PatientPayload): Promise<PatientResponse> =>
  apiClient.post<PatientResponse>('/api/Patient', data).then((r) => r.data);

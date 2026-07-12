import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5064';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface PatientSymptom {
  symptom: string;
}

export interface PatientIntakePayload {
  patientId: number | string;
  chiefComplaint: string;
  notes?: string;
  patientSymptoms: PatientSymptom[];
}

export interface PatientIntakeResponse {
  id: string | number;
  patientId: string | number;
  chiefComplaint: string;
  notes?: string;
  patientSymptoms: PatientSymptom[];
  [key: string]: unknown;
}

export const createPatientIntake = (data: PatientIntakePayload): Promise<PatientIntakeResponse> =>
  apiClient.post<PatientIntakeResponse>('/api/patientintake', data).then((r) => r.data);

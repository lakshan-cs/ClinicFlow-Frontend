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

interface ChiefComplaintLookupApiItem {
  chiefComplaint?: unknown;
  chiefComplaintName?: unknown;
  complaintName?: unknown;
  name?: unknown;
  specialty?: unknown;
  specialtyName?: unknown;
  [key: string]: unknown;
}

export interface ChiefComplaintLookupItem {
  name: string;
  specialtyName?: string;
}

export interface ChiefComplaintSpecialtyLookup {
  id?: number | string;
  chiefComplaint: string;
  specialty: string;
}

const readLookupString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const mapChiefComplaintLookupItem = (
  item: ChiefComplaintLookupApiItem,
): ChiefComplaintLookupItem | null => {
  const name =
    readLookupString(item.chiefComplaintName) ||
    readLookupString(item.chiefComplaint) ||
    readLookupString(item.complaintName) ||
    readLookupString(item.name);

  if (!name) return null;

  const specialtyName =
    readLookupString(item.specialtyName) || readLookupString(item.specialty) || undefined;

  return { name, specialtyName };
};

export const createPatientIntake = (data: PatientIntakePayload): Promise<PatientIntakeResponse> =>
  apiClient.post<PatientIntakeResponse>('/api/patientintake', data).then((r) => r.data);

export const getChiefComplaintLookup = async (): Promise<ChiefComplaintLookupItem[]> => {
  const response = await apiClient.get<ChiefComplaintLookupApiItem[]>('/api/chiefcomplaintspecialtylookup');
  const seenNames = new Set<string>();

  return response.data.flatMap((item) => {
    const mappedItem = mapChiefComplaintLookupItem(item);
    if (!mappedItem) return [];

    const normalizedName = mappedItem.name.toLocaleLowerCase();
    if (seenNames.has(normalizedName)) return [];

    seenNames.add(normalizedName);
    return [mappedItem];
  });
};

export const getSpecialtyByChiefComplaint = async (
  chiefComplaint: string,
): Promise<ChiefComplaintSpecialtyLookup> => {
  const response = await apiClient.get<ChiefComplaintSpecialtyLookup>(
    `/api/chiefcomplaintspecialtylookup/chief-complaint/${encodeURIComponent(chiefComplaint)}`,
  );

  return response.data;
};

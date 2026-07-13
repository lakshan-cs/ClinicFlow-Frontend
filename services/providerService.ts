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

interface ProviderApiItem {
  id?: string | number;
  fullName?: unknown;
  name?: unknown;
  specialty?: unknown;
  [key: string]: unknown;
}

export interface ProviderItem {
  id: string;
  fullName: string;
  specialty: string;
}

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const mapProvider = (item: ProviderApiItem, index: number): ProviderItem | null => {
  const fullName = readText(item.fullName) || readText(item.name);
  if (!fullName) return null;

  const specialty = readText(item.specialty) || 'Specialist';
  const rawId = item.id;
  const id =
    typeof rawId === 'string' || typeof rawId === 'number'
      ? String(rawId)
      : `${fullName.toLowerCase().replace(/\s+/g, '-')}-${index}`;

  return { id, fullName, specialty };
};

export const getProvidersBySpecialty = async (specialty: string): Promise<ProviderItem[]> => {
  const response = await apiClient.get<ProviderApiItem[]>('/api/provider', {
    params: { specialty },
  });

  return response.data.flatMap((item, index) => {
    const mapped = mapProvider(item, index);
    return mapped ? [mapped] : [];
  });
};

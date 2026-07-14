import axios from 'axios';
import type { ProviderApiItem, ProviderItem } from '@/types/provider';

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

export type { ProviderItem };

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const readOptionalDate = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return Number.isNaN(Date.parse(normalized)) ? undefined : normalized;
};

const mapProvider = (item: ProviderApiItem, index: number): ProviderItem | null => {
  const fullName = readText(item.fullName) || readText(item.name);
  if (!fullName) return null;

  const specialty = readText(item.specialty) || 'Specialist';
  const rawId = item.id;
  const id =
    typeof rawId === 'string' || typeof rawId === 'number'
      ? String(rawId)
      : `${fullName.toLowerCase().replace(/\s+/g, '-')}-${index}`;

  const nextAvailableDate =
    readOptionalDate(item.nextAvailableDate) ||
    readOptionalDate(item.availableDate) ||
    readOptionalDate(item.nextSlotDate);

  return { id, fullName, specialty, nextAvailableDate };
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

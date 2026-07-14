import axios from 'axios';
import type {
  AppointmentApiItem,
  BookAppointmentRequest,
  ProviderAppointmentSlot,
} from '@/types/appointment';

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

export type { BookAppointmentRequest, ProviderAppointmentSlot };

const asText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const inferAvailability = (item: AppointmentApiItem): boolean => {
  if (typeof item.isAvailable === 'boolean') return item.isAvailable;

  const status = asText(item.status).toLowerCase();
  if (!status) return true;

  if (status.includes('available') || status.includes('open') || status.includes('free')) {
    return true;
  }

  if (status.includes('booked') || status.includes('reserved') || status.includes('cancelled') || status.includes('completed')) {
    return false;
  }

  return true;
};

const mapAppointmentSlot = (item: AppointmentApiItem, index: number): ProviderAppointmentSlot | null => {
  // Support dateTime field (e.g. "2026-07-14T08:00:00") as both the date and the start time.
  const rawDateTime = asText(item.dateTime);
  let appointmentDate = asText(item.appointmentDate) || asText(item.date);
  let startTime = asText(item.startTime) || asText(item.appointmentTime) || asText(item.time) || asText(item.slotStart) || undefined;

  if (!appointmentDate && rawDateTime) {
    appointmentDate = rawDateTime.split('T')[0];
  }
  if (!startTime && rawDateTime && rawDateTime.includes('T')) {
    startTime = rawDateTime.split('T')[1].substring(0, 5); // "HH:MM"
  }

  if (!appointmentDate) return null;
  const endTime = asText(item.endTime) || asText(item.slotEnd) || undefined;
  const status = asText(item.status) || undefined;
  const rawId = item.id;
  const id =
    typeof rawId === 'string' || typeof rawId === 'number'
      ? String(rawId)
      : `${appointmentDate}-${startTime || 'slot'}-${index}`;

  return {
    id,
    appointmentDate,
    startTime,
    endTime,
    status,
    isAvailable: inferAvailability(item),
  };
};

export const getProviderAppointments = async (providerId: string | number): Promise<ProviderAppointmentSlot[]> => {
  const response = await apiClient.get<AppointmentApiItem[]>(`/api/appointment/provider/${providerId}`);

  return response.data.flatMap((item, index) => {
    const mapped = mapAppointmentSlot(item, index);
    return mapped ? [mapped] : [];
  });
};

export const bookAppointment = async (payload: BookAppointmentRequest): Promise<void> => {
  await apiClient.post('/api/appointment', payload);
};

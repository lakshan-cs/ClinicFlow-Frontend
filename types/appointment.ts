export interface AppointmentApiItem {
  id?: string | number;
  appointmentDate?: unknown;
  dateTime?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  appointmentTime?: unknown;
  time?: unknown;
  slotStart?: unknown;
  slotEnd?: unknown;
  status?: unknown;
  isAvailable?: unknown;
  [key: string]: unknown;
}

export interface ProviderAppointmentSlot {
  id: string;
  appointmentDate: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  isAvailable: boolean;
}

export interface BookAppointmentRequest {
  patientId: number;
  clinicId: number;
  providerId: number;
  dateTime: string;
}

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

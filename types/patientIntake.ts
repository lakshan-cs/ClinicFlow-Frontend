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

export interface ChiefComplaintLookupApiItem {
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

export interface IntakeFlowState {
  intakeId: string;
  patientId: string | number;
  chiefComplaint: string;
  symptoms: string[];
  providerId?: string;
  providerName?: string;
  providerSpecialty?: string;
}

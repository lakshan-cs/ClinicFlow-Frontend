import type { Control, FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { ProviderItem } from '@/types/provider';

export interface IntakeStepItem {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  label: string;
  desc: string;
}

export interface IntakeStepperProps {
  activeStep: number;
  baseLabelWeight?: number;
}

export interface PatientSummaryModel {
  id: string | number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
}

export interface PatientSummaryProps {
  patient: PatientSummaryModel | null;
  emptyMessage: string;
  nameClassName?: string;
  showStep2Summary?: boolean;
  chiefComplaint?: string | null;
  selectedSymptoms?: string[];
  showDoctorSummary?: boolean;
  providerName?: string | null;
  providerSpecialty?: string | null;
}

export interface PatientRegistrationFormValues {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
}

export interface PatientRegistrationFormProps {
  control: Control<PatientRegistrationFormValues>;
  errors: FieldErrors<PatientRegistrationFormValues>;
  handleSubmit: UseFormHandleSubmit<PatientRegistrationFormValues>;
  onSubmit: SubmitHandler<PatientRegistrationFormValues>;
  loading: boolean;
  canSkip: boolean;
  onSkip: () => void;
}

export interface SymptomsFormValues {
  chiefComplaint: string;
  notes?: string;
}

export interface SymptomsFormProps {
  control: Control<SymptomsFormValues>;
  register: UseFormRegister<SymptomsFormValues>;
  errors: FieldErrors<SymptomsFormValues>;
  handleSubmit: UseFormHandleSubmit<SymptomsFormValues>;
  onSubmit: SubmitHandler<SymptomsFormValues>;
  chiefComplaintData: { value: string; label: string }[];
  chiefComplaintLoading: boolean;
  symptomInputRef: React.RefObject<HTMLInputElement | null>;
  symptomInput: string;
  setSymptomInput: (value: string) => void;
  symptoms: string[];
  addSymptom: () => void;
  removeSymptom: (symptom: string) => void;
  onBack: () => void;
  loading: boolean;
}

export type DoctorCardProvider = ProviderItem;

export interface DoctorCardProps {
  provider: DoctorCardProvider;
  recommendedSpecialty: string;
  availabilityLabel: string;
  onSelectDoctor: (provider: DoctorCardProvider) => void;
}

export interface AppointmentSlot {
  startTime: string;
  endTime: string;
  label: string;
}

export interface BookedAppointment {
  id: string | number;
  startTime?: string;
}

export interface AppointmentSlotPickerProps {
  loadingSlots: boolean;
  availableSlots: AppointmentSlot[];
  booking: boolean;
  targetLabel: string;
  bookedAppointments: BookedAppointment[];
  onSelectSlot: (slot: AppointmentSlot) => void;
  extractMinutes: (time: string) => number;
  formatTime: (totalMinutes: number) => string;
  slotDurationMins: number;
}

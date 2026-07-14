import type { IntakeFlowState } from '@/types/intakeFlow';

const STORAGE_PREFIX = 'clinicflow:intake-flow:';

const getStorageKey = (intakeId: string | number): string => `${STORAGE_PREFIX}${String(intakeId)}`;

const readStorage = (intakeId: string | number): IntakeFlowState | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(getStorageKey(intakeId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as IntakeFlowState;
  } catch {
    return null;
  }
};

export const loadIntakeFlow = (intakeId: string | number): IntakeFlowState | null => readStorage(intakeId);

export const saveIntakeFlow = (intakeId: string | number, nextState: Partial<IntakeFlowState>): IntakeFlowState | null => {
  if (typeof window === 'undefined') return null;

  const currentState = readStorage(intakeId) ?? {
    intakeId: String(intakeId),
    patientId: '',
    chiefComplaint: '',
    symptoms: [],
  };

  const mergedState: IntakeFlowState = {
    ...currentState,
    ...nextState,
    intakeId: String(intakeId),
    symptoms: nextState.symptoms ?? currentState.symptoms,
  };

  window.sessionStorage.setItem(getStorageKey(intakeId), JSON.stringify(mergedState));
  return mergedState;
};

export const clearIntakeFlow = (intakeId: string | number): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(getStorageKey(intakeId));
};

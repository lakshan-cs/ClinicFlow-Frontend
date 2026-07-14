export interface ProviderApiItem {
  id?: string | number;
  fullName?: unknown;
  name?: unknown;
  specialty?: unknown;
  nextAvailableDate?: unknown;
  availableDate?: unknown;
  nextSlotDate?: unknown;
  [key: string]: unknown;
}

export interface ProviderItem {
  id: string;
  fullName: string;
  specialty: string;
  nextAvailableDate?: string;
}

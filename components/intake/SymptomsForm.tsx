import { Autocomplete, Badge, Button, Group, Loader, Stack, Text, Textarea, ThemeIcon, Title } from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconClipboardList,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import type { Control, FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';

export interface SymptomsFormValues {
  chiefComplaint: string;
  notes?: string;
}

interface SymptomsFormProps {
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

export default function SymptomsForm({
  control,
  register,
  errors,
  handleSubmit,
  onSubmit,
  chiefComplaintData,
  chiefComplaintLoading,
  symptomInputRef,
  symptomInput,
  setSymptomInput,
  symptoms,
  addSymptom,
  removeSymptom,
  onBack,
  loading,
}: SymptomsFormProps) {
  return (
    <Stack gap={32}>
      <div>
        <Group gap={12} mb={4}>
          <ThemeIcon size={44} radius="xl" color="violet" variant="light">
            <IconClipboardList size={22} />
          </ThemeIcon>
          <div>
            <Title order={2} className="text-gray-800 font-bold text-2xl">
              Record Symptoms
            </Title>
            <Text size="sm" c="dimmed" mt={2}>
              Step 2 of 4 — Document the patient&apos;s chief complaint and symptoms
            </Text>
          </div>
        </Group>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap={20}>
          <Controller
            name="chiefComplaint"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                value={field.value ?? ''}
                data={chiefComplaintData}
                renderOption={({ option }) => (
                  <div
                    className="py-2"
                    style={{
                      fontSize: '16px',
                      fontWeight: 200,
                      color: '#020617',
                      lineHeight: 1.5,
                      letterSpacing: '0.01em',
                    }}
                  >
                    <Text inherit>
                      {String(
                        typeof option === 'object' && option !== null && 'label' in option
                          ? option.label
                          : option,
                      )}
                    </Text>
                  </div>
                )}
                label="Chief Complaint"
                placeholder="e.g. Fever and sore throat for 2 days"
                description="Search an existing chief complaint or type a new one."
                required
                error={errors.chiefComplaint?.message}
                rightSection={chiefComplaintLoading ? <Loader size={16} /> : null}
                size="md"
                maxDropdownHeight={280}
                styles={{
                  label: { fontWeight: 600, color: '#374151', marginBottom: 6 },
                  input: { backgroundColor: '#f8fafc', borderColor: errors.chiefComplaint ? '#ef4444' : '#e2e8f0' },
                  dropdown: { borderColor: '#cbd5e1', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)' },
                  option: {
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingLeft: 14,
                    paddingRight: 14,
                    color: '#020617',
                    fontSize: 16,
                    fontWeight: 700,
                  },
                }}
              />
            )}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Symptoms <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={symptomInputRef}
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }}
                placeholder="Enter a symptom..."
                className="flex-1 px-3 py-2.5 text-sm rounded-md border border-slate-200 bg-slate-50 text-gray-800 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              />
              <button
                type="button"
                onClick={addSymptom}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0d6efd' }}
              >
                <IconPlus size={15} />
                Add
              </button>
            </div>

            {symptoms.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Added Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom) => (
                    <Badge
                      key={symptom}
                      size="lg"
                      variant="light"
                      color="violet"
                      rightSection={
                        <button
                          type="button"
                          onClick={() => removeSymptom(symptom)}
                          className="ml-1 hover:text-red-500 transition-colors"
                        >
                          <IconX size={12} />
                        </button>
                      }
                    >
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Textarea
            {...register('notes')}
            label="Notes (Optional)"
            placeholder="e.g. Symptoms worsen at night. No chest pain."
            minRows={3}
            maxRows={6}
            autosize
            error={errors.notes?.message}
            size="md"
            styles={{
              label: { fontWeight: 600, color: '#374151', marginBottom: 6 },
              input: { backgroundColor: '#f8fafc', borderColor: errors.notes ? '#ef4444' : '#e2e8f0' },
            }}
          />

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              size="lg"
              radius="xl"
              variant="outline"
              onClick={onBack}
              leftSection={<IconArrowLeft size={18} />}
              style={{ flex: 1, fontWeight: 600, borderColor: '#e2e8f0', color: '#374151' }}
            >
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              radius="xl"
              loading={loading}
              rightSection={!loading && <IconArrowRight size={18} />}
              style={{ flex: 1, backgroundColor: '#0d6efd', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(13,110,253,0.30)' }}
            >
              Save &amp; Continue
            </Button>
          </div>
        </Stack>
      </form>
    </Stack>
  );
}

import { Button, Group, Input, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import {
  IconArrowRight,
  IconMail,
  IconPhone,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react';
import { Controller } from 'react-hook-form';
import type { Control, FieldErrors, SubmitHandler, UseFormHandleSubmit } from 'react-hook-form';

export interface PatientRegistrationFormValues {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
}

interface PatientRegistrationFormProps {
  control: Control<PatientRegistrationFormValues>;
  errors: FieldErrors<PatientRegistrationFormValues>;
  handleSubmit: UseFormHandleSubmit<PatientRegistrationFormValues>;
  onSubmit: SubmitHandler<PatientRegistrationFormValues>;
  loading: boolean;
  canSkip: boolean;
  onSkip: () => void;
}

export default function PatientRegistrationForm({
  control,
  errors,
  handleSubmit,
  onSubmit,
  loading,
  canSkip,
  onSkip,
}: PatientRegistrationFormProps) {
  return (
    <Stack gap={32}>
      <div>
        <Group gap={12} mb={4}>
          <ThemeIcon size={44} radius="xl" color="blue" variant="light">
            <IconUserPlus size={22} />
          </ThemeIcon>
          <div>
            <Title order={2} className="text-gray-800 font-bold text-2xl">
              Patient Registration
            </Title>
            <Text size="sm" c="dimmed" mt={2}>
              Step 1 of 4 — Enter the patient&apos;s personal details
            </Text>
          </div>
        </Group>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap={20}>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Full Name"
                placeholder="e.g. Jane Doe"
                required
                error={errors.fullName?.message}
                size="md"
                leftSection={<IconUser size={16} className="text-blue-400" />}
                styles={{
                  label: { fontWeight: 600, color: '#374151', marginBottom: 6 },
                  input: { backgroundColor: '#f8fafc', borderColor: errors.fullName ? '#ef4444' : '#e2e8f0' },
                }}
              />
            )}
          />

          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <Input.Wrapper
                label="Date of Birth"
                required
                error={errors.dateOfBirth?.message}
                styles={{ label: { fontWeight: 600, color: '#374151', marginBottom: 6 } }}
              >
                <Input
                  component="input"
                  {...field}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  size="md"
                  error={!!errors.dateOfBirth}
                  styles={{
                    input: {
                      backgroundColor: '#f8fafc',
                      borderColor: errors.dateOfBirth ? '#ef4444' : '#e2e8f0',
                      colorScheme: 'light',
                      color: field.value ? '#1f2937' : '#9ca3af',
                    },
                  }}
                />
              </Input.Wrapper>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="Email Address"
                  placeholder="patient@example.com"
                  type="email"
                  required
                  error={errors.email?.message}
                  size="md"
                  leftSection={<IconMail size={16} className="text-blue-400" />}
                  styles={{
                    label: { fontWeight: 600, color: '#374151', marginBottom: 6 },
                    input: { backgroundColor: '#f8fafc', borderColor: errors.email ? '#ef4444' : '#e2e8f0' },
                  }}
                />
              )}
            />

            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  required
                  error={errors.phoneNumber?.message}
                  size="md"
                  leftSection={<IconPhone size={16} className="text-blue-400" />}
                  styles={{
                    label: { fontWeight: 600, color: '#374151', marginBottom: 6 },
                    input: { backgroundColor: '#f8fafc', borderColor: errors.phoneNumber ? '#ef4444' : '#e2e8f0' },
                  }}
                />
              )}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              size="lg"
              radius="xl"
              style={{ flex: 1, backgroundColor: '#0d6efd', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(13,110,253,0.30)' }}
              loading={loading}
              rightSection={!loading && <IconArrowRight size={18} />}
            >
              Save &amp; Continue
            </Button>
            <Button
              type="button"
              size="lg"
              radius="xl"
              variant="outline"
              disabled={!canSkip}
              onClick={onSkip}
              style={{ flex: 1, fontWeight: 600, borderColor: canSkip ? '#0d6efd' : '#e2e8f0', color: canSkip ? '#0d6efd' : '#94a3b8' }}
              rightSection={<IconArrowRight size={18} />}
            >
              Skip — Use Selected Patient
            </Button>
          </div>
        </Stack>
      </form>
    </Stack>
  );
}

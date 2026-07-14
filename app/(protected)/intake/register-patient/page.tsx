'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  Paper,
  Title,
  Text,
  Button,
  TextInput,
  Input,
  Stack,
  Group,
  ThemeIcon,
  Stepper,
} from '@mantine/core';

import { notifications } from '@mantine/notifications';
import {
  IconUserPlus,
  IconClipboardList,
  IconStethoscope,
  IconCalendarCheck,
  IconHeartbeat,
  IconArrowRight,
  IconUser,
  IconMail,
  IconPhone,
  IconLogout,
  IconSearch,
  IconUserCircle,
} from '@tabler/icons-react';
import { createPatient, getAllPatients, PatientResponse } from '../../../../services/patientService';
import { getUser } from '../../../../services/authService';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const patientSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Please enter a valid date' })
    .refine((val) => new Date(val) <= new Date(), { message: 'Date of birth cannot be in the future' })
    .refine((val) => new Date().getFullYear() - new Date(val).getFullYear() <= 130, { message: 'Please enter a valid date of birth' }),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^\+?[0-9\s\-().]{7,20}$/,
      'Enter a valid phone number (7–20 digits, optional +, spaces, dashes)',
    ),
});

type PatientFormValues = z.infer<typeof patientSchema>;

// ---------------------------------------------------------------------------
// Wizard step metadata (mirrors dashboard)
// ---------------------------------------------------------------------------
const STEPS = [
  { icon: IconUserPlus,      color: 'blue',   label: 'Register Patient',  desc: 'Patient details & contact info' },
  { icon: IconClipboardList, color: 'violet', label: 'Record Symptoms',   desc: 'Chief complaints & symptoms' },
  { icon: IconStethoscope,   color: 'teal',   label: 'Select a Doctor',   desc: 'Match with a specialist' },
  { icon: IconCalendarCheck, color: 'green',  label: 'Book Appointment',  desc: 'Schedule & confirm' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [allPatients, setAllPatients] = useState<PatientResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<PatientResponse | null>(null);

  // The patient to display in sidebar — newly registered takes priority over search selection
  const summaryPatient = registeredPatient ?? selectedPatient;

  const filteredPatients = allPatients.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auth guard
  useEffect(() => {
    if (!getUser()) router.replace('/login');
    getAllPatients().then(setAllPatients).catch(() => {});
  }, [router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { fullName: '', dateOfBirth: '', email: '', phoneNumber: '' },
  });

  const onSubmit = async (data: PatientFormValues) => {
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        phoneNumber: data.phoneNumber,
      };

      const patient = await createPatient(payload);

      setRegisteredPatient(patient);

      notifications.show({
        title: 'Success',
        message: `Patient registered successfully`,
        color: 'green',
      });

      // Proceed to step 2 — pass patientId via search param
      router.push(`/intake/record-symptoms?patientId=${patient.id}`);
    } catch (error) {
      let errorMessage = 'Could not save patient. Please try again.';

      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          errorMessage;
      }

      notifications.show({
        title: 'Registration failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.clear();
    router.replace('/login');
  };

  const handleSkipWithSelectedPatient = () => {
    const patientToUse = selectedPatient ?? registeredPatient;
    const patientId = patientToUse?.id;

    if (patientId === undefined || patientId === null || String(patientId).trim() === '') {
      notifications.show({
        title: 'No patient selected',
        message: 'Please select a patient from search results before continuing.',
        color: 'yellow',
      });
      return;
    }

    router.push(`/intake/record-symptoms?patientId=${encodeURIComponent(String(patientId))}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#1a3c5e' }}>
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <Group gap={10}>
            <ThemeIcon size={36} radius="xl" color="blue" variant="light">
              <IconHeartbeat size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm" style={{ color: '#f1f5f9' }} lh={1.2}>ClinicFlow</Text>
              <Text size="xs" style={{ color: '#94a3b8' }}>Patient Intake</Text>
            </div>
          </Group>
        </div>

        {/* Empty space — patient details will appear here later */}
        <div className="flex-1 px-4 py-5">
          {summaryPatient ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Patient Summary</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(99,179,237,0.2)' }}>
                    <IconUserCircle size={22} style={{ color: '#93c5fd' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" style={{ color: '#f1f5f9' }}>{summaryPatient.fullName}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>ID #{summaryPatient.id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <IconMail size={13} style={{ color: '#94a3b8', marginTop: 2 }} />
                    <p className="text-xs break-all" style={{ color: '#cbd5e1' }}>{summaryPatient.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconPhone size={13} style={{ color: '#94a3b8' }} />
                    <p className="text-xs" style={{ color: '#cbd5e1' }}>{summaryPatient.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconUser size={13} style={{ color: '#94a3b8' }} />
                    <p className="text-xs" style={{ color: '#cbd5e1' }}>DOB: {summaryPatient.dateOfBirth?.split('T')[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <IconUserCircle size={36} style={{ color: '#334d66', marginBottom: 8 }} />
              <p className="text-xs" style={{ color: '#4a6580' }}>Patient summary will appear here after registration or selection.</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#ef4444' }}
          >
            <IconLogout size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 overflow-y-auto">
      <div className="w-full max-w-6xl">

        {/* ── Search bar ── */}
        <div className="relative mb-6">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition-all">
            <IconSearch size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search existing patients by name before registering..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchOpen(false); setSelectedPatient(null); }} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Dropdown */}
          {searchOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients registered yet.'}
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                    onMouseDown={() => {
                      setSearchQuery(p.fullName);
                      setSelectedPatient(p);
                      setSearchOpen(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <IconUserCircle size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.fullName}</p>
                      <p className="text-xs text-slate-400">{p.email} &bull; DOB: {p.dateOfBirth?.split('T')[0]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Wizard stepper ── */}
        <Paper
          radius="xl"
          p={28}
          mb={24}
          className="border border-blue-100"
          style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.08)' }}
        >
          <Stepper
            active={0}
            size="sm"
            color="blue"
            styles={{
              root: { width: '100%' },
              steps: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
              stepLabel: { fontWeight: 700, fontSize: 13, color: '#1e3a5f', whiteSpace: 'nowrap' },
              stepDescription: { fontSize: 11, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap' },
              separator: { borderColor: '#bfdbfe', borderWidth: 2, flex: 1 },
              step: { gap: 8 },
            }}
          >
            {STEPS.map((s, idx) => {
              const isActive = idx === 0;
              return (
                <Stepper.Step
                  key={s.label}
                  label={s.label}
                  description={s.desc}
                  styles={{
                    stepLabel: {
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 13,
                      color: isActive ? '#1e3a5f' : '#94a3b8',
                      whiteSpace: 'nowrap',
                    },
                    stepDescription: {
                      fontSize: 11,
                      color: isActive ? '#64748b' : '#cbd5e1',
                      marginTop: 1,
                      whiteSpace: 'nowrap',
                    },
                  }}
                  icon={
                    <ThemeIcon
                      size={26}
                      radius="xl"
                      color={s.color}
                      variant={isActive ? 'light' : 'subtle'}
                      style={{ opacity: isActive ? 1 : 0.4 }}
                    >
                      <s.icon size={14} />
                    </ThemeIcon>
                  }
                />
              );
            })}
          </Stepper>
        </Paper>

        {/* ── Form card ── */}
        <Paper
          shadow="md"
          radius="xl"
          p={48}
          className="w-full border border-blue-100"
          style={{ boxShadow: '0 8px 48px rgba(59,130,246,0.10)' }}
        >
          <Stack gap={32}>

            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack gap={20}>

                {/* Full Name */}
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

                {/* Date of Birth */}
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

                {/* Email + Phone side by side */}
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

                {/* Submit */}
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
                    disabled={!selectedPatient && !registeredPatient}
                    onClick={handleSkipWithSelectedPatient}
                    style={{ flex: 1, fontWeight: 600, borderColor: selectedPatient || registeredPatient ? '#0d6efd' : '#e2e8f0', color: selectedPatient || registeredPatient ? '#0d6efd' : '#94a3b8' }}
                    rightSection={<IconArrowRight size={18} />}
                  >
                    Skip — Use Selected Patient
                  </Button>
                </div>

              </Stack>
            </form>
          </Stack>
        </Paper>

      </div>
      </div>
    </div>
  );
}

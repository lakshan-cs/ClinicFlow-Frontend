'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  Paper,
  Text,
  Group,
  ThemeIcon,
} from '@mantine/core';

import { notifications } from '@mantine/notifications';
import {
  IconUserPlus,
  IconClipboardList,
  IconStethoscope,
  IconCalendarCheck,
  IconHeartbeat,
  IconLogout,
  IconSearch,
  IconUserCircle,
} from '@tabler/icons-react';
import { createPatient, getAllPatients, PatientResponse } from '../../../../services/patientService';
import { getUser } from '../../../../services/authService';
import IntakeStepper from '@/components/intake/IntakeStepper';
import PatientSummary from '@/components/intake/PatientSummary';
import PatientRegistrationForm, { type PatientRegistrationFormValues } from '@/components/intake/PatientRegistrationForm';

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

type PatientFormValues = PatientRegistrationFormValues;

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
          <PatientSummary
            patient={summaryPatient}
            emptyMessage="Patient summary will appear here after registration or selection."
            nameClassName="text-sm font-bold leading-tight"
          />
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
        <IntakeStepper steps={STEPS} activeStep={0} baseLabelWeight={700} />

        {/* ── Form card ── */}
        <Paper
          shadow="md"
          radius="xl"
          p={48}
          className="w-full border border-blue-100"
          style={{ boxShadow: '0 8px 48px rgba(59,130,246,0.10)' }}
        >
          <PatientRegistrationForm
            control={control}
            errors={errors}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            loading={loading}
            canSkip={!!selectedPatient || !!registeredPatient}
            onSkip={handleSkipWithSelectedPatient}
          />
        </Paper>

      </div>
      </div>
    </div>
  );
}

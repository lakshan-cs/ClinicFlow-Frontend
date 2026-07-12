'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Paper,
  Title,
  Text,
  Button,
  TextInput,
  Textarea,
  Stack,
  Group,
  ThemeIcon,
  Stepper,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconHeartbeat,
  IconUserPlus,
  IconClipboardList,
  IconStethoscope,
  IconCalendarCheck,
  IconArrowRight,
  IconArrowLeft,
  IconPlus,
  IconX,
  IconLogout,
  IconUserCircle,
  IconMail,
  IconPhone,
  IconUser,
} from '@tabler/icons-react';
import { createPatientIntake } from '../../services/patientIntakeService';
import { getPatientById, PatientResponse } from '../../services/patientService';
import { getUser } from '../../services/authService';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const symptomsSchema = z.object({
  chiefComplaint: z
    .string()
    .min(3, 'Chief complaint must be at least 3 characters')
    .max(300, 'Chief complaint must be less than 300 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

type SymptomsFormValues = z.infer<typeof symptomsSchema>;

// ---------------------------------------------------------------------------
// Wizard step metadata
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
export default function SymptomsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const symptomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getUser()) router.replace('/login');
    if (!patientId) { router.replace('/register-patient'); return; }
    getPatientById(patientId).then(setPatient).catch(() => {});
  }, [router, patientId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SymptomsFormValues>({
    resolver: zodResolver(symptomsSchema),
    defaultValues: { chiefComplaint: '', notes: '' },
  });

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.clear();
    router.replace('/login');
  };

  const addSymptom = () => {
    const trimmed = symptomInput.trim();
    if (!trimmed) return;
    if (symptoms.includes(trimmed)) {
      notifications.show({ title: 'Duplicate', message: 'This symptom has already been added.', color: 'yellow' });
      return;
    }
    setSymptoms((prev) => [...prev, trimmed]);
    setSymptomInput('');
    symptomInputRef.current?.focus();
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const onSubmit = async (data: SymptomsFormValues) => {
    if (symptoms.length === 0) {
      notifications.show({ title: 'Symptoms required', message: 'Please add at least one symptom.', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const intake = await createPatientIntake({
        patientId: patientId!,
        chiefComplaint: data.chiefComplaint,
        notes: data.notes || undefined,
        patientSymptoms: symptoms.map((s) => ({ symptom: s })),
      });

      notifications.show({
        title: 'Symptoms recorded',
        message: 'Patient intake saved successfully.',
        color: 'green',
      });

      router.push(`/select-doctor?patientId=${patientId}&intakeId=${intake.id}`);
    } catch (err: unknown) {
      let message = 'Could not save symptoms. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const data = (err as { response: { data: unknown } }).response?.data;
        if (typeof data === 'string') message = data;
        else if (data && typeof data === 'object' && 'message' in data) message = String((data as { message: unknown }).message);
        else if (data && typeof data === 'object' && 'title' in data) message = String((data as { title: unknown }).title);
      }
      notifications.show({ title: 'Error', message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#1a3c5e' }}>
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

        {/* Patient Summary */}
        <div className="flex-1 px-4 py-5">
          {patient ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Patient Summary</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(99,179,237,0.2)' }}>
                    <IconUserCircle size={22} style={{ color: '#93c5fd' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" style={{ color: '#f1f5f9' }}>{patient.fullName}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>ID #{patient.id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <IconMail size={13} style={{ color: '#94a3b8', marginTop: 2 }} />
                    <p className="text-xs break-all" style={{ color: '#cbd5e1' }}>{patient.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconPhone size={13} style={{ color: '#94a3b8' }} />
                    <p className="text-xs" style={{ color: '#cbd5e1' }}>{patient.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconUser size={13} style={{ color: '#94a3b8' }} />
                    <p className="text-xs" style={{ color: '#cbd5e1' }}>DOB: {patient.dateOfBirth?.split('T')[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <IconUserCircle size={36} style={{ color: '#334d66', marginBottom: 8 }} />
              <p className="text-xs" style={{ color: '#4a6580' }}>Loading patient info...</p>
            </div>
          )}
        </div>
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

          {/* ── Wizard stepper ── */}
          <Paper
            radius="xl"
            p={28}
            mb={24}
            className="border border-blue-100"
            style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.08)' }}
          >
            <Stepper
              active={1}
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
                const isActive = idx === 1;
                return (
                  <Stepper.Step
                    key={s.label}
                    label={s.label}
                    description={s.desc}
                    styles={{
                      stepLabel: { fontWeight: isActive ? 700 : 500, fontSize: 13, color: isActive ? '#1e3a5f' : '#94a3b8', whiteSpace: 'nowrap' },
                      stepDescription: { fontSize: 11, color: isActive ? '#64748b' : '#cbd5e1', marginTop: 1, whiteSpace: 'nowrap' },
                    }}
                    icon={
                      <ThemeIcon size={26} radius="xl" color={s.color} variant={isActive ? 'light' : 'subtle'} style={{ opacity: isActive ? 1 : 0.4 }}>
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

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack gap={20}>

                  {/* Chief Complaint */}
                  <TextInput
                    {...register('chiefComplaint')}
                    label="Chief Complaint"
                    placeholder="e.g. Fever and sore throat for 2 days"
                    required
                    error={errors.chiefComplaint?.message}
                    size="md"
                    styles={{
                      label: { fontWeight: 600, color: '#374151', marginBottom: 6 },
                      input: { backgroundColor: '#f8fafc', borderColor: errors.chiefComplaint ? '#ef4444' : '#e2e8f0' },
                    }}
                  />

                  {/* Symptoms input */}
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

                    {/* Symptom tags */}
                    {symptoms.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Added Symptoms</p>
                        <div className="flex flex-wrap gap-2">
                          {symptoms.map((s) => (
                            <Badge
                              key={s}
                              size="lg"
                              variant="light"
                              color="violet"
                              rightSection={
                                <button
                                  type="button"
                                  onClick={() => removeSymptom(s)}
                                  className="ml-1 hover:text-red-500 transition-colors"
                                >
                                  <IconX size={12} />
                                </button>
                              }
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
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

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      size="lg"
                      radius="xl"
                      variant="outline"
                      onClick={() => router.back()}
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
          </Paper>

        </div>
      </div>
    </div>
  );
}

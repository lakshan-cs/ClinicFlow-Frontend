'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Paper,
  Text,
  Group,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconHeartbeat,
  IconUserPlus,
  IconClipboardList,
  IconStethoscope,
  IconCalendarCheck,
  IconLogout,
} from '@tabler/icons-react';
import {
  createPatientIntake,
  getChiefComplaintLookup,
  type ChiefComplaintLookupItem,
} from '../../../../services/patientIntakeService';
import { getPatientById, PatientResponse } from '../../../../services/patientService';
import { getUser } from '../../../../services/authService';
import IntakeStepper from '@/components/intake/IntakeStepper';
import PatientSummary from '@/components/intake/PatientSummary';
import SymptomsForm, { type SymptomsFormValues } from '@/components/intake/SymptomsForm';
import { symptomsSchema } from '@/schemas/intake';
import { saveIntakeFlow } from '@/utils/intakeFlowStorage';

type SymptomsPageFormValues = SymptomsFormValues;

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
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50" />}>
      <SymptomsPageContent />
    </Suspense>
  );
}

function SymptomsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [chiefComplaintOptions, setChiefComplaintOptions] = useState<ChiefComplaintLookupItem[]>([]);
  const [chiefComplaintLoading, setChiefComplaintLoading] = useState(true);
  const symptomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getUser()) router.replace('/login');
    if (!patientId) { router.replace('/intake/register-patient'); return; }
    getPatientById(patientId).then(setPatient).catch(() => {});
  }, [router, patientId]);

  useEffect(() => {
    let isActive = true;

    getChiefComplaintLookup()
      .then((items) => {
        if (isActive) setChiefComplaintOptions(items);
      })
      .catch(() => {
        notifications.show({
          title: 'Chief complaints unavailable',
          message: 'Existing chief complaints could not be loaded. You can still type a new one.',
          color: 'yellow',
        });
      })
      .finally(() => {
        if (isActive) setChiefComplaintLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SymptomsPageFormValues>({
    resolver: zodResolver(symptomsSchema),
    defaultValues: { chiefComplaint: '', notes: '' },
  });

  const chiefComplaintData = chiefComplaintOptions.map((item) => ({
    value: item.name,
    label: item.name,
  }));

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

  const onSubmit = async (data: SymptomsPageFormValues) => {
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

      saveIntakeFlow(intake.id, {
        intakeId: String(intake.id),
        patientId: patientId!,
        chiefComplaint: data.chiefComplaint,
        symptoms,
      });

      router.push(`/intake/select-doctor?intakeId=${encodeURIComponent(String(intake.id))}`);
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
          <PatientSummary
            patient={patient}
            emptyMessage="Loading patient info..."
            nameClassName="text-sm font-bold leading-tight"
          />
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
          <IntakeStepper steps={STEPS} activeStep={1} baseLabelWeight={700} />

          {/* ── Form card ── */}
          <Paper
            shadow="md"
            radius="xl"
            p={48}
            className="w-full border border-blue-100"
            style={{ boxShadow: '0 8px 48px rgba(59,130,246,0.10)' }}
          >
            <SymptomsForm
              control={control}
              register={register}
              errors={errors}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
              chiefComplaintData={chiefComplaintData}
              chiefComplaintLoading={chiefComplaintLoading}
              symptomInputRef={symptomInputRef}
              symptomInput={symptomInput}
              setSymptomInput={setSymptomInput}
              symptoms={symptoms}
              addSymptom={addSymptom}
              removeSymptom={removeSymptom}
              onBack={() => router.push('/intake/register-patient')}
              loading={loading}
            />
          </Paper>

        </div>
      </div>
    </div>
  );
}

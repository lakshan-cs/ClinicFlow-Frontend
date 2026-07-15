'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import {
  createPatientIntake,
  getChiefComplaintLookup,
  type ChiefComplaintLookupItem,
} from '../../../../services/patientIntakeService';
import { getPatientById, PatientResponse } from '../../../../services/patientService';
import { getUser } from '../../../../services/authService';
import IntakeStepper from '@/components/intake/IntakeStepper';
import SymptomsForm, { type SymptomsFormValues } from '@/components/intake/SymptomsForm';
import { symptomsSchema } from '@/schemas/intake';
import { saveIntakeFlow } from '@/utils/intakeFlowStorage';
import IntakeSidebar from '@/components/intake/IntakeSidebar';

type SymptomsPageFormValues = SymptomsFormValues;

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
      <IntakeSidebar
        patient={patient}
        emptyMessage="Patient summary will appear here after registration or selection."
        showStep2Summary={false}
      />

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 overflow-y-auto">
        <div className="w-full max-w-6xl">

          {/* ── Wizard stepper ── */}
          <IntakeStepper activeStep={1} baseLabelWeight={700} />

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

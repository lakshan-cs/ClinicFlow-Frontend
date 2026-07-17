'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconStethoscope,
} from '@tabler/icons-react';
import { getPatientById, type PatientResponse } from '../../../../services/patientService';
import { getSpecialtyByChiefComplaint } from '../../../../services/patientIntakeService';
import { getProvidersBySpecialty, type ProviderItem } from '../../../../services/providerService';
import IntakeStepper from '@/components/intake/IntakeStepper';
import DoctorCard from '@/components/intake/DoctorCard';
import { loadIntakeFlow, saveIntakeFlow } from '@/utils/intakeFlowStorage';
import IntakeSidebar from '@/components/intake/IntakeSidebar';
import IntakeCard from '@/components/intake/IntakeCard';
import SuspenseWrapper from '@/components/intake/SuspenseWrapper';

const DEFAULT_SPECIALTY = 'General Medicine';

const getAvailabilityLabel = (): string => {
  const now = new Date();
  const hour = now.getHours();
  // Once 16:00 has passed, today's slots are gone — next availability is tomorrow.
  return hour >= 16 ? 'Available tomorrow' : 'Available today';
};

export default function SelectDoctorPage() {
  return (
    <SuspenseWrapper>
      <SelectDoctorPageContent />
    </SuspenseWrapper>
  );
}

function SelectDoctorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const intakeId = searchParams.get('intakeId');
  const flowState = useMemo(() => (intakeId ? loadIntakeFlow(intakeId) : null), [intakeId]);
  const patientId = flowState?.patientId ? String(flowState.patientId) : null;
  const chiefComplaint = flowState?.chiefComplaint || null;
  const selectedSymptoms = flowState?.symptoms ?? [];

  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string>('');
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loadingSpecialty, setLoadingSpecialty] = useState<boolean>(() => Boolean(chiefComplaint));
  const [loadingProviders, setLoadingProviders] = useState<boolean>(() => Boolean(chiefComplaint));

  useEffect(() => {
    if (!intakeId || !flowState || !patientId || !chiefComplaint) {
      router.replace('/intake/register-patient');
      return;
    }

    getPatientById(patientId).then(setPatient).catch(() => {});
  }, [router, patientId, intakeId, flowState, chiefComplaint]);

  useEffect(() => {
    if (!chiefComplaint) {
      router.replace('/intake/register-patient');
      notifications.show({
        title: 'Chief complaint missing',
        message: 'Please return to Step 2 and select a chief complaint.',
        color: 'yellow',
      });
      return;
    }

    let isActive = true;

    const applySpecialtyAndLoadProviders = async (specialty: string) => {
      setRecommendedSpecialty(specialty);

      try {
        const fetchedProviders = await getProvidersBySpecialty(specialty);
        if (!isActive) return;
        setProviders(fetchedProviders);
      } catch {
        if (!isActive) return;
        setProviders([]);
        notifications.show({
          title: 'Providers unavailable',
          message: 'Could not load providers for this specialty. Please try again.',
          color: 'red',
        });
      }
    };

    getSpecialtyByChiefComplaint(chiefComplaint)
      .then(async (lookup) => {
        if (!isActive) return;

        const specialty = lookup.specialty?.trim();
        if (!specialty) {
          await applySpecialtyAndLoadProviders(DEFAULT_SPECIALTY);
          return;
        }

        await applySpecialtyAndLoadProviders(specialty);
      })
      .catch(async () => {
        if (!isActive) return;

        await applySpecialtyAndLoadProviders(DEFAULT_SPECIALTY);
      })
      .finally(() => {
        if (!isActive) return;
        setLoadingSpecialty(false);
        setLoadingProviders(false);
      });

    return () => {
      isActive = false;
    };
  }, [chiefComplaint]);

  const onSelectDoctor = (provider: ProviderItem) => {
    if (!intakeId || !patientId || !chiefComplaint) return;

    notifications.show({
      title: 'Doctor selected',
      message: `${provider.fullName} selected successfully.`,
      color: 'green',
    });

    saveIntakeFlow(intakeId, {
      intakeId: String(intakeId),
      patientId,
      chiefComplaint,
      symptoms: selectedSymptoms,
      providerId: provider.id,
      providerName: provider.fullName,
      providerSpecialty: `${recommendedSpecialty} ${provider.specialty}`.trim(),
    });

    router.push(`/intake/book-appointment?intakeId=${encodeURIComponent(String(intakeId))}`);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex font-sans"
      style={{ fontFamily: 'var(--font-geist-sans), Segoe UI, sans-serif' }}
    >
      <IntakeSidebar
        patient={patient}
        emptyMessage="Patient summary will appear here after registration or selection."
        showStep2Summary={true}
        chiefComplaint={chiefComplaint}
        selectedSymptoms={selectedSymptoms}
      />

      <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 overflow-y-auto">
        <div className="w-full max-w-6xl">
          <IntakeStepper activeStep={2} baseLabelWeight={600} />

          <IntakeCard>
            <Stack gap={28}>
              <div>
                <Group gap={12} mb={4}>
                  <ThemeIcon size={44} radius="xl" color="teal" variant="light">
                    <IconStethoscope size={22} />
                  </ThemeIcon>
                  <div>
                    <Title order={2} className="text-gray-800 font-bold text-2xl">Select a Doctor</Title>
                    <Text size="sm" c="dimmed" mt={2}>Step 3 of 4 — Match the patient with a suitable provider</Text>
                  </div>
                </Group>
              </div>

              <div>
                <Text fw={600} size="sm" style={{ color: '#334155' }}>Recommended Specialty</Text>
                <Text fw={600} size="xl" mt={4} style={{ color: '#0f172a', letterSpacing: '0.01em' }}>
                  {loadingSpecialty ? 'Loading specialty...' : recommendedSpecialty || 'Not available'}
                </Text>
              </div>

              <div>
                <Title order={4} style={{ color: '#1e293b', fontWeight: 600 }}>Available Providers</Title>

                {loadingProviders ? (
                  <Text size="sm" mt={10} style={{ color: '#64748b' }}>Loading providers...</Text>
                ) : providers.length === 0 ? (
                  <Text size="sm" mt={10} style={{ color: '#64748b' }}>
                    No providers found for {recommendedSpecialty || 'the recommended specialty'}.
                  </Text>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {providers.map((provider) => (
                      <DoctorCard
                        key={provider.id}
                        provider={provider}
                        recommendedSpecialty={recommendedSpecialty}
                        availabilityLabel={getAvailabilityLabel()}
                        onSelectDoctor={onSelectDoctor}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Group justify="space-between" mt={8}>
                <Button
                  variant="default"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => router.replace(`/intake/record-symptoms?patientId=${encodeURIComponent(String(patientId || ''))}`)}
                  radius="md"
                  style={{ fontWeight: 600 }}
                >
                  Back
                </Button>

              </Group>
            </Stack>
          </IntakeCard>
        </div>
      </div>
    </div>
  );
}

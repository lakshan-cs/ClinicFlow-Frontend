'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Group, Paper, Stack, Stepper, Text, ThemeIcon, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendarCheck,
  IconClipboardList,
  IconHeartbeat,
  IconLogout,
  IconMail,
  IconPhone,
  IconStethoscope,
  IconUser,
  IconUserCircle,
  IconUserPlus,
} from '@tabler/icons-react';
import { getUser } from '../../services/authService';
import { getPatientById, type PatientResponse } from '../../services/patientService';
import { getSpecialtyByChiefComplaint } from '../../services/patientIntakeService';
import { getProvidersBySpecialty, type ProviderItem } from '../../services/providerService';

const STEPS = [
  { icon: IconUserPlus, color: 'blue', label: 'Register Patient', desc: 'Patient details & contact info' },
  { icon: IconClipboardList, color: 'violet', label: 'Record Symptoms', desc: 'Chief complaints & symptoms' },
  { icon: IconStethoscope, color: 'teal', label: 'Select a Doctor', desc: 'Match with a specialist' },
  { icon: IconCalendarCheck, color: 'green', label: 'Book Appointment', desc: 'Schedule & confirm' },
];

const DEFAULT_SPECIALTY = 'General Medicine';

const getAvailabilityLabel = (): string => {
  const now = new Date();
  const hour = now.getHours();
  // Once 16:00 has passed, today's slots are gone — next availability is tomorrow.
  return hour >= 16 ? 'Available tomorrow' : 'Available today';
};

export default function SelectDoctorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50" />}>
      <SelectDoctorPageContent />
    </Suspense>
  );
}

function SelectDoctorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const patientId = searchParams.get('patientId');
  const intakeId = searchParams.get('intakeId');
  const chiefComplaint = searchParams.get('chiefComplaint');
  const symptomsParam = searchParams.get('symptoms');

  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string>('');
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loadingSpecialty, setLoadingSpecialty] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (!getUser()) {
      router.replace('/login');
      return;
    }

    if (!patientId || !intakeId) {
      router.replace('/register-patient');
      return;
    }

    getPatientById(patientId).then(setPatient).catch(() => {});
  }, [router, patientId, intakeId]);

  useEffect(() => {
    if (!symptomsParam) {
      setSelectedSymptoms([]);
      return;
    }

    try {
      const parsed = JSON.parse(symptomsParam) as unknown;
      if (Array.isArray(parsed)) {
        setSelectedSymptoms(parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0));
        return;
      }
      setSelectedSymptoms([]);
    } catch {
      setSelectedSymptoms([]);
    }
  }, [symptomsParam]);

  useEffect(() => {
    if (!chiefComplaint) {
      setLoadingSpecialty(false);
      setLoadingProviders(false);
      notifications.show({
        title: 'Chief complaint missing',
        message: 'Please return to Step 2 and select a chief complaint.',
        color: 'yellow',
      });
      return;
    }

    let isActive = true;

    setLoadingSpecialty(true);
    setLoadingProviders(true);

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

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.clear();
    router.replace('/login');
  };

  const onSelectDoctor = (provider: ProviderItem) => {
    notifications.show({
      title: 'Doctor selected',
      message: `${provider.fullName} selected successfully.`,
      color: 'green',
    });

    const encodedSymptoms = encodeURIComponent(JSON.stringify(selectedSymptoms));
    router.push(
      `/book-appointment?patientId=${patientId}&intakeId=${intakeId}&chiefComplaint=${encodeURIComponent(chiefComplaint || '')}&symptoms=${encodedSymptoms}&providerId=${encodeURIComponent(provider.id)}&providerName=${encodeURIComponent(provider.fullName)}&providerSpecialty=${encodeURIComponent(recommendedSpecialty + " " + provider.specialty)}`,
    );
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex font-sans"
      style={{ fontFamily: 'var(--font-geist-sans), Segoe UI, sans-serif' }}
    >
      <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#1a3c5e' }}>
        <div className="px-6 py-6 border-b border-white/10">
          <Group gap={10}>
            <ThemeIcon size={36} radius="xl" color="blue" variant="light">
              <IconHeartbeat size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm" style={{ color: '#f1f5f9' }} lh={1.2}>ClinicFlow</Text>
              <Text size="xs" style={{ color: '#94a3b8' }}>Patient Intake</Text>
            </div>
          </Group>
        </div>

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
                    <p className="text-sm font-semibold leading-tight" style={{ color: '#f1f5f9' }}>{patient.fullName}</p>
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

              <div className="rounded-xl p-4 mt-3" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
                  Selected in Step 2
                </p>
                <div className="mb-3">
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Chief Complaint</p>
                  <p className="text-xs mt-1 break-words" style={{ color: '#f1f5f9' }}>
                    {chiefComplaint || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#94a3b8' }}>Symptoms</p>
                  {selectedSymptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSymptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="px-2 py-1 rounded-md text-[11px]"
                          style={{ backgroundColor: 'rgba(148,163,184,0.2)', color: '#e2e8f0' }}
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: '#cbd5e1' }}>No symptoms provided</p>
                  )}
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

      <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 overflow-y-auto">
        <div className="w-full max-w-6xl">
          <Paper
            radius="xl"
            p={28}
            mb={24}
            className="border border-blue-100"
            style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.08)' }}
          >
            <Stepper
              active={2}
              size="sm"
              color="blue"
              styles={{
                root: { width: '100%' },
                steps: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                stepLabel: { fontWeight: 600, fontSize: 13, color: '#1e3a5f', whiteSpace: 'nowrap' },
                stepDescription: { fontSize: 11, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap' },
                separator: { borderColor: '#bfdbfe', borderWidth: 2, flex: 1 },
                step: { gap: 8 },
              }}
            >
              {STEPS.map((s, idx) => {
                const isActive = idx === 2;
                return (
                  <Stepper.Step
                    key={s.label}
                    label={s.label}
                    description={s.desc}
                    styles={{
                      stepLabel: { fontWeight: isActive ? 600 : 500, fontSize: 13, color: isActive ? '#1e3a5f' : '#94a3b8', whiteSpace: 'nowrap' },
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

          <Paper
            shadow="md"
            radius="xl"
            p={48}
            className="w-full border border-blue-100"
            style={{ boxShadow: '0 8px 48px rgba(59,130,246,0.10)' }}
          >
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
                      <Paper
                        key={provider.id}
                        radius="md"
                        p={18}
                        withBorder
                        style={{ borderColor: '#dbeafe', backgroundColor: '#ffffff' }}
                      >
                        <Stack gap={14}>
                          <div>
                            <Text fw={600} size="md" style={{ color: '#0f172a' }}>{provider.fullName}</Text>
                            <Text size="sm" mt={2} style={{ color: '#475569' }}>{recommendedSpecialty + " " + provider.specialty}</Text>
                            <Group gap={6} mt={8}>
                              <ThemeIcon size={18} radius="xl" color="green" variant="light">
                                <IconCalendarCheck size={12} />
                              </ThemeIcon>
                              <Text size="xs" fw={600} style={{ color: '#047857' }}>
                                {getAvailabilityLabel()}
                              </Text>
                            </Group>
                          </div>

                          <Button
                            radius="md"
                            variant="light"
                            color="blue"
                            onClick={() => onSelectDoctor(provider)}
                            style={{ fontWeight: 600, alignSelf: 'flex-start' }}
                          >
                            Select Doctor
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </div>
                )}
              </div>

              <Group justify="space-between" mt={8}>
                <Button
                  variant="default"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => router.replace(`/record-symptoms?patientId=${patientId}`)}
                  radius="md"
                  style={{ fontWeight: 600 }}
                >
                  Back
                </Button>

              </Group>
            </Stack>
          </Paper>
        </div>
      </div>
    </div>
  );
}

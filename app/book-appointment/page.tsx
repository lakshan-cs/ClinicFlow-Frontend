'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Button, Group, Modal, Paper, Stack, Stepper, Text, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
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
import { bookAppointment, getProviderAppointments, type ProviderAppointmentSlot } from '../../services/appointmentService';

const STEPS = [
  { icon: IconUserPlus, color: 'blue', label: 'Register Patient', desc: 'Patient details & contact info' },
  { icon: IconClipboardList, color: 'violet', label: 'Record Symptoms', desc: 'Chief complaints & symptoms' },
  { icon: IconStethoscope, color: 'teal', label: 'Select a Doctor', desc: 'Match with a specialist' },
  { icon: IconCalendarCheck, color: 'green', label: 'Book Appointment', desc: 'Schedule & confirm' },
];

/** Clinic booking window: 08:00–16:00, each slot is 20 minutes. */
const CLINIC_OPEN_HOUR = 8;
const CLINIC_CLOSE_HOUR = 16;
const SLOT_DURATION_MINS = 20;


const toDateKey = (input: Date): string => {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, '0');
  const day = String(input.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (dateKey: string): string => {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface TimeSlot {
  startTime: string;
  endTime: string;
  label: string;
}

const formatTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

/**
 * Generate all 20-minute slots for the clinic window.
 * For today, only include slots whose start time is >= minTotalMinutes.
 */
const generateSlots = (minTotalMinutes: number): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const openMins = CLINIC_OPEN_HOUR * 60;
  const closeMins = CLINIC_CLOSE_HOUR * 60;
  const startMins = Math.max(openMins, minTotalMinutes);

  for (let t = startMins; t + SLOT_DURATION_MINS <= closeMins; t += SLOT_DURATION_MINS) {
    const endT = t + SLOT_DURATION_MINS;
    const hh = Math.floor(t / 60);
    const mm = t % 60;
    const endHH = Math.floor(endT / 60);
    const endMM = endT % 60;
    slots.push({
      startTime: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      endTime: `${String(endHH).padStart(2, '0')}:${String(endMM).padStart(2, '0')}`,
      label: `${formatTime(t)} – ${formatTime(endT)}`,
    });
  }
  return slots;
};

/** Extract total minutes from a time string like "09:20", "09:20:00", or "9:20 AM". Returns -1 on failure. */
const extractMinutes = (time: string): number => {
  const normalized = time.trim().toUpperCase();
  const amPmMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
  if (amPmMatch) {
    let h = parseInt(amPmMatch[1], 10);
    const m = parseInt(amPmMatch[2], 10);
    const isPM = amPmMatch[3] === 'PM';
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  }
  const plain = normalized.match(/(\d{1,2}):(\d{2})/);
  if (plain) return parseInt(plain[1], 10) * 60 + parseInt(plain[2], 10);
  return -1;
};

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50" />}>
      <BookAppointmentPageContent />
    </Suspense>
  );
}

function BookAppointmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const patientId = searchParams.get('patientId');
  const intakeId = searchParams.get('intakeId');
  const chiefComplaint = searchParams.get('chiefComplaint');
  const symptomsParam = searchParams.get('symptoms');
  const providerId = searchParams.get('providerId');
  const providerName = searchParams.get('providerName');
  const providerSpecialty = searchParams.get('providerSpecialty');

  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<ProviderAppointmentSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booking, setBooking] = useState(false);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  /** Whether appointments are still open today (before 16:00). */
  const isBookableToday = useMemo(() => new Date().getHours() < CLINIC_CLOSE_HOUR, []);

  const targetDateKey = useMemo(() => {
    const d = new Date();
    if (!isBookableToday) d.setDate(d.getDate() + 1);
    return toDateKey(d);
  }, [isBookableToday]);

  const targetLabel = isBookableToday ? 'Today' : 'Tomorrow';

  useEffect(() => {
    if (!getUser()) {
      router.replace('/login');
      return;
    }

    if (!patientId || !intakeId || !providerId) {
      router.replace('/register-patient');
      return;
    }

    getPatientById(patientId).then(setPatient).catch(() => {});
  }, [router, patientId, intakeId, providerId]);

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
    if (!providerId) {
      setLoadingSlots(false);
      setAvailableSlots([]);
      return;
    }

    let isActive = true;
    setLoadingSlots(true);

    getProviderAppointments(providerId)
      .then((bookedSlots) => {
        if (!isActive) return;

        // Try to read clinicId from any existing appointment for this provider.
        const firstWithClinic = bookedSlots.find(
          (s) => typeof (s as unknown as Record<string, unknown>).clinicId === 'number',
        );
        if (firstWithClinic) {
          setClinicId((firstWithClinic as unknown as Record<string, unknown>).clinicId as number);
        }

        // Collect booked time ranges (in total minutes) on the target date.
        const bookedMinutes = new Set<number>();
        const targetDateBookings = bookedSlots.filter((slot) => {
          const dateKey = slot.appointmentDate.includes('T')
            ? slot.appointmentDate.split('T')[0]
            : slot.appointmentDate;
          return dateKey === targetDateKey;
        });
        setBookedAppointments(targetDateBookings);
        targetDateBookings.forEach((slot) => {
          if (slot.startTime) {
            const m = extractMinutes(slot.startTime);
            if (m >= 0) bookedMinutes.add(m);
          }
        });

        // For today start from next 20-min boundary after now, for tomorrow start from 08:00.
        const now = new Date();
        const nowMins = isBookableToday ? now.getHours() * 60 + now.getMinutes() : CLINIC_OPEN_HOUR * 60;
        const minMins = isBookableToday
          ? Math.ceil((nowMins + 1) / SLOT_DURATION_MINS) * SLOT_DURATION_MINS
          : CLINIC_OPEN_HOUR * 60;
        const generated = generateSlots(minMins);
        const free = generated.filter((s) => !bookedMinutes.has(extractMinutes(s.startTime)));

        setAvailableSlots(free);
      })
      .catch(() => {
        if (!isActive) return;
        // Even on error, show generated slots so booking can still proceed.
        const now2 = new Date();
        const nowMins2 = isBookableToday ? now2.getHours() * 60 + now2.getMinutes() : CLINIC_OPEN_HOUR * 60;
        const minMins2 = isBookableToday
          ? Math.ceil((nowMins2 + 1) / SLOT_DURATION_MINS) * SLOT_DURATION_MINS
          : CLINIC_OPEN_HOUR * 60;
        setAvailableSlots(generateSlots(minMins2));
      })
      .finally(() => {
        if (!isActive) return;
        setLoadingSlots(false);
      });

    return () => {
      isActive = false;
    };
  }, [providerId, targetDateKey, isBookableToday]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.clear();
    router.replace('/login');
  };

  const onSelectSlot = (slot: TimeSlot) => {
    setPendingSlot(slot);
    openConfirm();
  };

  const onConfirmBooking = async () => {
    if (!pendingSlot || !patientId || !providerId) return;

    const resolvedClinicId = clinicId ?? 4; // fallback to clinic 4 if not resolved from API
    const dateTimeStr = `${targetDateKey}T${pendingSlot.startTime}:00`;

    setBooking(true);
    try {
      await bookAppointment({
        patientId: Number(patientId),
        clinicId: resolvedClinicId,
        providerId: Number(providerId),
        dateTime: dateTimeStr,
      });

      closeConfirm();
      notifications.show({
        title: 'Appointment confirmed',
        message: `Appointment booked for ${providerName || 'provider'} at ${pendingSlot.label} on ${toDisplayDate(targetDateKey)}.`,
        color: 'green',
      });

      router.replace(`/dashboard`);
    } catch {
      closeConfirm();
      notifications.show({
        title: 'Booking failed',
        message: 'Could not book the appointment. Please try again.',
        color: 'red',
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex font-sans">
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

              <div className="rounded-xl p-4 mt-3" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
                  Selected Doctor
                </p>
                <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                  {providerName || 'Not selected'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
                  {providerSpecialty || 'Specialty not available'}
                </p>
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
              active={3}
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
                const isActive = idx === 3;
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
            <Stack gap={24}>
              <div>
                <Group gap={12} mb={4}>
                  <ThemeIcon size={44} radius="xl" color="green" variant="light">
                    <IconCalendarCheck size={22} />
                  </ThemeIcon>
                  <div>
                    <Title order={2} className="text-gray-800 text-2xl" style={{ fontWeight: 600 }}>
                      Book Appointment
                    </Title>
                    <Text size="sm" c="dimmed" mt={2}>
                      Step 4 of 4 — Available slots for {isBookableToday ? 'today' : 'tomorrow'}
                    </Text>
                  </div>
                </Group>
              </div>

              <div>
                <Text fw={600} size="sm" style={{ color: '#334155' }}>
                  {targetLabel}
                </Text>
                <Text fw={600} size="lg" mt={4} style={{ color: '#0f172a' }}>
                  {toDisplayDate(targetDateKey)}
                </Text>
              </div>

              {loadingSlots ? (
                <Text size="sm" style={{ color: '#64748b' }}>Loading available slots...</Text>
              ) : availableSlots.length === 0 ? (
                <Text size="sm" style={{ color: '#64748b' }}>
                  No available appointment slots for {targetLabel.toLowerCase()}. All clinic hours (08:00–16:00) are fully booked.
                </Text>
              ) : (
                <Paper
                  radius="md"
                  p={20}
                  withBorder
                  style={{ borderColor: '#6ee7b7', backgroundColor: '#f0fdf4' }}
                >
                  <Group justify="space-between" align="center">
                    <div>
                      <Group gap={8} mb={4}>
                        <Text fw={700} size="lg" style={{ color: '#065f46' }}>
                          {availableSlots[0].label}
                        </Text>
                        <Badge color="green" variant="light" size="sm">Earliest available</Badge>
                      </Group>
                      <Text size="xs" style={{ color: '#047857' }}>
                        First open slot {targetLabel.toLowerCase()}
                      </Text>
                    </div>
                    <Button
                      radius="md"
                      color="green"
                      style={{ fontWeight: 600 }}
                      loading={booking}
                      onClick={() => onSelectSlot(availableSlots[0])}
                    >
                      Book This Slot
                    </Button>
                  </Group>
                </Paper>
              )}

              {/* Already booked appointments for this day */}
              {!loadingSlots && bookedAppointments.length > 0 && (
                <Stack gap={10}>
                  <Text fw={600} size="sm" style={{ color: '#334155' }}>Already Booked</Text>
                  {bookedAppointments.map((appt) => {
                    const startMins = appt.startTime ? extractMinutes(appt.startTime) : -1;
                    const endMins = startMins >= 0 ? startMins + SLOT_DURATION_MINS : -1;
                    const timeLabel =
                      startMins >= 0
                        ? `${formatTime(startMins)} – ${formatTime(endMins)}`
                        : appt.startTime ?? 'Time not specified';
                    return (
                      <Paper
                        key={appt.id}
                        radius="md"
                        p={16}
                        withBorder
                        style={{ borderColor: '#fecaca', backgroundColor: '#fff7f7' }}
                      >
                        <Group justify="space-between" align="center">
                          <div>
                            <Text fw={600} size="sm" style={{ color: '#991b1b' }}>{timeLabel}</Text>
                            <Text size="xs" mt={2} style={{ color: '#b91c1c' }}>Booked</Text>
                          </div>
                          <Badge color="red" variant="light" size="sm">Unavailable</Badge>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              <Group justify="space-between" mt={8}>
                <Button
                  variant="default"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() =>
                    router.replace(
                      `/select-doctor?patientId=${patientId}&intakeId=${intakeId}&chiefComplaint=${encodeURIComponent(chiefComplaint || '')}&symptoms=${encodeURIComponent(symptomsParam || '')}`,
                    )
                  }
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

      {/* Booking confirmation modal */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title={
          <Text fw={700} size="lg" style={{ color: '#0f172a' }}>
            Confirm Appointment
          </Text>
        }
        centered
        radius="md"
        size="sm"
        styles={{
          header: { backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '16px 20px' },
          body: { padding: '20px' },
        }}
      >
        <Stack gap={16}>
          <Text size="sm" style={{ color: '#334155' }}>
            You are about to book an appointment with{' '}
            <strong>{providerName || 'the selected provider'}</strong> on{' '}
            <strong>{toDisplayDate(targetDateKey)}</strong> at{' '}
            <strong>{pendingSlot?.label}</strong>.
          </Text>
          <Text size="sm" style={{ color: '#64748b' }}>
            Do you want to confirm this booking?
          </Text>
          <Group justify="flex-end" gap={10}>
            <Button variant="default" radius="md" onClick={closeConfirm} disabled={booking}>
              Cancel
            </Button>
            <Button
              color="green"
              radius="md"
              loading={booking}
              onClick={onConfirmBooking}
            >
              Confirm Booking
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

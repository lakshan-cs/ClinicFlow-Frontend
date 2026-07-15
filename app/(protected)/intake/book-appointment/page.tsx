'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Group, Modal, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendarCheck,
} from '@tabler/icons-react';
import { getUser } from '../../../../services/authService';
import { getPatientById, type PatientResponse } from '../../../../services/patientService';
import { bookAppointment, getProviderAppointments, type ProviderAppointmentSlot } from '../../../../services/appointmentService';
import IntakeStepper from '@/components/intake/IntakeStepper';
import AppointmentSlotPicker, { type AppointmentSlot } from '@/components/intake/AppointmentSlotPicker';
import { loadIntakeFlow } from '@/utils/intakeFlowStorage';
import IntakeSidebar from '@/components/intake/IntakeSidebar';

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
const generateSlots = (minTotalMinutes: number): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
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

  const intakeId = searchParams.get('intakeId');
  const flowState = useMemo(() => (intakeId ? loadIntakeFlow(intakeId) : null), [intakeId]);
  const patientId = flowState?.patientId ? String(flowState.patientId) : null;
  const chiefComplaint = flowState?.chiefComplaint || null;
  const selectedSymptoms = flowState?.symptoms ?? [];
  const providerId = flowState?.providerId || null;
  const providerName = flowState?.providerName || null;
  const providerSpecialty = flowState?.providerSpecialty || null;

  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<ProviderAppointmentSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(() => Boolean(providerId));
  const [booking, setBooking] = useState(false);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [pendingSlot, setPendingSlot] = useState<AppointmentSlot | null>(null);
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

    if (!intakeId || !flowState || !patientId) {
      router.replace('/register-patient');
      return;
    }

    if (!providerId) {
      router.replace(`/intake/select-doctor?intakeId=${encodeURIComponent(String(intakeId))}`);
      return;
    }

    getPatientById(patientId).then(setPatient).catch(() => {});
  }, [router, patientId, intakeId, providerId, flowState]);

  useEffect(() => {
    if (!providerId) {
      return;
    }

    let isActive = true;

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

  const onSelectSlot = (slot: AppointmentSlot) => {
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
      <IntakeSidebar
        patient={patient}
        emptyMessage="Patient summary will appear here after registration or selection."
        showStep2Summary={true}
        chiefComplaint={chiefComplaint}
        selectedSymptoms={selectedSymptoms}
        showDoctorSummary={true}
        providerName={providerName}
        providerSpecialty={providerSpecialty}
      />

      <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 overflow-y-auto">
        <div className="w-full max-w-6xl">
          <IntakeStepper activeStep={3} baseLabelWeight={600} />

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

              <AppointmentSlotPicker
                loadingSlots={loadingSlots}
                availableSlots={availableSlots}
                booking={booking}
                targetLabel={targetLabel}
                bookedAppointments={bookedAppointments}
                onSelectSlot={onSelectSlot}
                extractMinutes={extractMinutes}
                formatTime={formatTime}
                slotDurationMins={SLOT_DURATION_MINS}
              />

              <Group justify="space-between" mt={8}>
                <Button
                  variant="default"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() =>
                    router.replace(`/intake/select-doctor?intakeId=${encodeURIComponent(String(intakeId || ''))}`)
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

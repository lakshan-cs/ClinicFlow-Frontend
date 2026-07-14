import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import type { AppointmentSlot, AppointmentSlotPickerProps } from '@/types/intake';

export type { AppointmentSlot };

export default function AppointmentSlotPicker({
  loadingSlots,
  availableSlots,
  booking,
  targetLabel,
  bookedAppointments,
  onSelectSlot,
  extractMinutes,
  formatTime,
  slotDurationMins,
}: AppointmentSlotPickerProps) {
  return (
    <>
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

      {!loadingSlots && bookedAppointments.length > 0 && (
        <Stack gap={10}>
          <Text fw={600} size="sm" style={{ color: '#334155' }}>Already Booked</Text>
          {bookedAppointments.map((appt) => {
            const startMins = appt.startTime ? extractMinutes(appt.startTime) : -1;
            const endMins = startMins >= 0 ? startMins + slotDurationMins : -1;
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
    </>
  );
}

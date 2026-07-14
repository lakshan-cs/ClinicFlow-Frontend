import { Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCalendarCheck } from '@tabler/icons-react';

interface DoctorCardProvider {
  id: string | number;
  fullName: string;
  specialty: string;
}

interface DoctorCardProps {
  provider: DoctorCardProvider;
  recommendedSpecialty: string;
  availabilityLabel: string;
  onSelectDoctor: (provider: DoctorCardProvider) => void;
}

export default function DoctorCard({ provider, recommendedSpecialty, availabilityLabel, onSelectDoctor }: DoctorCardProps) {
  return (
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
          <Text size="sm" mt={2} style={{ color: '#475569' }}>{recommendedSpecialty + ' ' + provider.specialty}</Text>
          <Group gap={6} mt={8}>
            <ThemeIcon size={18} radius="xl" color="green" variant="light">
              <IconCalendarCheck size={12} />
            </ThemeIcon>
            <Text size="xs" fw={600} style={{ color: '#047857' }}>
              {availabilityLabel}
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
  );
}

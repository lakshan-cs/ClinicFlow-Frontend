'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconUserPlus,
  IconStethoscope,
  IconCalendarCheck,
  IconClipboardList,
  IconArrowRight,
  IconHeartbeat,
} from '@tabler/icons-react';
import { getUser } from '../../services/authService';

interface UserData {
  token: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

const steps = [
  {
    icon: IconUserPlus,
    color: 'blue',
    label: 'Register Patient',
    desc: 'Capture patient details and contact information',
  },
  {
    icon: IconClipboardList,
    color: 'violet',
    label: 'Record Symptoms',
    desc: 'Document chief complaints and symptoms',
  },
  {
    icon: IconStethoscope,
    color: 'teal',
    label: 'Select a Doctor',
    desc: 'Review and select a suitable specialist',
  },
  {
    icon: IconCalendarCheck,
    color: 'green',
    label: 'Book Appointment',
    desc: 'Choose an available slot and confirm booking',
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = getUser();
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(stored);
  }, [router]);

  const displayName =
    (user?.name as string) ||
    (user?.email as string)?.split('@')[0] ||
    'Admin';

  const handleStart = () => {
    router.push('/register-patient');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl">
        {/* Header badge */}
        <div className="flex justify-center mb-6">
          <Badge
            size="lg"
            variant="light"
            color="blue"
            leftSection={<IconHeartbeat size={14} />}
            className="px-4 py-1 text-sm font-semibold tracking-wide"
          >
            ClinicFlow — Patient Intake System
          </Badge>
        </div>

        {/* Main card */}
        <Paper
          shadow="md"
          radius="xl"
          p={48}
          className="w-full border border-blue-100"
          style={{ boxShadow: '0 8px 48px rgba(59,130,246,0.10)' }}
        >
          <Stack gap={32}>
            {/* Title section */}
            <div className="text-center">
              <Title
                order={1}
                className="text-3xl font-bold text-gray-800 mb-2 tracking-tight"
              >
                Patient Intake &amp; Appointment Booking
              </Title>

              <Text size="lg" c="dimmed" fw={500} mt={6}>
                Welcome,{' '}
                <span className="text-blue-600 font-semibold capitalize">
                  {displayName}
                </span>
              </Text>
            </div>

            <Divider
              label={
                <Text size="sm" c="dimmed" className="px-2">
                  This workflow will guide you through
                </Text>
              }
              labelPosition="center"
            />

            {/* Description */}
            <Text
              size="md"
              c="dimmed"
              className="text-center leading-relaxed"
            >
              Registering a patient, recording symptoms,
              finding a suitable doctor, and booking an appointment.
            </Text>

            {/* Steps — horizontal wizard strip */}
            <div className="flex items-stretch gap-0">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center flex-1 min-w-0">
                  {/* Step card */}
                  <div className="flex-1 flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 min-w-0">
                    <ThemeIcon
                      size={48}
                      radius="xl"
                      color={step.color}
                      variant="light"
                    >
                      <step.icon size={22} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed" fw={500} mb={2}>
                        Step {idx + 1}
                      </Text>
                      <Text size="sm" fw={700} className="text-gray-800 leading-snug">
                        {step.label}
                      </Text>
                      <Text size="xs" c="dimmed" mt={4} className="leading-snug">
                        {step.desc}
                      </Text>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {idx < steps.length - 1 && (
                    <div className="flex items-center justify-center px-2 shrink-0">
                      <IconArrowRight size={20} className="text-blue-300" stroke={2} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Divider />

            {/* CTA */}
            <Group justify="center">
              <Button
                size="lg"
                radius="xl"
                color="blue"
                rightSection={<IconArrowRight size={18} />}
                onClick={handleStart}
                className="px-10 font-semibold shadow-md hover:shadow-lg transition-shadow"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  border: 'none',
                }}
              >
                Start New Registration
              </Button>
            </Group>

            <Text size="xs" c="dimmed" className="text-center">
              Patient information is handled securely throughout the registration process.
            </Text>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}

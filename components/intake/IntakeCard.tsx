import { Paper, PaperProps } from '@mantine/core';

interface IntakeCardProps extends PaperProps {
  children: React.ReactNode;
}

export default function IntakeCard({
  children,
  ...props
}: IntakeCardProps) {
  return (
    <Paper
      shadow="md"
      radius="xl"
      p={48}
      className="w-full border border-blue-100"
      style={{ boxShadow: '0 8px 48px rgba(59,130,246,0.10)' }}
      {...props}
    >
      {children}
    </Paper>
  );
}
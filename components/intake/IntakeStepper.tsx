import { Paper, Stepper, ThemeIcon } from '@mantine/core';

interface IntakeStepItem {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  label: string;
  desc: string;
}

interface IntakeStepperProps {
  steps: IntakeStepItem[];
  activeStep: number;
  baseLabelWeight?: number;
}

export default function IntakeStepper({ steps, activeStep, baseLabelWeight = 700 }: IntakeStepperProps) {
  return (
    <Paper
      radius="xl"
      p={28}
      mb={24}
      className="border border-blue-100"
      style={{ boxShadow: '0 4px 24px rgba(59,130,246,0.08)' }}
    >
      <Stepper
        active={activeStep}
        size="sm"
        color="blue"
        styles={{
          root: { width: '100%' },
          steps: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          stepLabel: { fontWeight: baseLabelWeight, fontSize: 13, color: '#1e3a5f', whiteSpace: 'nowrap' },
          stepDescription: { fontSize: 11, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap' },
          separator: { borderColor: '#bfdbfe', borderWidth: 2, flex: 1 },
          step: { gap: 8 },
        }}
      >
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const StepIcon = step.icon;
          return (
            <Stepper.Step
              key={step.label}
              label={step.label}
              description={step.desc}
              styles={{
                stepLabel: {
                  fontWeight: isActive ? baseLabelWeight : 500,
                  fontSize: 13,
                  color: isActive ? '#1e3a5f' : '#94a3b8',
                  whiteSpace: 'nowrap',
                },
                stepDescription: {
                  fontSize: 11,
                  color: isActive ? '#64748b' : '#cbd5e1',
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                },
              }}
              icon={
                <ThemeIcon
                  size={26}
                  radius="xl"
                  color={step.color}
                  variant={isActive ? 'light' : 'subtle'}
                  style={{ opacity: isActive ? 1 : 0.4 }}
                >
                  <StepIcon size={14} />
                </ThemeIcon>
              }
            />
          );
        })}
      </Stepper>
    </Paper>
  );
}

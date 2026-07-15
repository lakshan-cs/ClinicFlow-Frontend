import { Group, ThemeIcon, Text } from "@mantine/core";
import { IconHeartbeat, IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PatientSummary from "./PatientSummary";
import type { PatientSummaryProps } from "@/types/intake";

export default function IntakeSidebar({
  patient,
  emptyMessage = 'Patient summary will appear here after registration or selection.',
  nameClassName = 'text-sm font-semibold leading-tight',
  showStep2Summary = false,
  chiefComplaint = null,
  selectedSymptoms = [],
  showDoctorSummary = false,
  providerName,
  providerSpecialty,
}: PatientSummaryProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.clear();
    router.replace('/login');

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

        {/* Patient summary */}
        <div className="flex-1 px-4 py-5">
          <PatientSummary
            patient={patient}
            emptyMessage={emptyMessage}
            nameClassName={nameClassName}
            showStep2Summary={showStep2Summary}
            chiefComplaint={chiefComplaint}
            selectedSymptoms={selectedSymptoms}
            showDoctorSummary={showDoctorSummary}
            providerName={providerName}
            providerSpecialty={providerSpecialty}
          />
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
    </div>
  );
}

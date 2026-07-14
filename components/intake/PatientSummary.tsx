import {
  IconMail,
  IconPhone,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react';

interface PatientSummaryModel {
  id: string | number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
}

interface PatientSummaryProps {
  patient: PatientSummaryModel | null;
  emptyMessage: string;
  nameClassName?: string;
  showStep2Summary?: boolean;
  chiefComplaint?: string | null;
  selectedSymptoms?: string[];
  showDoctorSummary?: boolean;
  providerName?: string | null;
  providerSpecialty?: string | null;
}

export default function PatientSummary({
  patient,
  emptyMessage,
  nameClassName = 'text-sm font-semibold leading-tight',
  showStep2Summary = false,
  chiefComplaint,
  selectedSymptoms = [],
  showDoctorSummary = false,
  providerName,
  providerSpecialty,
}: PatientSummaryProps) {
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
        <IconUserCircle size={36} style={{ color: '#334d66', marginBottom: 8 }} />
        <p className="text-xs" style={{ color: '#4a6580' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Patient Summary</p>
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(99,179,237,0.2)' }}>
            <IconUserCircle size={22} style={{ color: '#93c5fd' }} />
          </div>
          <div>
            <p className={nameClassName} style={{ color: '#f1f5f9' }}>{patient.fullName}</p>
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

      {showStep2Summary && (
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
      )}

      {showDoctorSummary && (
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
      )}
    </div>
  );
}

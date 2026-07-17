'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconUserCircle,
} from '@tabler/icons-react';
import { createPatient, getAllPatients, PatientResponse } from '../../../../services/patientService';
import IntakeStepper from '@/components/intake/IntakeStepper';
import PatientRegistrationForm, { type PatientRegistrationFormValues } from '@/components/intake/PatientRegistrationForm';
import { patientSchema } from '@/schemas/patient';
import IntakeSidebar from '@/components/intake/IntakeSidebar';
import IntakeCard from '@/components/intake/IntakeCard';

type PatientFormValues = PatientRegistrationFormValues;

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [allPatients, setAllPatients] = useState<PatientResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<PatientResponse | null>(null);

  // The patient to display in sidebar — newly registered takes priority over search selection
  const summaryPatient = registeredPatient ?? selectedPatient;

  const filteredPatients = allPatients.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auth guard
  useEffect(() => {
    getAllPatients().then(setAllPatients).catch(() => {});
  }, [router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { fullName: '', dateOfBirth: '', email: '', phoneNumber: '' },
    });

    const onSubmit = async (data: PatientFormValues) => {
      setLoading(true);
      try {
        const payload = {
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          email: data.email,
          phoneNumber: data.phoneNumber,
        };

        const patient = await createPatient(payload);

        setRegisteredPatient(patient);

        notifications.show({
          title: 'Success',
          message: `Patient registered successfully`,
          color: 'green',
        });

        // Proceed to step 2 — pass patientId via search param
        router.push(`/intake/record-symptoms?patientId=${patient.id}`);
      } catch (error) {
        let errorMessage = 'Could not save patient. Please try again.';

        if (axios.isAxiosError(error)) {
          errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            errorMessage;
        }

        notifications.show({
          title: 'Registration failed',
          message: errorMessage,
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    const handleSkipWithSelectedPatient = () => {
      const patientToUse = selectedPatient ?? registeredPatient;
      const patientId = patientToUse?.id;

      if (patientId === undefined || patientId === null || String(patientId).trim() === '') {
        notifications.show({
          title: 'No patient selected',
          message: 'Please select a patient from search results before continuing.',
          color: 'yellow',
        });
        return;
      }

      router.push(`/intake/record-symptoms?patientId=${encodeURIComponent(String(patientId))}`);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex font-sans">

        {/* ── Sidebar ── */}
        <IntakeSidebar
          patient={summaryPatient}
          emptyMessage="Patient summary will appear here after registration or selection."
          showStep2Summary={false}
        />

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 overflow-y-auto">
      <div className="w-full max-w-6xl">

        {/* ── Search bar ── */}
        <div className="relative mb-6">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition-all">
            <IconSearch size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search existing patients by name before registering..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchOpen(false); setSelectedPatient(null); }} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Dropdown */}
          {searchOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients registered yet.'}
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                    onMouseDown={() => {
                      setSearchQuery(p.fullName);
                      setSelectedPatient(p);
                      setSearchOpen(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <IconUserCircle size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.fullName}</p>
                      <p className="text-xs text-slate-400">{p.email} &bull; DOB: {p.dateOfBirth?.split('T')[0]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Wizard stepper ── */}
        <IntakeStepper activeStep={0} baseLabelWeight={700} />

        {/* ── Form card ── */}
        <IntakeCard>
          <PatientRegistrationForm
            control={control}
            errors={errors}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            loading={loading}
            canSkip={!!selectedPatient || !!registeredPatient}
            onSkip={handleSkipWithSelectedPatient}
          />
        </IntakeCard>
      </div>
      </div>
    </div>
  );
}

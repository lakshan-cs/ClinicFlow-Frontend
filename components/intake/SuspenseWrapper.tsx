import { Suspense } from 'react';

interface SuspenseWrapperProps {
  children: React.ReactNode;
}

export default function SuspenseWrapper({
  children,
}: SuspenseWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50" />
      }
    >
      {children}
    </Suspense>
  );
}
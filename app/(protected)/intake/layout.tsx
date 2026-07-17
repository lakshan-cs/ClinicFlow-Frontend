'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/services/authService';

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!getUser()) {
      router.replace('/login');
    }
  }, [router]);

  return <>{children}</>;
}
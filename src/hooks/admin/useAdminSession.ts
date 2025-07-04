import type { AdminSession } from '@/lib/admin-types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAdminSession = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  return {
    session: session as unknown as AdminSession,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
};
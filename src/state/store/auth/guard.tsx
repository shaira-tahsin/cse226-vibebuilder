import { useAuthStore } from '.';
import { useEffect, useRef } from 'react';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useGetAccount } from '@/modules/profile/hooks/use-account';

export const Guard = ({ children }: { children: React.ReactNode }) => {
  const { setUser, isAuthenticated, accessToken } = useAuthStore();
  const { handleError } = useErrorHandler();
  const lastErrorRef = useRef<any>(null);

  const { data, isSuccess, error } = useGetAccount(!!accessToken);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      handleError(error);
      return;
    }

    if (!isSuccess) return;
    setUser(data || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isAuthenticated, isSuccess, error, setUser]);

  return <>{children}</>;
};

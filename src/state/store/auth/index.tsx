import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from './index.type';
import { decodeJWT } from '@/lib/utils/decode-jwt-utils';

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const decoded = decodeJWT(token);
    if (!decoded?.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const checkAndClearExpiredSession = () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated && isTokenExpired(state.accessToken)) {
    useAuthStore.getState().logout();
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  selectedOrgId: null,
  tokens: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      login: (accessToken, refreshToken) => {
        const decoded = decodeJWT(accessToken);
        const orgId = decoded?.org_id ?? null;

        return set((state) => ({
          ...state,
          isAuthenticated: true,
          accessToken,
          refreshToken,
          selectedOrgId: orgId,
        }));
      },
      setAccessToken: (accessToken) => {
        const decoded = decodeJWT(accessToken);
        const orgId = decoded?.org_id ?? null;

        return set((state) => ({
          ...state,
          accessToken,
          selectedOrgId: orgId,
        }));
      },
      logout: () => set(initialState),
      setTokens: (tokens) => {
        const decoded = decodeJWT(tokens.accessToken);
        const orgId = decoded?.org_id ?? null;

        return set((state) => ({
          ...state,
          tokens,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          selectedOrgId: orgId,
        }));
      },
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
    }
  )
);

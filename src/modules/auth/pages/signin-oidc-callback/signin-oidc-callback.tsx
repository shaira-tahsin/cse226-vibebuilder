import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/state/store/auth';
import { useSigninMutation } from '../../hooks/use-auth';
import { SignInResponse } from '../../services/auth.service';
import { LoadingOverlay } from '@/components/core/loading-overlay/loading-overlay';
import { Signin } from '@/modules/auth/components/signin';

export const SigninOidcCallBackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutateAsync: signinMutate } = useSigninMutation<'social'>();
  const { login, setTokens, setUser } = useAuthStore();
  const isExchangingRef = useRef(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const isOidcCallback = !!code;

  const fetchAndStoreUser = async (accessToken: string) => {
    try {
      const profileRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/idp/v1/Iam/GetAccount`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-blocks-key': import.meta.env.VITE_X_BLOCKS_KEY ?? '',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser(profileData.data);
      } else {
        console.warn('GetAccount failed:', profileRes.status);
      }
    } catch {
      console.warn('Could not fetch user profile after OAuth login');
    }
  };

  useEffect(() => {
    if (code && state && !isExchangingRef.current) {
      isExchangingRef.current = true;

      (async () => {
        try {
          const res = (await signinMutate({
            grantType: 'social',
            code,
            state,
          })) as SignInResponse;

          // New Google user — Selise returns a redirect URL with a consent code
          // Use sso_consent grant to complete registration automatically
          if (res.sso_user_redirect_url) {
            try {
              const redirectUrl = new URL(res.sso_user_redirect_url);
              const consentCode = redirectUrl.searchParams.get('code');

              if (!consentCode) {
                console.error('No consent code found in sso_user_redirect_url');
                navigate('/login', { replace: true });
                return;
              }

              const consentRes = (await signinMutate({
                grantType: 'sso_consent',
                code: consentCode,
              } as Parameters<typeof signinMutate>[0])) as SignInResponse;

              if (!consentRes.access_token) {
                console.error('No access token from sso_consent:', consentRes);
                navigate('/login', { replace: true });
                return;
              }

              login(consentRes.access_token, consentRes.refresh_token ?? '');
              setTokens({ accessToken: consentRes.access_token, refreshToken: consentRes.refresh_token ?? '' });
              await fetchAndStoreUser(consentRes.access_token);
              navigate('/', { replace: true });
            } catch (consentError) {
              console.error('SSO consent flow failed:', consentError);
              navigate('/login', { replace: true });
            }
            return;
          }

          if (!res.access_token) {
            console.error('No access token in response:', res);
            navigate('/login', { replace: true });
            return;
          }

          login(res.access_token, res.refresh_token ?? '');
          setTokens({ accessToken: res.access_token, refreshToken: res.refresh_token ?? '' });
          await fetchAndStoreUser(res.access_token);
          navigate('/', { replace: true });

        } catch (error) {
          console.error('OAuth sign-in error:', error);
          navigate('/login', { replace: true });
        } finally {
          isExchangingRef.current = false;
        }
      })();
    }
  }, [code, state, searchParams, signinMutate, login, setTokens, setUser, navigate]);

  if (isOidcCallback) return <LoadingOverlay />;

  return <Signin />;
};

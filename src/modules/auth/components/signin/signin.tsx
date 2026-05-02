import { useTranslation } from 'react-i18next';
import { GRANT_TYPES } from '@/constant/auth';
import { Divider } from '@/components/core';
import { SsoSignin } from '../signin-sso';
import { SigninEmail } from '../signin-email';
import { Link, useLocation } from 'react-router-dom';
import { useGetLoginOptions, useGetSignupSettings } from '../../hooks/use-auth';
import { Zap } from 'lucide-react';

export const Signin = () => {
  const { data: loginOption } = useGetLoginOptions();
  const { data: signupSettings } = useGetSignupSettings();

  const { t } = useTranslation();
  const location = useLocation();
  const ssoError = location.state?.ssoError;

  const passwordGrantAllowed = !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.password);
  const socialGrantAllowed =
    !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.social) &&
    !!loginOption?.ssoInfo?.length;
  const oidcGrantAllowed = !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.oidc);

  const isDivider = passwordGrantAllowed && (socialGrantAllowed || oidcGrantAllowed);

  return (
    <div className="flex flex-col gap-6">
      {/* VibeBuilder branding */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-slate-800 text-xl tracking-tight">VibeBuilder</span>
      </div>

      <div>
        <div className="text-2xl font-bold text-slate-800">Welcome back</div>
        <div className="text-sm text-slate-500 mt-1">Sign in to continue building</div>
        {(signupSettings?.isEmailPasswordSignUpEnabled || signupSettings?.isSSoSignUpEnabled) && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-sm text-slate-500">
              {t('DONT_HAVE_ACCOUNT')}
            </span>
            <Link
              to={'/signup'}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              {t('SIGN_UP')}
            </Link>
          </div>
        )}
      </div>

      {ssoError && (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-xs font-normal text-red-700">{ssoError}</p>
        </div>
      )}

      <div className="w-full flex flex-col gap-6">
        {passwordGrantAllowed && <SigninEmail />}
        {isDivider && <Divider text={t('AUTH_OR')} />}
        {socialGrantAllowed && loginOption && <SsoSignin loginOption={loginOption} />}
      </div>
    </div>
  );
};

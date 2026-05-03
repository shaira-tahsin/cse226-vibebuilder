import { useTranslation } from 'react-i18next';
import { Divider } from '@/components/core';
import { SignupForm } from '@/modules/auth/components/signup';
import { useGetSignupSettings, useGetLoginOptions } from '@/modules/auth/hooks/use-auth';
import { SsoSignin } from '@/modules/auth/components/signin-sso';

export const SignupPage = () => {
  const { t } = useTranslation();
  const { data: signupSettings } = useGetSignupSettings();
  const { data: loginOption } = useGetLoginOptions();

  const isEmailPasswordSignUpEnabled = signupSettings?.isEmailPasswordSignUpEnabled ?? false;
  const isSSoSignUpEnabled = signupSettings?.isSSoSignUpEnabled ?? false;

  return (
    <div className="flex flex-col gap-6">
      {isEmailPasswordSignUpEnabled && <SignupForm />}
      <div>
        {isEmailPasswordSignUpEnabled && isSSoSignUpEnabled && !!loginOption?.ssoInfo?.length && (
          <Divider text={t('OR_CONTINUE_WITH')} />
        )}
        {isSSoSignUpEnabled && !!loginOption?.ssoInfo?.length && loginOption && <SsoSignin loginOption={loginOption} />}
      </div>
    </div>
  );
};

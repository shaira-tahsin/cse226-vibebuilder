import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui-kit/form';
import { Input } from '@/components/ui-kit/input';
import { Button } from '@/components/ui-kit/button';
import { Captcha, useCaptcha } from '@/components/core';
import { signupFormDefaultValue, signupFormType, getSignupFormValidationSchema } from './utils';
import { useSignupByEmail } from '../../hooks/use-auth';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui-kit/checkbox';
import { Zap } from 'lucide-react';

/**
 * SignupForm Component
 *
 * A user registration form component that collects username (email) and handles user registration.
 * It ensures basic validation using a Zod schema for secure form submission.
 *
 * Features:
 * - Username (email) field with validation
 * - Form validation using Zod and React Hook Form
 * - Terms of Service and Privacy Policy acknowledgement checkbox
 * - Loading state handling during async submission
 *
 */

export const SignupForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [alreadyRegisteredMessage, setAlreadyRegisteredMessage] = useState('');

  const form = useForm<signupFormType>({
    defaultValues: signupFormDefaultValue,
    resolver: zodResolver(getSignupFormValidationSchema(t)),
  });

  const { mutateAsync } = useSignupByEmail();
  const googleSiteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY || '';
  const captchaEnabled = googleSiteKey !== '';
  const captchaType =
    import.meta.env.VITE_CAPTCHA_TYPE === 'reCaptcha' ? 'reCaptcha-v2-checkbox' : 'hCaptcha';

  const {
    code: captchaCode,
    captcha,
    reset: resetCaptcha,
  } = useCaptcha({
    siteKey: googleSiteKey,
    type: captchaType,
  });

  const { isValid } = form.formState;

  const onSubmitHandler = async (values: signupFormType) => {
    try {
      await mutateAsync({
        ...values,
        captchaCode,
      });
      return navigate(`/sent-email`);
    } catch (error) {
      const res = JSON.stringify(error);
      if (res.includes('already_signup')) {
        setAlreadyRegisteredMessage(t('EMAIL_ALREADY_REGISTERED'));
      }
      resetCaptcha();
      toast({ variant: 'destructive', title: t('ERROR'), description: t('SOMETHING_WENT_WRONG') });
    }
  };

  useEffect(() => {
    if (!isValid && captchaCode) resetCaptcha();
  }, [captchaCode, isValid, resetCaptcha]);

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
        <div className="text-2xl font-bold text-slate-800">Create an account</div>
        <div className="text-sm text-slate-500 mt-1">Start building your website today</div>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-sm text-slate-500">Already have an account?</span>
          <Link
            to="/signin"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>

      {alreadyRegisteredMessage !== '' && (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-xs font-normal text-red-700">{alreadyRegisteredMessage}</p>
        </div>
      )}

      <Form {...form}>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmitHandler)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">{t('EMAIL')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('ENTER_YOUR_EMAIL')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-start gap-2 mt-1">
            <Checkbox
              id="terms-checkbox"
              checked={isTermsAccepted}
              onCheckedChange={(checked: boolean) => setIsTermsAccepted(checked)}
              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <label
              htmlFor="terms-checkbox"
              className="text-sm text-slate-500 font-normal leading-5 cursor-pointer"
            >
              {t('I_AGREE_TO')}{' '}
              <a
                href="https://selisegroup.com/software-development-terms/"
                className="text-blue-600 underline hover:text-blue-700"
              >
                {t('TERM_OF_SERVICE')}
              </a>{' '}
              {t('ACKNOWLEDGE_I_HAVE_READ')}{' '}
              <a
                href="https://selisegroup.com/privacy-policy/"
                className="text-blue-600 underline hover:text-blue-700"
              >
                {t('PRIVACY_POLICY')}
              </a>
            </label>
          </div>

          {captchaEnabled && (
            <div className="my-2">
              <Captcha {...captcha} theme="light" size="normal" />
            </div>
          )}

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white mt-2"
            size="lg"
            type="submit"
            disabled={!isTermsAccepted || (captchaEnabled && !captchaCode)}
          >
            {t('SIGN_UP')}
          </Button>
        </form>
      </Form>
    </div>
  );
};

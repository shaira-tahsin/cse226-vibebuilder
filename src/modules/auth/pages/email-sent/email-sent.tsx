import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import { Zap, Mail } from 'lucide-react';

export const EmailSentPage = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      {/* VibeBuilder branding */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-slate-800 text-xl tracking-tight">VibeBuilder</span>
      </div>

      {/* Email icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold text-slate-800 mb-2">{t('EMAIL_SENT')}</div>
        <div className="text-sm text-slate-500 leading-6">
          {t('EMAIL_SENT_REGISTERED_EMAIL')}
        </div>
      </div>

      <Link to="/login">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
          size="lg"
          type="button"
        >
          {t('GO_TO_LOGIN')}
        </Button>
      </Link>
      <Link to="/signup">
        <Button
          className="w-full text-blue-600 hover:text-blue-700"
          size="lg"
          type="button"
          variant="ghost"
        >
          {t('CHANGE_EMAIL_ADDRESS')}
        </Button>
      </Link>
    </div>
  );
};

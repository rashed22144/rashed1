import React from 'react';
import { ShieldAlert, LogOut, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { backend } from '@/api/backendClient';

export default function UserNotRegisteredError() {
  const { t, dir } = useLanguage();

  const handleLogout = async () => {
    try {
      if (backend?.auth?.logout) {
        await backend.auth.logout();
      }
      // إعادة تحميل الصفحة لنقل المستخدم لصفحة تسجيل الدخول الرئيسية
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      window.location.reload();
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-slate-100 p-4" 
      dir={dir}
    >
      <div className="max-w-md w-full p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100/80 text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* أيقونة التحذير المحسنة والمضيئة */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs animate-bounce duration-1000">
          <ShieldAlert className="w-8 h-8 stroke-[2]" />
        </div>
        
        {/* العناوين المترجمة */}
        <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
          {t('accessRestricted')}
        </h1>
        
        <p className="text-sm text-gray-500 leading-relaxed mb-6 px-2">
          {t('notRegisteredDesc')}
        </p>
        
        {/* صندوق النصائح والإرشادات */}
        <div className="p-4 bg-slate-50/80 rounded-xl text-start border border-gray-100 text-xs sm:text-sm text-gray-600 mb-6">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-200/60 pb-1.5">
            {t('suggestedSteps')}
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-500 ps-1" dir={dir}>
            <li>
              {t('stepOfficialEmail')}
            </li>
            <li>
              {t('stepRelogin')}
            </li>
            <li>
              {t('stepContactAdmin')}
            </li>
          </ul>
        </div>

        {/* أزرار الأكشن التفاعلية والعملية */}
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleReload}
              variant="outline"
              className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 h-10 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>{t('reloadPage')}</span>
            </Button>

            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('switchAccount')}</span>
            </Button>
          </div>

          <a 
            href="mailto:support@apu.edu.my" 
            className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('contactSupport')}</span>
          </a>
        </div>

      </div>
    </div>
  );
}
import React from 'react';
import { ShieldAlert, LogOut, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { backend } from '@/api/backendClient';

export default function UserNotRegisteredError() {
  const { t, dir, language } = useLanguage();

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
          {language === 'ar' ? 'الدخول غير مصرح به' : 'Access Restricted'}
        </h1>
        
        <p className="text-sm text-gray-500 leading-relaxed mb-6 px-2">
          {language === 'ar' 
            ? 'حسابك الحالي غير مسجل في النظام لاستخدام هذا التطبيق. يرجى التأكد من تسجيل الدخول بالحساب الصحيح أو التواصل مع الإدارة.' 
            : 'Your account is not registered to use this application. Please verify your credentials or contact the administrator.'}
        </p>
        
        {/* صندوق النصائح والإرشادات */}
        <div className="p-4 bg-slate-50/80 rounded-xl text-right border border-gray-100 text-xs sm:text-sm text-gray-600 mb-6">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-200/60 pb-1.5">
            {language === 'ar' ? 'حلول مقترحة لحل المشكلة:' : 'Suggested steps to resolve this:'}
          </p>
          <ul className={`list-disc list-inside space-y-1.5 text-gray-500 ${language === 'ar' ? 'pr-1' : 'pl-1'}`} dir={dir}>
            <li>
              {language === 'ar' ? 'تأكد من استخدام بريدك الجامعي الرسمي المتوافق.' : 'Verify you are using your official email account.'}
            </li>
            <li>
              {language === 'ar' ? 'قم بتسجيل الخروج وإعادة الدخول لتحديث الصلاحيات.' : 'Try logging out and logging back in again.'}
            </li>
            <li>
              {language === 'ar' ? 'تواصل مع الدعم الفني لتفعيل حسابك يدويياً.' : 'Contact the app administrator to request access.'}
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
              <span>{language === 'ar' ? 'تحديث الصفحة' : 'Reload'}</span>
            </Button>

            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تبديل الحساب' : 'Switch Account'}</span>
            </Button>
          </div>

          <a 
            href="mailto:support@apu.edu.my" 
            className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ar' ? 'مراسلة الدعم الفني' : 'Contact Support'}</span>
          </a>
        </div>

      </div>
    </div>
  );
}
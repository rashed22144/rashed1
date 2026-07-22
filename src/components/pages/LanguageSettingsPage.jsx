import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSettingsPage() {
    const { language, changeLanguage, dir } = useLanguage();

    const languages = [
        {
            code: 'ar',
            nameInAr: 'العربية',
            nameInEn: 'Arabic',
            nativeName: 'العربية',
            flag: '🇸🇦',
            descriptionAr: 'اللغة العربية',
            descriptionEn: 'Arabic Language',
        },
        {
            code: 'en',
            nameInAr: 'الإنجليزية',
            nameInEn: 'English',
            nativeName: 'English',
            flag: '🇺🇸',
            descriptionAr: 'اللغة الإنجليزية',
            descriptionEn: 'English Language',
        },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6" dir={dir}>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {language === 'ar' ? 'إعدادات اللغة' : 'Language Settings'}
                </h1>
                <p className="text-gray-600">
                    {language === 'ar' ? 'اختر اللغة المفضلة لديك' : 'Choose your preferred language'}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        {language === 'ar' ? 'اللغات المتاحة' : 'Available Languages'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {languages.map((lang) => (
                        <div
                            key={lang.code}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                language === lang.code
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => changeLanguage(lang.code)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{lang.flag}</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">
                                            {lang.nativeName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {language === 'ar' ? lang.descriptionAr : lang.descriptionEn}
                                        </p>
                                    </div>
                                </div>
                                {language === lang.code && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Check className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

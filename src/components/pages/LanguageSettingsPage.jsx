import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSettingsPage() {
    const { t, language, changeLanguage, dir } = useLanguage();

    const languages = [
        {
            code: 'ar',
            nativeName: 'العربية',
            flag: '🇸🇦',
            descriptionKey: 'langDescArabic',
        },
        {
            code: 'en',
            nativeName: 'English',
            flag: '🇺🇸',
            descriptionKey: 'langDescEnglish',
        },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6" dir={dir}>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('languageSettingsTitle')}
                </h1>
                <p className="text-gray-600">
                    {t('chooseLanguage')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        {t('availableLanguages')}
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
                                            {t(lang.descriptionKey)}
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

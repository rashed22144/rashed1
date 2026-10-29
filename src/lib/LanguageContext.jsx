import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translate, isSupportedLanguage, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '@/i18n';

const LanguageContext = createContext(null);

function readSavedLanguage() {
    try {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        // English is the default for new/unknown users; the browser language is ignored on purpose.
        return isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE;
    } catch {
        return DEFAULT_LANGUAGE;
    }
}

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(readSavedLanguage);

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
    }, [dir, language]);

    const setLanguage = useCallback((lang) => {
        if (!isSupportedLanguage(lang)) return;
        setLanguageState(lang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch {
            // Storage unavailable (private mode / quota): keep the in-memory choice.
        }
    }, []);

    const t = useCallback((key, params) => translate(language, key, params), [language]);

    return (
        <LanguageContext.Provider value={{ language, dir, t, setLanguage, changeLanguage: setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        return {
            language: DEFAULT_LANGUAGE,
            dir: 'ltr',
            t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
            setLanguage: () => {},
            changeLanguage: () => {},
        };
    }
    return ctx;
}

import en from './en';
import ar from './ar';

export const dictionaries = { en, ar };
export const SUPPORTED_LANGUAGES = ['en', 'ar'];
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'appLanguage';

export function isSupportedLanguage(lang) {
    return SUPPORTED_LANGUAGES.includes(lang);
}

export function translate(language, key, params) {
    const dict = dictionaries[language] || dictionaries[DEFAULT_LANGUAGE];
    let text = dict[key] ?? dictionaries[DEFAULT_LANGUAGE][key] ?? key;
    if (params) {
        Object.entries(params).forEach(([name, value]) => {
            text = text.replaceAll(`{${name}}`, String(value));
        });
    }
    return text;
}

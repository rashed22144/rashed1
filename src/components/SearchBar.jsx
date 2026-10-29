import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function SearchBar({ onSearch, placeholder, initialValue = '' }) {
    const { t, dir } = useLanguage();
    const effectivePlaceholder = placeholder || t('searchServicesPlaceholder');
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const navigate = useNavigate();

    useEffect(() => {
        setSearchTerm(initialValue || '');
    }, [initialValue]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(createPageUrl('SearchResultsPage?q=' + encodeURIComponent(searchTerm.trim())));
            if (onSearch) onSearch(searchTerm.trim());
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (onSearch) onSearch('');
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto" dir={dir}>
            <div className="relative flex items-center">
                <Input
                    type="text"
                    placeholder={effectivePlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label={t('search')}
                    className="w-full h-12 text-base ps-12 pe-28 border-2 border-gray-200 focus-visible:ring-blue-500 focus:border-blue-500 rounded-xl bg-white shadow-sm transition-all duration-200"
                />

                <Search className="absolute start-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />

                <div className="absolute end-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchTerm && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t('search')}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
                            onClick={clearSearch}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}

                    <Button
                        type="submit"
                        className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shrink-0 transition-all duration-200 active:scale-95"
                        disabled={!searchTerm.trim()}
                    >
                        {t('search')}
                    </Button>
                </div>
            </div>
        </form>
    );
}

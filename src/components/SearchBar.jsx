import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function SearchBar({ onSearch, placeholder, initialValue = '' }) {
    const { language } = useLanguage();
    const effectivePlaceholder = placeholder || (language === 'en' ? 'Search services...' : 'ابحث عن الخدمات...');
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
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto" dir="rtl">
            <div className="relative flex items-center">
                <Input
                    type="text"
                    placeholder={effectivePlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    // التعديل السحري هنا: pr-12 تعطي مسافة للعدسة يميناً، و pl-28 تعطي مسافة أمان للأزرار يساراً فلا تتداخل الكتابة أبداً
                    className="w-full h-12 text-base pr-12 pl-28 border-2 border-gray-200 focus-visible:ring-blue-500 focus:border-blue-500 rounded-xl bg-white shadow-sm transition-all duration-200"
                />
                
                {/* أيقونة البحث جهة اليمين */}
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                
                {/* الأزرار العائمة جهة اليسار مرتبة بجانب بعضها */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchTerm && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
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
                        بحث
                    </Button>
                </div>
            </div>
        </form>
    );
}
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ServicePublic } from '@/entities/ServicePublic';
import { User } from '@/entities/User';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin } from 'lucide-react';
import ServiceCard from '../ServiceCard';
import SearchBar from '../SearchBar';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationContext } from '../LocationContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function SearchResultsPage() {
    const { location, isLoading: isLocationLoading } = useContext(LocationContext);
    const { language, dir } = useLanguage();
    const [services, setServices] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const locationParams = useLocation();
    const params = new URLSearchParams(locationParams.search);
    const query = params.get('q');

    const loadUser = useCallback(async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
        } catch (error) {
            // User not logged in
        }
    }, []);

    const performSearch = useCallback(async (searchQuery) => {
        if (!location) {
            setIsLoading(false);
            setServices([]);
            return;
        }

        if (!searchQuery?.trim()) {
            setIsLoading(false);
            setServices([]);
            return;
        }

        setIsLoading(true);
        try {
            const locationFilter = { country: location.country, city: location.city };
            const allServicesInLocation = await ServicePublic.filter(locationFilter);
            
            const filteredServices = allServicesInLocation.filter(service => {
                const lowerQuery = searchQuery.toLowerCase();
                return (
                    service.name?.toLowerCase().includes(lowerQuery) ||
                    service.description?.toLowerCase().includes(lowerQuery) ||
                    service.provider_name?.toLowerCase().includes(lowerQuery) ||
                    service.category_name?.toLowerCase().includes(lowerQuery)
                );
            });
            
            setServices(filteredServices);
        } catch (error) {
            console.error('خطأ في البحث:', error);
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    }, [location]);

    useEffect(() => {
        setSearchTerm(query || '');
        if (!isLocationLoading) {
            performSearch(query || '');
            loadUser();
        }
    }, [query, isLocationLoading, performSearch, loadUser]);

    const handleNewSearch = (newSearchTerm) => {
        const url = new URL(window.location);
        url.searchParams.set('q', newSearchTerm);
        window.history.pushState({}, '', url);
        setSearchTerm(newSearchTerm);
        performSearch(newSearchTerm);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8" dir={dir}>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <SearchBar 
                    onSearch={handleNewSearch}
                    placeholder={language === 'ar' ? 'ابحث عن الخدمات بالاسم أو الوصف أو مقدم الخدمة...' : 'Search services by name, description, or provider...'}
                    initialValue={searchTerm}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Search className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
{searchTerm
                                ? (language === 'ar' ? `نتائج البحث عن "${searchTerm}"` : `Search results for "${searchTerm}"`)
                                : (language === 'ar' ? 'نتائج البحث' : 'Search results')}
                            {location && (
                                <span className="text-lg text-gray-500">
                                    {' '}{language === 'ar' ? `في ${location.city}` : `in ${location.city}`}
                                </span>
                            )}
                        </h1>
                    </div>
                    
                    {!isLoading && !isLocationLoading && (
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            {services.length} {language === 'ar' ? 'نتيجة' : 'results'}
                        </Badge>
                    )}
                </div>

                {isLoading || isLocationLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="overflow-hidden">
                                <Skeleton className="h-52 w-full" />
                                <div className="p-5 space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : !location ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <MapPin className="mx-auto h-16 w-16 text-blue-500 mb-6" />
<h2 className="text-2xl font-bold text-gray-800 mb-3">
                                {language === 'ar' ? 'يرجى تحديد موقعك' : 'Please select your location'}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {language === 'ar' ? 'يجب تحديد موقعك أولاً قبل إجراء البحث عن الخدمات.' : 'You must select your location before searching for services.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map(service => (
                            <ServiceCard 
                                key={service.id} 
                                service={service}
                                currentUser={user}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <CardContent>
                            <Search className="mx-auto h-16 w-16 text-gray-400 mb-6" />
<h2 className="text-2xl font-bold text-gray-800 mb-3">
                                {language === 'ar' ? 'لم نجد أي نتائج' : 'No results found'}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? (language === 'ar'
                                        ? `لم نجد أي خدمات تطابق "${searchTerm}" في ${location.city}. جرب كلمات مفتاحية أخرى.`
                                        : `We couldn't find any services matching "${searchTerm}" in ${location.city}. Try different keywords.`)
                                    : (language === 'ar' ? 'يرجى إدخال كلمة أو عبارة للبحث.' : 'Please enter a word or phrase to search.')
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

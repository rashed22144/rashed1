import React, { useState, useEffect, useContext } from 'react';
import { ServicePublic } from '@/entities/ServicePublic';
import { Category } from '@/entities/Category';
import { useLocation, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import ServiceCard from '../ServiceCard';
import { Users, User, PersonStanding, Baby, MapPin } from 'lucide-react';
import { LocationContext } from '../LocationContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function CategoryPage() {
    const { location, isLoading: isLocationLoading } = useContext(LocationContext);
    const { language, dir } = useLanguage();

    const ageFilters = [
        { value: 'all', label: language === 'ar' ? 'الكل' : 'All', icon: Users },
        { value: 'men', label: language === 'ar' ? 'رجالي' : 'Men', icon: User },
        { value: 'women', label: language === 'ar' ? 'نسائي' : 'Women', icon: PersonStanding },
        { value: 'children', label: language === 'ar' ? 'أطفال' : 'Children', icon: Baby },
    ];
    const [services, setServices] = useState([]);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const locationParams = useLocation();
    const params = new URLSearchParams(locationParams.search);
    const categoryName = params.get('name');

    useEffect(() => {
        Category.list().then(cats => {
            const found = cats.find(c => c.name === categoryName);
            setCategoryInfo(found || null);
        }).catch(() => {});
    }, [categoryName]);

    useEffect(() => {
        if (categoryName && !isLocationLoading && location) {
            async function fetchServices() {
                setIsLoading(true);
                const filter = { 
                    category_name: categoryName,
                    country: location.country,
                    city: location.city
                };
                const data = await ServicePublic.filter(filter, '-created_date');
                setServices(data);
                setIsLoading(false);
            }
            fetchServices();
        } else if (!isLocationLoading) {
            setIsLoading(false);
        }
    }, [categoryName, location, isLocationLoading]);

    const filteredServices = services.filter(service =>
        categoryName !== 'ملابس' || activeFilter === 'all' || service.age_category === activeFilter
    );

    const displayCategoryName = (language === 'en' && categoryInfo?.name_en) ? categoryInfo.name_en : categoryName;

    if (isLoading || isLocationLoading) {
        return (
            <div dir={dir}>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
                    <Skeleton className="h-10 w-3/4" />
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <Skeleton className="h-52 w-full" />
                            <div className="p-5 space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!location) {
        return (
             <div className="text-center py-20 bg-white rounded-2xl shadow-lg" dir={dir}>
                <MapPin className="mx-auto h-16 w-16 text-blue-500 mb-6" />
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    {language === 'ar' ? 'يرجى تحديد موقعك أولاً' : 'Please select your location first'}
                </h1>
                <p className="text-lg text-gray-600">
                    {language === 'ar'
                        ? 'لا يمكن عرض الخدمات في هذا القسم قبل تحديد موقعك.'
                        : 'Services in this category cannot be shown before you select your location.'}
                </p>
            </div>
        );
    }

    return (
        <div dir={dir}>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    {language === 'ar' ? (
                        <>قسم {displayCategoryName} في <span className="text-blue-600">{location.city}</span></>
                    ) : (
                        <>{displayCategoryName} in <span className="text-blue-600">{location.city}</span></>
                    )}
                </h1>
                <p className="text-gray-600 text-lg">
                    {language === 'ar'
                        ? `اكتشف أفضل مقدمي الخدمات في ${displayCategoryName}`
                        : `Discover the best service providers in ${displayCategoryName}`}
                </p>
            </div>

            {categoryName === 'ملابس' && (
                <div className="flex justify-center flex-wrap gap-3 mb-10">
                    {ageFilters.map(filter => {
                        const Icon = filter.icon;
                        return (
                            <Button
                                key={filter.value}
                                variant={activeFilter === filter.value ? 'default' : 'outline'}
                                onClick={() => setActiveFilter(filter.value)}
                                className={`px-6 py-3 text-base rounded-full transition-all duration-300 ${
                                    activeFilter === filter.value
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <Icon className="w-5 h-5 ml-2" />
                                {filter.label}
                            </Button>
                        )
                    })}
                </div>
            )}

            {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredServices.map(service => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-5.5a2 2 0 00-1.5.67l-.5.33a2 2 0 01-2 0l-.5-.33A2 2 0 009.5 13H4" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            {language === 'ar' ? 'لا توجد خدمات بعد' : 'No services yet'}
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {language === 'ar'
                                ? `كن أول من يضيف خدمة في قسم "${displayCategoryName}" في مدينة ${location.city}.`
                                : `Be the first to add a service in "${displayCategoryName}" in ${location.city}.`}
                        </p>
                        <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-800">
                            <Link to={createPageUrl("AddServicePage")}>
                                {language === 'ar' ? 'أضف خدمتك الآن' : 'Add your service now'}
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

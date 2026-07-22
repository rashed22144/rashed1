import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Category } from '@/entities/Category';
import { ServicePublic } from '@/entities/ServicePublic';
import { User } from '@/entities/User';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GraduationCap, Wrench, Paintbrush, HeartPulse, Briefcase, PartyPopper, Tag, Crown, ChevronLeft, Shirt, Package, Gamepad2, UtensilsCrossed, MapPin } from 'lucide-react';
import ServiceCard from '../ServiceCard';
import { LocationContext } from '../LocationContext';
import { useLanguage } from '@/lib/LanguageContext';

const iconMap = {
    GraduationCap,
    Wrench,
    Paintbrush,
    HeartPulse,
    Briefcase,
    PartyPopper,
    Shirt,
    Package,
    Gamepad2,
    UtensilsCrossed,
};

const CategoryCard = ({ category, language }) => {
    const IconComponent = iconMap[category.icon] || Tag;
    const displayName = language === 'en' && category.name_en ? category.name_en : category.name;
    const displayDesc = language === 'en' && category.description_en ? category.description_en : category.description;
    return (
        <Link to={createPageUrl('CategoryPage?name=' + encodeURIComponent(category.name))}>
            <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-6 pb-1 md:pb-2">
                    <CardTitle className="text-sm md:text-xl font-bold text-gray-800 leading-tight">{displayName}</CardTitle>
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                       <IconComponent className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6 pt-1">
                    <p className="text-gray-500 text-xs md:text-base line-clamp-2">{displayDesc}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function HomePage() {
    const { location, isLoading: isLocationLoading } = useContext(LocationContext);
    const { t, language, dir } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [featuredServices, setFeaturedServices] = useState([]);
    const [servicesByCategory, setServicesByCategory] = useState({});
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!location) {
            setIsLoading(false);
            setFeaturedServices([]);
            setServicesByCategory({});
            setCategories([]);
            return; // Don't load data if no location is set
        }

        setIsLoading(true);
        try {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (error) { /* User not logged in */ }

            const categoriesData = await Category.list();
            setCategories(categoriesData);
            
            const locationFilter = { country: location.country, city: location.city };
            const allServices = await ServicePublic.filter(locationFilter, '-created_date');
            
            const premiumServices = allServices.filter(s => s.subscription_plan === 'premium').slice(0, 6);
            setFeaturedServices(premiumServices);

            const servicesByCat = {};
            categoriesData.forEach(category => {
                const categoryServices = allServices
                    .filter(s => s.category_name === category.name)
                    .slice(0, 4);
                if (categoryServices.length > 0) {
                    servicesByCat[category.name] = categoryServices;
                }
            });
            setServicesByCategory(servicesByCat);

        } catch (error) {
            console.error('خطأ في جلب البيانات:', error);
        } finally {
            setIsLoading(false);
        }
    }, [location]);
    
    useEffect(() => {
        if (!isLocationLoading) {
            loadData();
        }
    }, [isLocationLoading, loadData]);

    if (isLoading || isLocationLoading) {
        return (
             <div className="space-y-12">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-10 w-1/3 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            </div>
        );
    }
    
    if (!location) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg" dir={dir}>
                <MapPin className="mx-auto h-16 w-16 text-blue-500 mb-6" />
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('welcome')}</h1>
                <p className="text-lg text-gray-600 mb-8">{t('selectLocation')}</p>
                <p className="text-sm text-gray-500">{t('changeLocationLater')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-12" dir={dir}>
            <div className="text-center bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 md:p-12 rounded-2xl shadow-lg">
                <h1 className="text-2xl md:text-5xl font-extrabold mb-2 md:mb-4">{t('discoverServices')} {location.city}</h1>
                <p className="text-sm md:text-xl max-w-3xl mx-auto mb-5 md:mb-8 opacity-90">{t('trustedPlatform')}</p>
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                    {user ? (
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-base md:text-lg px-6 py-4 md:py-6" asChild>
                            <Link to={createPageUrl("AddServicePage")}>
                                {t('addServiceNow')} <ArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                            </Link>
                        </Button>
                    ) : (
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-base md:text-lg px-6 py-4 md:py-6">
                            {t('startFree')}
                        </Button>
                    )}
                </div>
            </div>

            {featuredServices.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <Crown className="w-5 h-5 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
                            <h2 className="text-lg md:text-3xl font-bold text-gray-900">{t('featuredIn')} {location.city}</h2>
                            <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs">
                                {t('premiumOnly')}
                            </Badge>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {featuredServices.map(service => (
                            <ServiceCard key={service.id} service={service} currentUser={user} />
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8 text-center">{t('browseCategories')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {categories.map(category => (
                        <CategoryCard key={category.id} category={category} language={language} />
                    ))}
                </div>
            </section>

            <div className="space-y-8 md:space-y-12">
                {categories.map(category => {
                    const categoryServices = servicesByCategory[category.name];
                    const IconComponent = iconMap[category.icon] || Tag;
                    const displayName = language === 'en' && category.name_en ? category.name_en : category.name;
                    const displayDesc = language === 'en' && category.description_en ? category.description_en : category.description;

                    if (!categoryServices || categoryServices.length === 0) return null;

                    return (
                        <section key={category.id} className="space-y-3 md:space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base md:text-2xl font-bold text-gray-900 truncate">{displayName}</h2>
                                        <p className="text-gray-500 text-xs md:text-base hidden sm:block truncate">{displayDesc}</p>
                                    </div>
                                </div>
                                <Link
                                    to={createPageUrl('CategoryPage?name=' + encodeURIComponent(category.name))}
                                    className="flex-shrink-0 flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline"
                                >
                                    {t('viewAll')} <ChevronLeft className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                {categoryServices.map(service => (
                                    <ServiceCard key={service.id} service={service} currentUser={user} />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 md:p-12 rounded-2xl text-center">
                <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">{t('joinNetwork')}</h2>
                <p className="text-sm md:text-xl mb-5 md:mb-8 opacity-90">{t('joinSubtitle')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-bold">{t('signUpFree')}</Button>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">{t('learnMore')}</Button>
                </div>
            </div>
        </div>
    );
}

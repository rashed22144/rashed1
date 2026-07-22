import React, { useState, useEffect, useContext } from 'react';
import { Service } from '@/entities/Service';
import { Category } from '@/entities/Category';
import { Location } from '@/entities/Location';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Info, Send, ShieldAlert, Sparkles, CheckCircle2, LogIn } from 'lucide-react';
import ImageUpload from '../ImageUpload';
import { LocationContext } from '../LocationContext';
import { backend } from '@/api/backendClient';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

const MAX_SERVICES = 3;

// ضع بريدك الإلكتروني هنا لاستقبال إشعارات الخدمات الجديدة
const ADMIN_EMAIL = 's2176951@gmail.com';

export default function AddServicePage() {
    const { location: userLocation } = useContext(LocationContext);
    const { currentUser: authUser, isLoading: authLoading, loginWithGoogle } = useAuth();
    const { t, language, dir } = useLanguage();

    const ageCategoryOptions = [
        { value: 'all', label: t('ageAll') },
        { value: 'men', label: t('ageMen') },
        { value: 'women', label: t('ageWomen') },
        { value: 'children', label: t('ageChildren') },
    ];
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_name: '',
        provider_name: '',
        phone: '',
        whatsapp: '',
        email: '',
        image_url: '',
        age_category: 'all',
        country: '',
        city: '',
    });
    const [categories, setCategories] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [myServicesCount, setMyServicesCount] = useState(0);
    const [checkingLimit, setCheckingLimit] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            const [catData, locData] = await Promise.all([Category.list(), Location.list()]);
            setCategories(catData);
            setAllLocations(locData);
            setCountries([...new Set(locData.map(loc => loc.country))]);

            try {
                const me = await backend.auth.me();
                setCurrentUser(me);
                const myServices = await Service.filter({ created_by: me.email });
                setMyServicesCount(myServices.length);
            } catch {}
            setCheckingLimit(false);
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (userLocation) {
            setFormData(prev => ({
                ...prev,
                country: userLocation.country,
                city: userLocation.city,
            }));
        }
    }, [userLocation]);

    useEffect(() => {
        if (formData.country) {
            const countryCities = allLocations
                .filter(loc => loc.country === formData.country)
                .map(loc => loc.city);
            setCities(countryCities);
            if (!countryCities.includes(formData.city)) {
                setFormData(prev => ({ ...prev, city: '' }));
            }
        }
    }, [formData.country, formData.city, allLocations]);
    
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (imageUrl) => {
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const createdService = await Service.create({ ...formData, created_by: authUser?.email });

            // إرسال إشعار بريد إلكتروني للمشرف
            backend.integrations.Core.SendEmail({
                to: ADMIN_EMAIL,
                subject: `🆕 خدمة جديدة أضيفت: ${formData.name}`,
                body: `
                    <h2>تم إضافة خدمة جديدة في المنصة</h2>
                    <ul>
                        <li><strong>اسم الخدمة:</strong> ${formData.name}</li>
                        <li><strong>القسم:</strong> ${formData.category_name}</li>
                        <li><strong>مقدم الخدمة:</strong> ${formData.provider_name}</li>
                        <li><strong>الموقع:</strong> ${formData.city}, ${formData.country}</li>
                        <li><strong>الهاتف:</strong> ${formData.phone || 'غير محدد'}</li>
                        <li><strong>البريد:</strong> ${formData.email || 'غير محدد'}</li>
                    </ul>
                `
            });

            navigate(createPageUrl('CategoryPage?name=' + encodeURIComponent(formData.category_name)));
        } catch (error) {
            console.error("Failed to create service:", error);
            alert(`حدث خطأ في إضافة الخدمة: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasReachedLimit = myServicesCount >= MAX_SERVICES;

    if (checkingLimit || authLoading) return (
        <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!authUser) return (
        <div className="max-w-lg mx-auto mt-10">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-100 text-center">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-10">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('loginRequiredTitle')}</h2>
                    <p className="text-white/80 text-sm">{t('loginRequiredDesc')}</p>
                </div>
                <div className="px-8 py-6">
                    <button
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3.5 font-semibold transition-colors"
                    >
                        <LogIn className="w-5 h-5" />
                        {language === 'en' ? 'Sign in with Google' : 'تسجيل الدخول بحساب Google'}
                    </button>
                </div>
            </div>
        </div>
    );

    const isBanned = authUser.banned_until && new Date(authUser.banned_until) > new Date();
    if (isBanned) return (
        <div className="max-w-lg mx-auto mt-10 text-center bg-white rounded-3xl shadow-xl overflow-hidden border border-red-100">
            <div className="bg-gradient-to-br from-red-500 to-red-700 px-8 py-10">
                <ShieldAlert className="w-16 h-16 text-white mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-2">
                    {language === 'en' ? 'Your account is banned from posting' : 'حسابك محظور مؤقتاً من النشر'}
                </h2>
                <p className="text-white/80 text-sm">
                    {language === 'en'
                        ? `You can browse only until ${new Date(authUser.banned_until).toLocaleDateString('en-US')}`
                        : `يمكنك التصفح فقط حتى ${new Date(authUser.banned_until).toLocaleDateString('ar')}`}
                </p>
            </div>
        </div>
    );

    if (hasReachedLimit) return (
        <div className="max-w-lg mx-auto mt-10">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-red-100">
                <div className="bg-gradient-to-br from-red-500 to-orange-500 px-8 py-10 text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('limitReachedTitle')}</h2>
                    <p className="text-white/80 text-sm">{t('limitReachedSubtitle')}</p>
                </div>
                <div className="px-8 py-6 space-y-4">
                    <div className="flex items-center justify-between bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100">
                        <span className="text-gray-700 font-medium">{t('registeredServicesLabel')}</span>
                        <div className="flex gap-1.5">
                            {Array.from({ length: MAX_SERVICES }).map((_, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < myServicesCount ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    {i < myServicesCount ? '✓' : i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm text-center leading-relaxed">
                        {t('limitReachedNote').replace('{max}', MAX_SERVICES)}
                    </p>
                    <button
                        onClick={() => navigate(createPageUrl('MyProfilePage'))}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl py-3.5 font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        {t('manageMyServicesBtn')}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto" dir={dir}>
            {/* Service limit indicator */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 mb-5">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('registeredServicesLabel')}: <span className="font-bold">{myServicesCount}/{MAX_SERVICES}</span></span>
                </div>
                <div className="flex gap-1.5">
                    {Array.from({ length: MAX_SERVICES }).map((_, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-all ${i < myServicesCount ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-300'}`}>
                            {i < myServicesCount ? '✓' : i + 1}
                        </div>
                    ))}
                </div>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-blue-800">{t('addServiceTitle')}</CardTitle>
                    <CardDescription className="text-lg">
                        {t('addServiceDesc')}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="font-medium text-gray-700 block mb-2">{t('serviceNameLabel')}</label>
                                <Input id="name" value={formData.name} onChange={handleChange} placeholder={t('serviceNamePlaceholder')} required />
                            </div>
                             <div>
                                <label htmlFor="category_name" className="font-medium text-gray-700 block mb-2">{t('selectCategoryLabel')}</label>
                                <Select onValueChange={(value) => handleSelectChange('category_name', value)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectCategoryPlaceholder')}>
                                            {formData.category_name
                                                ? (language === 'en'
                                                    ? (categories.find(c => c.name === formData.category_name)?.name_en || formData.category_name)
                                                    : formData.category_name)
                                                : undefined}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {language === 'en' && cat.name_en ? cat.name_en : cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.category_name === 'ملابس' && (
                            <div>
                                <label htmlFor="age_category" className="font-medium text-gray-700 block mb-2">{t('selectAgeCategoryLabel')}</label>
                                <Select onValueChange={(value) => handleSelectChange('age_category', value)} defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectAgeCategoryPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ageCategoryOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="country" className="font-medium text-gray-700 block mb-2">{t('countryLabel')}</label>
                                <Select value={formData.country} onValueChange={(value) => handleSelectChange('country', value)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectCountryPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map(country => (
                                            <SelectItem key={country} value={country}>{country}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <label htmlFor="city" className="font-medium text-gray-700 block mb-2">{t('cityLabel')}</label>
                                <Select value={formData.city} onValueChange={(value) => handleSelectChange('city', value)} disabled={!formData.country} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectCityPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map(city => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="font-medium text-gray-700 block mb-2">{t('serviceDescriptionLabel')}</label>
                            <Textarea id="description" value={formData.description} onChange={handleChange} placeholder={t('serviceDescriptionPlaceholder')} rows={4} required />
                        </div>
                        <div>
                            <label className="font-medium text-gray-700 block mb-2">{t('serviceImageLabel')}</label>
                            <ImageUpload 
                                onImageUploaded={handleImageUpload}
                                currentImageUrl={formData.image_url}
                            />
                        </div>
                        <h3 className="text-xl font-bold pt-4 border-t text-blue-800">{t('contactInfoTitle')}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="provider_name" className="font-medium text-gray-700 block mb-2">{t('providerNameLabel')}</label>
                                <Input id="provider_name" value={formData.provider_name} onChange={handleChange} placeholder={t('providerNamePlaceholder')} required/>
                            </div>
                             <div>
                                <label htmlFor="phone" className="font-medium text-gray-700 block mb-2">{t('phoneNumber')}</label>
                                <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="05xxxxxxxx" />
                            </div>
                             <div>
                                <label htmlFor="whatsapp" className="font-medium text-gray-700 block mb-2">{t('whatsappLabel')}</label>
                                <Input id="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="05xxxxxxxx" />
                            </div>
                             <div>
                                <label htmlFor="email" className="font-medium text-gray-700 block mb-2">{t('emailAddress')}</label>
                                <Input id="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" type="email" />
                            </div>
                        </div>
                        <Alert className="bg-blue-50 border-blue-200">
                          <Info className="h-5 w-5 text-blue-600" />
                          <AlertTitle className="font-bold text-blue-800">{t('subscriptionComingTitle')}</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            {t('subscriptionComingDesc')}
                          </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-800" disabled={isSubmitting}>
                             <Send className="ml-2 h-5 w-5" />
                            {isSubmitting ? t('sendingService') : t('submitServiceBtn')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

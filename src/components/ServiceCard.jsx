import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Crown, Eye, MousePointer, ExternalLink } from 'lucide-react';
import { incrementServiceClick, incrementServiceView, getServiceContact } from '@/api/backendClient';
import ServiceActionsMenu from './ServiceActionsMenu';
import { useNavigate } from 'react-router-dom';
import { createPageUrl, toWhatsAppNumber } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { getCategoriesMap } from '@/lib/categoriesCache';

// صور افتراضية محسنة ومضغوطة الأبعاد والأوزان عبر معلمات الرابط q=75 و w=600 لسرعة لود فورية
const defaultImages = {
    'تعليم وتدريب': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'صيانة منزلية': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'تصميم وجرافيكس': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'صحة وجمال': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'استشارات وأعمال': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'تنظيم مناسبات': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'ملابس': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'منتجات': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75',
    'ألعاب أطفال': 'https://images.unsplash.com/photo-1558877385-2e4c79305d0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=75'
};

export default function ServiceCard({ service, onServiceDeleted, showActions = false, currentUser: currentUserProp = null }) {
    const navigate = useNavigate();
    const { t, language, dir } = useLanguage();
    const { currentUser: globalUser } = useAuth();
    const currentUser = currentUserProp || globalUser;
    const [categoriesMap, setCategoriesMap] = useState({});

    useEffect(() => {
        getCategoriesMap().then(setCategoriesMap);
    }, []);

    const categoryDisplayName = (() => {
        const cat = categoriesMap[service.category_name];
        if (language === 'en' && cat?.name_en) return cat.name_en;
        return service.category_name || (language === 'en' ? 'Service' : 'خدمة');
    })();

    const getImageUrl = () => {
        if (service.image_url) return service.image_url;
        if (service.imageUrl) return service.imageUrl;
        return defaultImages[service.category_name] || defaultImages['تعليم وتدريب'];
    };

    const isOwner = currentUser && (currentUser.email === service.created_by || currentUser.id === service.user_id);
    const [contactInfo, setContactInfo] = useState(null);
    const [revealingContact, setRevealingContact] = useState(null);

    // لو الكرت جاي من قائمة "خدماتي" (بيانات كاملة أصلاً) نستخدمها مباشرة، غير كذا نطلبها بأمان عبر RPC
    const resolveContact = async (field) => {
        if (service[field]) return service[field];
        if (contactInfo?.[field]) return contactInfo[field];
        if (!currentUser) {
            alert(language === 'en' ? 'Please sign in to view contact info' : 'يجب تسجيل الدخول لعرض بيانات التواصل');
            return null;
        }
        setRevealingContact(field);
        try {
            const info = contactInfo || await getServiceContact(service.id);
            setContactInfo(info);
            setRevealingContact(null);
            return info?.[field] || null;
        } catch (error) {
            setRevealingContact(null);
            alert(error.message);
            return null;
        }
    };

    const handleContactClick = async (e, contactType) => {
        e.stopPropagation();
        incrementServiceClick(service.id);

        const value = await resolveContact(contactType === 'call' ? 'phone' : contactType);
        if (!value) return;

        if (contactType === 'call') {
            window.location.href = 'tel:' + value;
        } else if (contactType === 'whatsapp') {
            window.open('https://wa.me/' + toWhatsAppNumber(value), '_blank', 'noopener,noreferrer');
        } else if (contactType === 'email') {
            window.location.href = 'mailto:' + value;
        }
    };

    const handleCardClick = () => {
        incrementServiceView(service.id);
        navigate(createPageUrl('ServiceDetailPage') + '?id=' + service.id, { state: { service } });
    };

    const handleViewDetails = (e) => {
        e.stopPropagation();
        navigate(createPageUrl('ServiceDetailPage') + '?id=' + service.id, { state: { service } });
    };

    return (
        <Card 
            className="group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 bg-white shadow-md rounded-2xl relative flex flex-col h-full"
            onClick={handleCardClick}
            dir={dir}
        >
            <div className="relative overflow-hidden aspect-[16/10] w-full bg-gray-50 shrink-0">
                <img 
                    src={getImageUrl()} 
                    alt={service.title || service.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className={`absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'}`}>
                    <Badge variant="secondary" className="bg-white/95 text-gray-800 backdrop-blur-xs font-semibold rounded-lg shadow-xs text-[11px]">
                        {categoryDisplayName}
                    </Badge>
                </div>

                {service.subscription_plan === 'premium' && (
                    <div className={`absolute top-3 ${language === 'ar' ? 'left-12' : 'right-12'}`}>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg border-0 shadow-xs text-[11px]">
                            <Crown className="w-3 h-3 ml-1 mr-0.5" />
                            {language === 'en' ? 'Premium' : 'مميز'}
                        </Badge>
                    </div>
                )}
                
                {service.age_category && service.age_category !== 'all' && (
                    <div className={`absolute bottom-3 ${language === 'ar' ? 'right-3' : 'left-3'}`}>
                        <Badge className="bg-blue-600 text-white font-medium rounded-md shadow-xs text-[10px]">
                            {service.age_category}
                        </Badge>
                    </div>
                )}
                
                {showActions && isOwner && (
                    <div className={`absolute top-2 ${language === 'ar' ? 'left-2' : 'right-2'}`} onClick={(e) => e.stopPropagation()}>
                        <ServiceActionsMenu service={service} onServiceDeleted={onServiceDeleted} isOwner={isOwner} />
                    </div>
                )}

                <div className={`absolute bottom-3 ${language === 'ar' ? 'left-3' : 'right-3'} flex gap-1.5`}>
                    {(service.view_count > 0 || showActions) && (
                        <Badge variant="outline" className="bg-black/40 text-white border-0 text-[10px] py-0.5 px-2 backdrop-blur-xs flex items-center gap-1 rounded-md">
                            <Eye className="w-3 h-3" />
                            <span>{service.view_count || 0}</span>
                        </Badge>
                    )}
                    {(service.click_count > 0 || showActions) && (
                        <Badge variant="outline" className="bg-black/40 text-white border-0 text-[10px] py-0.5 px-2 backdrop-blur-xs flex items-center gap-1 rounded-md">
                            <MousePointer className="w-3 h-3" />
                            <span>{service.click_count || 0}</span>
                        </Badge>
                    )}
                </div>
            </div>
            
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
                        {service.title || service.name}
                    </CardTitle>
                    <span className="text-base font-black text-blue-600 shrink-0">
                        {service.price} <span className="text-xs font-bold text-gray-400">{language === 'en' ? 'RM' : 'ر.ي'}</span>
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    {language === 'en' ? 'By:' : 'بواسطة:'} <span className="font-semibold text-gray-600">{service.provider_name || service.author || 'Student'}</span>
                </p>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 pb-3 flex-1">
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                    {service.description}
                </p>
            </CardContent>
            
            <CardFooter className="p-4 pt-3 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-3 mt-auto shrink-0">
                <div className="w-full">
                    <div className="flex flex-wrap gap-2">
                        {(service.has_phone ?? !!service.phone) && (
                            <button
                                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 disabled:opacity-60"
                                onClick={(e) => handleContactClick(e, 'call')}
                                disabled={revealingContact === 'phone'}
                            >
                                <Phone className="w-3 h-3" />
                                <span>{revealingContact === 'phone' ? '...' : (language === 'en' ? 'Call' : 'اتصال')}</span>
                            </button>
                        )}
                        {(service.has_whatsapp ?? !!service.whatsapp) && (
                            <button
                                className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 disabled:opacity-60"
                                onClick={(e) => handleContactClick(e, 'whatsapp')}
                                disabled={revealingContact === 'whatsapp'}
                            >
                                <MessageSquare className="w-3 h-3" />
                                <span>{revealingContact === 'whatsapp' ? '...' : (language === 'en' ? 'WhatsApp' : 'واتساب')}</span>
                            </button>
                        )}
                        {(service.has_email ?? !!service.email) && (
                            <button
                                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 disabled:opacity-60"
                                onClick={(e) => handleContactClick(e, 'email')}
                                disabled={revealingContact === 'email'}
                            >
                                <Mail className="w-3 h-3" />
                                <span>{revealingContact === 'email' ? '...' : (language === 'en' ? 'Email' : 'إيميل')}</span>
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleViewDetails}
                    className="w-full h-9 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-xs active:scale-98"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'View Details' : 'عرض التفاصيل الكاملة'}</span>
                </button>
            </CardFooter>
        </Card>
    );
}
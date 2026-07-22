import React, { useState, useEffect } from 'react';
import { ServicePublic } from '@/entities/ServicePublic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, MessageSquare, Crown, ArrowRight, ArrowLeft, MapPin, Eye, Flag, Lock } from 'lucide-react';
import ServiceReviews from '../ServiceReviews';
import { useLanguage } from '@/lib/LanguageContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createPageUrl, toWhatsAppNumber } from '@/utils';
import { backend, getServiceContact, incrementServiceView, reportService } from '@/api/backendClient';
import { getCategoriesMap } from '@/lib/categoriesCache';

const defaultImages = {
  'تعليم وتدريب': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'صيانة منزلية': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'تصميم وجرافيكس': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'صحة وجمال': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'استشارات وأعمال': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'تنظيم مناسبات': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'ملابس': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'منتجات': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
};

export default function ServiceDetailPage() {
  const { t, dir, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [service, setService] = useState(location.state?.service || null);
  const [isLoading, setIsLoading] = useState(!location.state?.service);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [contactInfo, setContactInfo] = useState(null);
  const [actingOn, setActingOn] = useState(null);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    getCategoriesMap().then(setCategoriesMap);
  }, []);

  const serviceId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (!service && serviceId) {
      loadService();
    }
  }, [serviceId]);

  useEffect(() => {
    backend.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (service?.created_by) {
      backend.entities.User.filter({ email: service.created_by })
        .then((rows) => setSellerProfile(rows[0] || null))
        .catch(() => setSellerProfile(null));
    }
  }, [service?.created_by]);

  const loadService = async () => {
    const found = await ServicePublic.get(serviceId);
    if (found) {
      setService(found);
      incrementServiceView(found.id);
    }
    setIsLoading(false);
  };

  const getImageUrl = () => {
    if (service?.image_url) return service.image_url;
    return defaultImages[service?.category_name] || defaultImages['تعليم وتدريب'];
  };

  const handleContactAction = async (field, action) => {
    if (!currentUser) {
      setContactError(language === 'en' ? 'Please sign in to view contact info' : 'يجب تسجيل الدخول لعرض بيانات التواصل');
      return;
    }
    setContactError('');
    setActingOn(field);
    try {
      let info = contactInfo;
      if (!info) {
        info = await getServiceContact(service.id);
        setContactInfo(info);
      }
      const value = info?.[field];
      if (!value) {
        setContactError(language === 'en' ? 'Contact info unavailable' : 'بيانات التواصل غير متاحة');
        return;
      }
      action(value);
    } catch (error) {
      setContactError(error.message);
    } finally {
      setActingOn(null);
    }
  };

  const isOwnService = currentUser?.email && currentUser.email === service?.created_by;
  const alreadyReported = currentUser?.email && (service?.reports || []).includes(currentUser.email);

  const handleReport = async () => {
    if (!currentUser?.email || alreadyReported || !service) return;
    try {
      await reportService(service.id, reportReason.trim());
      setService(prev => ({
        ...prev,
        reports: [...(prev.reports || []), currentUser.email],
        report_reasons: [...(prev.report_reasons || []), reportReason.trim() || (language === 'en' ? 'No reason' : 'بدون سبب')],
      }));
      setShowReportBox(false);
      setReportReason('');
      setReportSent(true);
    } catch (error) {
      console.error('Failed to report service:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>{language === 'en' ? 'Service not found.' : 'الخدمة غير موجودة.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir={dir}>
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('back')}
        </Button>

        {!isOwnService && currentUser && (
          reportSent || alreadyReported ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" />
              {language === 'en' ? 'Reported' : 'تم الإبلاغ'}
            </span>
          ) : showReportBox ? (
            <div className="flex items-center gap-2">
              <input
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder={language === 'en' ? 'Reason (optional)...' : 'السبب (اختياري)...'}
                className="text-xs border border-orange-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-400"
              />
              <button onClick={handleReport} className="text-xs font-bold text-orange-600 hover:underline">✓</button>
              <button onClick={() => { setShowReportBox(false); setReportReason(''); }} className="text-xs text-gray-400 hover:underline">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowReportBox(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              {language === 'en' ? 'Report' : 'إبلاغ عن الخدمة'}
            </button>
          )
        )}
      </div>

      {/* Service Header Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative">
          <img
            src={getImageUrl()}
            alt={service.name}
            className="w-full h-72 object-cover"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
              {(language === 'en' && categoriesMap[service.category_name]?.name_en) || service.category_name}
            </Badge>
            {service.subscription_plan === 'premium' && (
              <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                {t('premium')}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
          {service.created_by ? (
            <Link
              to={createPageUrl('UserProfilePage') + `?email=${encodeURIComponent(service.created_by)}`}
              className="inline-flex items-center gap-2 mb-4 group"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={sellerProfile?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                  {(service.provider_name || '?').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-blue-600 font-medium group-hover:underline">
                {t('by')} {service.provider_name}
              </p>
            </Link>
          ) : (
            <p className="text-blue-600 font-medium mb-4">
              {t('by')} {service.provider_name}
            </p>
          )}

          <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {service.city}, {service.country}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {service.view_count || 0} {t('views')}
            </span>
          </div>

          {service.description && (
            <p className="text-gray-700 leading-relaxed text-lg mb-8">{service.description}</p>
          )}

          {/* Contact Buttons */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">{t('contactMethods')}</h3>
            {contactError && (
              <p className="text-xs text-red-500 mb-2">{contactError}</p>
            )}
            <div className="flex flex-wrap gap-3">
              {service.has_phone && (
                <button
                  onClick={() => handleContactAction('phone', (value) => { window.location.href = 'tel:' + value; })}
                  disabled={actingOn === 'phone'}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-3 rounded-xl font-medium transition-colors disabled:opacity-60"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <Phone className="w-4 h-4" />
                  {actingOn === 'phone' ? '...' : t('call')}
                </button>
              )}
              {service.has_whatsapp && (
                <button
                  onClick={() => handleContactAction('whatsapp', (value) => { window.open('https://wa.me/' + toWhatsAppNumber(value), '_blank', 'noopener,noreferrer'); })}
                  disabled={actingOn === 'whatsapp'}
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-5 py-3 rounded-xl font-medium transition-colors disabled:opacity-60"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <MessageSquare className="w-4 h-4" />
                  {actingOn === 'whatsapp' ? '...' : t('whatsapp')}
                </button>
              )}
              {service.has_email && (
                <button
                  onClick={() => handleContactAction('email', (value) => { window.location.href = 'mailto:' + value; })}
                  disabled={actingOn === 'email'}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-5 py-3 rounded-xl font-medium transition-colors disabled:opacity-60"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <Mail className="w-4 h-4" />
                  {actingOn === 'email' ? '...' : t('email')}
                </button>
              )}
              {!service.has_phone && !service.has_whatsapp && !service.has_email && (
                <p className="text-gray-500 text-sm">{t('noContact')}</p>
              )}
            </div>
            {!currentUser && (service.has_phone || service.has_whatsapp || service.has_email) && (
              <p className="text-xs text-gray-400 mt-2">
                {language === 'en' ? 'Sign in to use contact buttons.' : 'سجل دخولك لاستخدام أزرار التواصل.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('reviews')}</h2>
        <ServiceReviews serviceId={service.id} serviceOwnerEmail={service.created_by} />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { backend } from '@/api/backendClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, User, Calendar, CheckCircle2, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ServiceReviews({ serviceId, serviceOwnerEmail }) {
  const { t, dir, language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', reviewer_name: '' });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadReviews();
    backend.auth.me()
      .then((user) => {
        setCurrentUser(user);
        if (user && user.full_name) {
          setNewReview(prev => ({ ...prev, reviewer_name: user.full_name }));
        }
      })
      .catch(() => {});
  }, [serviceId]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await backend.entities.Review.filter({ service_id: serviceId }, '-created_date');
      setReviews(data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(language === 'ar' ? 'هل تريد حذف تقييمك؟' : 'Delete your review?')) return;
    try {
      await backend.entities.Review.delete(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(language === 'ar' ? `تعذر حذف التقييم: ${error.message}` : `Could not delete review: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0) return;
    setIsSubmitting(true);
    try {
      await backend.entities.Review.create({
        ...newReview,
        service_id: serviceId,
        reviewer_email: currentUser?.email || '',
      });

      // إشعار لصاحب الخدمة (إلا لو كان هو نفسه اللي قيّم خدمته)
      if (serviceOwnerEmail && serviceOwnerEmail !== currentUser?.email) {
        try {
          await backend.entities.Notification.create({
            recipient_email: serviceOwnerEmail,
            type: 'review',
            title: language === 'ar' ? 'تقييم جديد' : 'New review',
            message: language === 'ar'
              ? `${newReview.reviewer_name || 'شخص'} أضاف تقييم ${newReview.rating}/5 على خدمتك`
              : `${newReview.reviewer_name || 'Someone'} left a ${newReview.rating}/5 review on your service`,
            related_id: String(serviceId),
            link: `/ServiceDetailPage?id=${serviceId}`,
          });
        } catch (notifyError) {
          console.error('Failed to create notification:', notifyError);
        }
      }

      setNewReview({ rating: 0, comment: '', reviewer_name: currentUser?.full_name || '' });
      await loadReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(language === 'ar' ? `تعذر إرسال التقييم: ${error.message}` : `Could not submit review: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOwnerReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      await backend.entities.Review.update(reviewId, { owner_reply: replyText.trim() });
      setReplyText('');
      setReplyingTo(null);
      await loadReviews();
    } catch (error) {
      console.error("Error replying to review:", error);
    }
  };

  const isOwner = currentUser?.email === serviceOwnerEmail;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6" dir={dir}>
      {/* هيدر التقييم الإجمالي المعزز */}
      {reviews.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-blue-100 shadow-xs">
          <div className="flex items-center gap-5">
            <div className="text-6xl font-black text-blue-700 tracking-tight">{avgRating}</div>
            <div>
              <div className="flex gap-0.5 mb-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-500">
                {language === 'ar' ? `بناءً على ${reviews.length} تقييم` : `Based on ${reviews.length} reviews`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة تقييم جديد */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          {language === 'ar' ? 'أضف تقييمك وتجربتك' : t('addReview')}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* نجوم التقييم التفاعلية الحركية */}
          <div className="flex gap-1.5 p-1 bg-gray-50/50 w-fit rounded-xl border border-gray-100">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer transition-all duration-150 ${star <= (hoveredStar || newReview.rating) ? 'fill-yellow-400 text-yellow-400 scale-105' : 'text-gray-200 hover:text-yellow-300'}`}
                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder={t('yourName')}
              value={newReview.reviewer_name}
              onChange={(e) => setNewReview(prev => ({ ...prev, reviewer_name: e.target.value }))}
              required
              className="rounded-xl border-gray-200 h-10 text-sm focus-visible:ring-blue-500"
            />
            <Textarea
              placeholder={language === 'ar' ? 'اكتب تفاصيل تجربتك هنا بكل أمانة ليفيد بقية الطلاب والعملاء...' : t('yourComment')}
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="rounded-xl border-gray-200 text-sm focus-visible:ring-blue-500 resize-none"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || newReview.rating === 0 || !newReview.reviewer_name.trim()} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs h-10 px-5 shadow-xs transition-all"
          >
            {isSubmitting ? '...' : (language === 'ar' ? 'نشر التقييم فوراً' : t('submitReview'))}
          </Button>
        </form>
      </div>

      {/* قائمة عرض التقييمات والمراجعات */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
            <p className="text-xs font-medium">{language === 'ar' ? 'لا توجد تقييمات لهذه الخدمة بعد. كن أول من يقيم!' : t('noReviews')}</p>
          </div>
        ) : reviews.map(review => (
          <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs space-y-3 transition-all hover:border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-gray-800 block leading-tight">{review.reviewer_name}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(review.created_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex gap-0.5 bg-amber-50/60 py-1 px-2 rounded-lg">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                {(currentUser?.email && (currentUser.email === review.reviewer_email || currentUser.email === serviceOwnerEmail)) && (
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title={language === 'ar' ? 'حذف التقييم' : 'Delete review'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {review.comment && (
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal bg-gray-50/30 p-3 rounded-xl border border-gray-50/80">
                {review.comment}
              </p>
            )}

            {/* رد صاحب الإعلان / الخدمة */}
            {review.owner_reply && (
              <div className="bg-blue-50/70 border border-blue-100/50 rounded-xl px-4 py-3 mt-2 ms-4 relative">
                <p className="text-[11px] font-bold text-blue-700 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'رد مزود الخدمة' : 'Provider Reply'}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">{review.owner_reply}</p>
              </div>
            )}

            {/* واجهة إضافة رد للمالك فقط إذا لم يرد بعد */}
            {isOwner && !review.owner_reply && (
              <div className="pt-1">
                {replyingTo === review.id ? (
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 ms-4">
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={2}
                      placeholder={language === 'ar' ? 'اكتب ردك الترحيبي أو التوضيحي...' : 'Write your reply...'}
                      className="text-xs sm:text-sm rounded-xl border-gray-200 resize-none flex-1"
                    />
                    <div className="flex sm:flex-col gap-1.5 shrink-0 justify-end">
                      <Button size="sm" onClick={() => handleOwnerReply(review.id)} disabled={!replyText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg h-8 px-3">
                        {language === 'ar' ? 'إرسال الرد' : 'Send'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }} className="text-gray-500 text-[11px] font-medium h-8 px-3 hover:bg-gray-100 rounded-lg">
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors ms-4 py-1 px-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg mt-1 w-fit"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {language === 'ar' ? 'إضافة رد على التقييم' : 'Reply to this review'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
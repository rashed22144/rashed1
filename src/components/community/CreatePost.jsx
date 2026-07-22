import React, { useState } from 'react';
import { Image, Send, X, Megaphone, Plus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/lib/LanguageContext';
import { backend } from '@/api/backendClient';

export default function CreatePost({ currentUser, onPostCreated }) {
    const { t, dir, language } = useLanguage();
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isAd, setIsAd] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const isAdAccount = currentUser?.account_type === 'ad';
    const maxImages = isAdAccount && isAd ? 6 : 4;

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    // ✨ دالة سحرية لضغط الصور وتحويلها إلى Webp قبل الرفع للحفاظ على السيرفر
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = window.Image ? new window.Image() : document.createElement('img');
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1080; // أقصى عرض (موحّد مع باقي الموقع: 1080px)
                    const MAX_HEIGHT = 1080;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // تحويل الصورة إلى صيغة webp خفيفة جداً وبجودة 80%
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                    type: "image/webp",
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file); // في حال فشل الضغط، نمرر الملف الأصلي كأمان لحسابك
                            }
                        },
                        "image/webp",
                        0.8
                    );
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (images.length >= maxImages) return;
        
        setUploading(true);
        try {
            // 1. ضغط الملف أولاً محلياً على جهاز المستخدم
            const compressedFile = await compressImage(file);
            
            // 2. رفع الملف المضغوط خفيف الحجم إلى السيرفر
            const { file_url } = await backend.integrations.Core.UploadFile({ file: compressedFile });
            setImages(prev => [...prev, file_url]);
        } catch (e) { 
            console.error(e); 
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) return;
        if (currentUser?.banned_until && new Date(currentUser.banned_until) > new Date()) return;
        setSubmitting(true);
        const postData = {
            content: content.trim(),
            author_name: currentUser.full_name,
            author_email: currentUser.email,
            author_avatar_url: currentUser.avatar_url || null,
            likes: [],
            loves: [],
            shares_count: 0,
            comments_count: 0,
            is_ad: isAdAccount && isAd,
        };
        if (isAdAccount && isAd && linkUrl.trim()) {
            postData.link_url = linkUrl.trim();
        }
        if (images.length === 1) {
            postData.image_url = images[0];
        } else if (images.length > 1) {
            postData.images = images;
        }
        try {
            const post = await backend.entities.Post.create(postData);
            setContent('');
            setImages([]);
            setIsAd(false);
            setLinkUrl('');
            onPostCreated(post);
        } catch (e) { 
            console.error(e); 
        } finally {
            setSubmitting(false);
        }
    };

    if (!currentUser) return null;

    const isBanned = currentUser.banned_until && new Date(currentUser.banned_until) > new Date();

    if (isBanned) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center" dir={dir}>
                <p className="text-sm font-bold text-red-700">
                    {language === 'ar' ? '🚫 حسابك محظور مؤقتاً من النشر' : '🚫 Your account is temporarily banned from posting'}
                </p>
                <p className="text-xs text-red-500 mt-1">
                    {language === 'ar'
                        ? `يمكنك التصفح فقط حتى ${new Date(currentUser.banned_until).toLocaleDateString('ar')}`
                        : `You can browse only until ${new Date(currentUser.banned_until).toLocaleDateString('en-US')}`}
                </p>
            </div>
        );
    }

    const canSubmit = content.trim() || images.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 transition-all hover:shadow-md" dir={dir}>
            <div className="flex gap-3">
                <Avatar className="h-11 w-11 flex-shrink-0 shadow-xs">
                    <AvatarFallback className={`bg-gradient-to-br ${isAdAccount ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-purple-600'} text-white font-bold text-sm`}>
                        {getInitials(currentUser.full_name)}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={t('whatsOnMind')}
                        rows={3}
                        className={`w-full resize-none border-none outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent ${
                            dir === 'rtl' ? 'text-right' : 'text-left'
                        }`}
                    />

                    {isAdAccount && (
                        <div className="flex mt-1">
                            <button
                                onClick={() => setIsAd(!isAd)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                                    isAd ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                }`}
                            >
                                <Megaphone className="w-3.5 h-3.5" />
                                <span>{language === 'ar' ? 'نشر كإعلان' : 'Post as Ad'}</span>
                            </button>
                        </div>
                    )}

                    {isAdAccount && isAd && images.length > 0 && (
                        <div className="mt-2">
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder={language === 'ar' ? 'رابط الإعلان (يفتح عند الضغط على الصورة)...' : 'Ad link (opens when the image is clicked)...'}
                                className="w-full text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
                                dir="ltr"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                {language === 'ar'
                                    ? 'الرابط ما يظهر كنص أبداً — بس الصورة تصير قابلة للضغط وتوديك له'
                                    : "The link never shows as text — only the image becomes clickable and opens it"}
                            </p>
                        </div>
                    )}

                    {images.length > 0 && (
                        <div className={`grid gap-2 mt-3 animate-in fade-in zoom-in-95 duration-200 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {images.map((img, i) => (
                                <div key={i} className="relative rounded-xl overflow-hidden border border-gray-100 group aspect-video bg-gray-50">
                                    <img src={img} alt={`upload-${i}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors shadow-xs"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            
                            {images.length < maxImages && (
                                <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                                    <Plus className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            )}
                        </div>
                    )}

                    {images.length > 0 && (
                        <p className={`text-[11px] text-gray-400 mt-1.5 font-medium ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            {images.length}/{maxImages} {language === 'ar' ? 'صور' : 'photos'}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <label className={`flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 cursor-pointer transition-colors ${uploading || images.length >= maxImages ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <Image className="w-5 h-5" />
                        )}
                        <span className="text-xs font-bold">
                            {uploading 
                                ? (language === 'ar' ? 'جاري الرفع والضغط...' : 'Compressing & Uploading...') 
                                : images.length === 0 ? t('addPhoto') : t('addMorePhotos')
                            }
                        </span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={images.length >= maxImages || uploading} />
                </label>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || !canSubmit || uploading}
                    className={`flex items-center gap-2 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none ${
                        isAdAccount && isAd 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-md hover:shadow-purple-100' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-md hover:shadow-blue-100'
                    }`}
                >
                    {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    <span>
                        {submitting 
                            ? (language === 'ar' ? 'جاري النشر...' : 'Publishing...') 
                            : t('publish')
                        }
                    </span>
                </button>
            </div>
        </div>
    );
}
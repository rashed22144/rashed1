import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PostImageGallery({ images = [], isAd = false, linkUrl = null }) {
    const [lightboxIndex, setLightboxIndex] = useState(null);

    if (!images || images.length === 0) return null;

    const handleImageClick = (i) => {
        if (linkUrl) {
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
        } else {
            setLightboxIndex(i);
        }
    };

    const openLightbox = (i) => setLightboxIndex(i);
    const closeLightbox = () => setLightboxIndex(null);
    
    const nextImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // منطق توزيع الصور (Grid Layout)
    const getGridClass = () => {
        if (images.length === 1) return 'grid-cols-1';
        if (images.length === 2) return 'grid-cols-2';
        return 'grid-cols-2'; // للمنشورات بـ 3 صور أو أكثر
    };

    return (
        <>
            <div className={`grid gap-1 ${getGridClass()} ${isAd ? 'p-1' : ''}`}>
                {images.map((img, i) => {
                    // تحديد التخطيط الذكي للصور
                    const isThreeAndFirst = images.length === 3 && i === 0;
                    const heightClass = images.length === 1 ? 'max-h-[500px]' : isThreeAndFirst ? 'h-64' : 'h-32 sm:h-48';

                    return (
                        <div
                            key={i}
                            className={`relative overflow-hidden cursor-pointer group ${isThreeAndFirst ? 'row-span-2' : ''}`}
                            onClick={() => handleImageClick(i)}
                        >
                            {/* تم إضافة "تحسين الأداء" عبر loading="lazy" لتقليل استهلاك البيانات */}
                            <img
                                src={img}
                                alt={`post-${i}`}
                                loading="lazy" 
                                className={`w-full ${heightClass} object-cover transition-transform duration-500 group-hover:scale-105`}
                                style={{ imageRendering: 'high-quality' }} 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            {linkUrl && (
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                    🔗
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* وضع ملء الشاشة (Lightbox) */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                    <button onClick={closeLightbox} className="absolute top-5 right-5 text-white p-2 hover:bg-white/10 rounded-full z-50">
                        <X className="w-8 h-8" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button onClick={prevImage} className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-full z-50">
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button onClick={nextImage} className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-full z-50">
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </>
                    )}

                    <img
                        src={images[lightboxIndex]}
                        className="max-w-[95vw] max-h-[90vh] object-contain"
                        onClick={e => e.stopPropagation()}
                        alt="full"
                    />
                    
                    <div className="absolute bottom-5 text-white text-sm bg-black/50 px-4 py-1 rounded-full">
                        {lightboxIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}
import React, { useState } from 'react';
import { backend } from '@/api/backendClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ImageUpload({ onImageUploaded, currentImageUrl }) {
    const { language } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
    const [isDragActive, setIsDragActive] = useState(false);

    // دالة الضغط المتقدمة: تحافظ على جودة الـ Full HD وتقلل مساحة الملف الذكية
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                // الحد الأقصى للأبعاد 1080px (أي صورة أعلى تتصغر تلقائياً لهذا المقاس)
                const MAX = 1080; 
                let { width, height } = img;
                
                if (width > MAX || height > MAX) {
                    if (width > height) {
                        height = Math.round((height * MAX) / width);
                        width = MAX;
                    } else {
                        width = Math.round((width * MAX) / height);
                        height = MAX;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // تفعيل خوارزميات التنعيم العالية في المتصفح لضمان عدم بكسلة الصورة
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, width, height);
                URL.revokeObjectURL(url);
                
                // رفع الجودة إلى 0.90 للحصول على ضغط ممتاز بدون خسارة تفاصيل الصورة نهائياً
                canvas.toBlob(resolve, 'image/jpeg', 0.90);
            };
            img.src = url;
        });
    };

    const processAndUploadFile = async (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert(language === 'en' ? 'Please choose a valid image file only (PNG, JPG, GIF)' : 'يرجى اختيار ملف صورة صالحة فقط (PNG, JPG, GIF)');
            return;
        }

        setUploading(true);
        try {
            const compressed = await compressImage(file);
            // تحويل الـ Blob الملوّن والجديد إلى ملف جاهز للرفع بامتداد مناسب للسيرفر
            const compressedFile = new File([compressed], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
            
            const result = await backend.integrations.Core.UploadFile({ file: compressedFile });
            setImageUrl(result.file_url);
            if (onImageUploaded) onImageUploaded(result.file_url);
        } catch (error) {
            console.error('خطأ في معالجة أو رفع الصورة:', error);
            alert(language === 'en' ? 'An error occurred while processing the image, please try again' : 'حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى');
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        processAndUploadFile(file);
    };

    // دعم خاصية السحب والإفلات (Drag and Drop) لرفع أسرع وأسهل
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = () => {
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        const file = e.dataTransfer.files[0];
        processAndUploadFile(file);
    };

    const removeImage = () => {
        setImageUrl('');
        if (onImageUploaded) onImageUploaded('');
    };

    return (
        <div className="space-y-4" dir="rtl">
            {imageUrl ? (
                <Card className="relative overflow-hidden group rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <img 
                        src={imageUrl} 
                        alt={language === 'en' ? 'Uploaded image preview' : 'معاينة الصورة المرفوعة'} 
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* طبقة تظليل جمالية تظهر عند تمرير الماوس فوق الصورة */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-3 right-3 rounded-full w-8 h-8 bg-red-600/90 hover:bg-red-600 shadow-md backdrop-blur-sm transition-transform duration-200 active:scale-95"
                        onClick={removeImage}
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </Card>
            ) : (
                <Card 
                    className={`border-2 border-dashed p-8 rounded-2xl text-center transition-all duration-300 relative ${
                        isDragActive 
                            ? 'border-blue-500 bg-blue-50/40 scale-[0.99]' 
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10 animate-fade-in">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-xs font-semibold text-gray-600 animate-pulse">{language === 'en' ? 'Processing & uploading in high quality...' : 'جاري معالجة ورفع الصورة بدقة عالية...'}</p>
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-center">
                        <div className={`p-3 rounded-full mb-4 transition-colors duration-300 ${
                            isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                        }`}>
                            <ImageIcon className="h-8 w-8" />
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                {language === 'en' ? 'Drag and drop the image here, or' : 'اسحب الصورة وأفلتها هنا، أو'}{' '}
                                <label htmlFor="image-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold underline underline-offset-4">
                                    {language === 'en' ? 'Browse files' : 'تصفح الملفات'}
                                </label>
                            </p>
                            
                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            
                            <p className="text-xs text-gray-400 font-normal">
                                {language === 'en' ? 'Supports: PNG, JPG, GIF up to 10MB' : 'يدعم الصيغ التالية: PNG, JPG, GIF حتى 10 ميجابايت'}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
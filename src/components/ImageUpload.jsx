import React, { useState } from 'react';
import { backend } from '@/api/backendClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { validateImageFile, compressImageFile } from '@/lib/imageUpload';

export default function ImageUpload({ onImageUploaded, currentImageUrl }) {
    const { t, dir } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
    const [isDragActive, setIsDragActive] = useState(false);

    const processAndUploadFile = async (file) => {
        if (!file) return;

        const errorKey = validateImageFile(file);
        if (errorKey) {
            alert(t(errorKey));
            return;
        }

        setUploading(true);
        try {
            const compressedFile = await compressImageFile(file);
            const result = await backend.integrations.Core.UploadFile({ file: compressedFile });
            setImageUrl(result.file_url);
            if (onImageUploaded) onImageUploaded(result.file_url);
        } catch (error) {
            console.error('Image processing/upload failed:', error);
            alert(t('uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        processAndUploadFile(file);
    };

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
        <div className="space-y-4" dir={dir}>
            {imageUrl ? (
                <Card className="relative overflow-hidden group rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <img
                        src={imageUrl}
                        alt={t('uploadedImageAlt')}
                        loading="lazy"
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <Button
                        variant="destructive"
                        size="icon"
                        aria-label={t('deleteService')}
                        className="absolute top-3 end-3 rounded-full w-8 h-8 bg-red-600/90 hover:bg-red-600 shadow-md backdrop-blur-sm transition-transform duration-200 active:scale-95"
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
                            <p className="text-xs font-semibold text-gray-600 animate-pulse">{t('uploadProcessing')}</p>
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
                                {t('dragDropImage')}{' '}
                                <label htmlFor="image-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold underline underline-offset-4">
                                    {t('browseFiles')}
                                </label>
                            </p>

                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/gif,image/webp"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={uploading}
                            />

                            <p className="text-xs text-gray-400 font-normal">
                                {t('uploadSupports')}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

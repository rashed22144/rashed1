import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'; 

// السطر 20 (أصلحنا الكلمة المكسورة من @/ts/ui/button)
import { Button } from '@/components/ui/button'; 

// السطر 21 (أصلحنا الكلمة المكسورة)
import { Service } from '@/entities/Service';
import { useLanguage } from '@/lib/LanguageContext';

export default function ServiceActionsMenu({ service, onServiceDeleted, isOwner = false, onEditClick, onViewClick }) {
    const { language, dir } = useLanguage();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleDeleteService = async () => {
        setIsDeleting(true);
        try {
            await Service.delete(service.id);
            if (onServiceDeleted) onServiceDeleted(service.id);
            setIsAlertOpen(false);
        } catch (error) {
            console.error('خطأ في حذف الخدمة:', error);
            alert(language === 'en' ? `Failed to delete service: ${error.message}` : `حدث خطأ في حذف الخدمة: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // حظر برمجى لحماية الخدمة: إذا لم يكن صاحب الحساب فلا يظهر الزر إطلاقاً
    if (!isOwner) {
        return null;
    }

    return (
        <div dir={dir}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 bg-white/90 hover:bg-white shadow-sm rounded-xl border border-gray-100 transition-all duration-200 active:scale-90 hover:shadow-md"
                    >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                    </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="start" className="rounded-xl min-w-[150px] p-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    {/* خيار المعاينة السريعة */}
                    <DropdownMenuItem 
                        onClick={() => onViewClick && onViewClick(service.id)}
                        className="cursor-pointer gap-2 text-sm font-medium rounded-lg p-2 transition-colors hover:bg-gray-50 text-gray-700"
                    >
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span>{language === 'en' ? 'Preview Service' : 'معاينة الخدمة'}</span>
                    </DropdownMenuItem>
                    
                    {/* خيار التعديل */}
                    <DropdownMenuItem 
                        onClick={() => onEditClick && onEditClick(service)}
                        className="cursor-pointer gap-2 text-sm font-medium rounded-lg p-2 transition-colors hover:bg-gray-50 text-gray-700"
                    >
                        <Edit className="h-4 w-4 text-gray-400" />
                        <span>{language === 'en' ? 'Edit Service' : 'تعديل الخدمة'}</span>
                    </DropdownMenuItem>
                    
                    {/* خط فاصل صغير للتنظيم البصري */}
                    <div className="my-1 border-t border-gray-100" />

                    {/* خيار الحذف المرتبط بالـ AlertDialog */}
                    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                                className="cursor-pointer gap-2 text-sm font-medium rounded-lg p-2 text-red-600 focus:text-red-700 focus:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>{language === 'en' ? 'Delete Service' : 'حذف الخدمة'}</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        
                        <AlertDialogContent className="rounded-2xl max-w-md border border-gray-100 p-6 shadow-xl animate-in zoom-in-95">
                            <AlertDialogHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                                <AlertDialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                    {language === 'en' ? 'Confirm Final Deletion' : 'تأكيد الحذف النهائي'}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-gray-500 mt-2 leading-relaxed">
                                    {language === 'en'
                                        ? `Are you sure you want to permanently delete "${service?.name || 'this service'}"? This action cannot be undone.`
                                        : `هل أنت متأكد تماماً من رغبتك في حذف خدمة "${service?.name || 'هذه الخدمة'}"؟ يرجى العلم أن هذا الإجراء سيقوم بإزالة الخدمة وتفاصيلها من المنصة بشكل نهائي ولا يمكن استعادتها.`}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            <AlertDialogFooter className="flex flex-row-reverse gap-2 mt-5 sm:space-x-0">
                                <AlertDialogCancel 
                                    disabled={isDeleting}
                                    className="rounded-xl text-sm font-medium border-gray-200 hover:bg-gray-50 px-4 h-10 transition-colors"
                                >
                                    {language === 'en' ? 'Cancel' : 'إلغاء الأمر'}
                                </AlertDialogCancel>
                                
                                <AlertDialogAction 
                                    onClick={handleDeleteService}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold px-4 h-10 transition-all duration-200 flex items-center justify-center gap-1.5"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{language === 'en' ? 'Deleting...' : 'جاري الحذف...'}</span>
                                        </>
                                    ) : (
                                        <span>{language === 'en' ? 'Yes, delete now' : 'نعم، احذف الآن'}</span>
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
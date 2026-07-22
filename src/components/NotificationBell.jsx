import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { backend } from '@/api/backendClient';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function NotificationBell() {
    const { currentUser } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

    const loadNotifications = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await backend.entities.Notification.filter(
                { recipient_email: currentUser.email },
                '-created_date',
                30
            );
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        loadNotifications();
        // نحدّث كل 30 ثانية عشان يوصل إشعار جديد بدون ما يحتاج المستخدم يعمل رفرش
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    if (!currentUser) return null;

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const handleOpenNotification = async (notification) => {
        if (!notification.is_read) {
            try {
                await backend.entities.Notification.update(notification.id, { is_read: true });
                setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }
        if (notification.link) navigate(notification.link);
    };

    const markAllRead = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const unread = notifications.filter((n) => !n.is_read);
        if (unread.length === 0) return;
        try {
            await Promise.all(unread.map((n) => backend.entities.Notification.update(n.id, { is_read: true })));
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const timeAgo = (date) => {
        const diffMs = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return language === 'ar' ? 'الآن' : 'now';
        if (mins < 60) return language === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                    <span className="font-bold text-sm text-gray-800">
                        {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                    </span>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-600 font-medium hover:underline">
                            {language === 'ar' ? 'تعليم الكل كمقروء' : 'Mark all read'}
                        </button>
                    )}
                </div>
                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                        {language === 'ar' ? 'لا توجد إشعارات بعد' : 'No notifications yet'}
                    </div>
                ) : (
                    notifications.map((n) => (
                        <DropdownMenuItem
                            key={n.id}
                            onClick={() => handleOpenNotification(n)}
                            className={`flex-col items-start gap-0.5 px-3 py-2.5 border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                            <div className="flex items-center gap-1.5 w-full">
                                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                <span className="font-semibold text-xs text-gray-800 truncate">{n.title}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-gray-400">{timeAgo(n.created_date)}</span>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

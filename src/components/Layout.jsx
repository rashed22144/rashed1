import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Plus, Settings, Languages, UserCircle, LogOut, ShieldCheck, LogIn } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import SearchBar from '@/components/SearchBar';
import LocationSelector from '@/components/LocationSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';

export default function Layout({ children }) {
    const { t, dir, language } = useLanguage();
    const { currentUser, isLoading, loginWithGoogle, logout } = useAuth();

    const navItems = [
        { to: createPageUrl('HomePage'), icon: Home, label: t('home') },
        { to: createPageUrl('CommunityPage'), icon: Users, label: t('community') },
        { to: createPageUrl('AddServicePage'), icon: Plus, label: t('addService') },
    ];

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.trim().split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
                    <Link to={createPageUrl('HomePage')} className="font-black text-lg text-blue-600 shrink-0">
                        {language === 'ar' ? 'خدماتي' : 'MyServices'}
                    </Link>

                    <div className="flex-1 min-w-[180px] order-3 md:order-2">
                        <SearchBar placeholder={language === 'ar' ? 'ابحث عن الخدمات...' : 'Search services...'} />
                    </div>

                    <nav className="flex items-center gap-1 order-2 md:order-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{item.label}</span>
                            </Link>
                        ))}
                        <LocationSelector />
                        <Link
                            to={createPageUrl('LanguageSettingsPage')}
                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                            title={language === 'ar' ? 'اللغة' : 'Language'}
                        >
                            <Languages className="w-4 h-4" />
                        </Link>

                        {!isLoading && currentUser && <NotificationBell />}

                        {/* حالة تسجيل الدخول */}
                        {isLoading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                        ) : currentUser ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={currentUser.avatar_url} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                                                {getInitials(currentUser.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Link to={createPageUrl('MyProfilePage')} className="flex items-center gap-2 w-full">
                                            <UserCircle className="w-4 h-4" />
                                            {language === 'ar' ? 'حسابي' : 'My Profile'}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Link to={createPageUrl('SettingsPage')} className="flex items-center gap-2 w-full">
                                            <Settings className="w-4 h-4" />
                                            {t('settings')}
                                        </Link>
                                    </DropdownMenuItem>
                                    {currentUser.account_type === 'admin' && (
                                        <DropdownMenuItem>
                                            <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-2 w-full text-red-600">
                                                <ShieldCheck className="w-4 h-4" />
                                                {language === 'ar' ? 'لوحة المدير' : 'Admin Dashboard'}
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={logout} className="text-red-600">
                                        <LogOut className="w-4 h-4" />
                                        {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button onClick={loginWithGoogle} size="sm" className="rounded-full flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">{language === 'ar' ? 'دخول بحساب Google' : 'Sign in with Google'}</span>
                            </Button>
                        )}
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">{children}</main>
        </div>
    );
}

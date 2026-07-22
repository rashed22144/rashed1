import React, { useState, useEffect, useCallback } from 'react';
import { backend } from '@/api/backendClient';
import { useLanguage } from '@/lib/LanguageContext';
import { Shield, AlertTriangle, Flag, Ban, Trash2, Crown, Megaphone, UserX, Eye, EyeOff, Search, Settings as SettingsIcon, Users, FileText, Briefcase, Star, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
    const { t, language, dir } = useLanguage();
    const [currentUser, setCurrentUser] = useState(null);
    const [reportedPosts, setReportedPosts] = useState([]);
    const [reportedComments, setReportedComments] = useState([]);
    const [reportedServices, setReportedServices] = useState([]);
    const [allComments, setAllComments] = useState([]);
    const [vipUsers, setVipUsers] = useState([]);
    const [adUsers, setAdUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');
    const [isLoading, setIsLoading] = useState(true);
    const [vipEmail, setVipEmail] = useState('');
    const [adEmail, setAdEmail] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [userSearch, setUserSearch] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await backend.auth.me();
            setCurrentUser(user);
            if (user.account_type !== 'admin') { setIsLoading(false); return; }

            const [postsResult, usersResult, servicesResult, reviewsResult, commentsResult] = await Promise.allSettled([
                backend.entities.Post.list('-created_date', 200),
                backend.entities.User.list(),
                backend.entities.Service.list('-created_date', 200),
                backend.entities.Review.list('-created_date', 200),
                backend.entities.PostComment.list('-created_date', 500),
            ]);

            const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
            const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
            const services = servicesResult.status === 'fulfilled' ? servicesResult.value : [];
            const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [];
            const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

            if (postsResult.status === 'rejected') console.error('AdminDashboard: فشل جلب المنشورات', postsResult.reason);
            if (usersResult.status === 'rejected') console.error('AdminDashboard: فشل جلب المستخدمين', usersResult.reason);
            if (servicesResult.status === 'rejected') console.error('AdminDashboard: فشل جلب الخدمات', servicesResult.reason);
            if (reviewsResult.status === 'rejected') console.error('AdminDashboard: فشل جلب التقييمات', reviewsResult.reason);
            if (commentsResult.status === 'rejected') console.error('AdminDashboard: فشل جلب التعليقات', commentsResult.reason);

            const withReports = posts.filter(p => p.reports && p.reports.length > 0).sort((a, b) => b.reports.length - a.reports.length);
            const commentsWithReports = comments.filter(c => c.reports && c.reports.length > 0).sort((a, b) => b.reports.length - a.reports.length);
            const servicesWithReports = services.filter(s => s.reports && s.reports.length > 0).sort((a, b) => b.reports.length - a.reports.length);
            setReportedPosts(withReports);
            setReportedComments(commentsWithReports);
            setReportedServices(servicesWithReports);
            setAllComments(comments);
            setAllUsers(users);
            setAllPosts(posts);
            setAllServices(services);
            setAllReviews(reviews);
            setVipUsers(users.filter(u => u.account_type === 'vip'));
            setAdUsers(users.filter(u => u.account_type === 'ad'));
        } catch (e) { console.error(e); }
        setIsLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const showMsg = (msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), 3000); };

    const hiddenPosts = reportedPosts.filter(p => p.hidden);
    const visiblePosts = reportedPosts.filter(p => !p.hidden);

    const handleHidePost = async (post) => {
        await backend.entities.Post.update(post.id, { hidden: true });
        showMsg(language === 'ar' ? 'تم إخفاء المنشور' : 'Post hidden');
        loadData();
    };

    const handleUnhidePost = async (post) => {
        await backend.entities.Post.update(post.id, { hidden: false, reports: [] });
        showMsg(language === 'ar' ? 'تم إظهار المنشور ومسح الإبلاغات' : 'Post restored');
        loadData();
    };

    const handleDeletePost = async (post) => {
        await backend.entities.Post.delete(post.id);
        showMsg(language === 'ar' ? 'تم حذف المنشور' : 'Post deleted');
        loadData();
    };

    const handleHideComment = async (comment) => {
        await backend.entities.PostComment.update(comment.id, { hidden: true });
        showMsg(language === 'ar' ? 'تم إخفاء التعليق' : 'Comment hidden');
        loadData();
    };

    const handleUnhideComment = async (comment) => {
        await backend.entities.PostComment.update(comment.id, { hidden: false, reports: [] });
        showMsg(language === 'ar' ? 'تم إظهار التعليق ومسح الإبلاغات' : 'Comment restored');
        loadData();
    };

    const handleDeleteComment = async (comment) => {
        await backend.entities.PostComment.delete(comment.id);
        showMsg(language === 'ar' ? 'تم حذف التعليق' : 'Comment deleted');
        loadData();
    };

    const handleDismissServiceReport = async (service) => {
        await backend.entities.Service.update(service.id, { reports: [], report_reasons: [] });
        showMsg(language === 'ar' ? 'تم تجاهل الإبلاغ' : 'Report dismissed');
        loadData();
    };

    const handleDeleteService = async (service) => {
        await backend.entities.Service.delete(service.id);
        showMsg(language === 'ar' ? 'تم حذف الخدمة' : 'Service deleted');
        loadData();
    };

    const handleWarnUser = async (userEmail) => {
        const user = allUsers.find(u => u.email === userEmail);
        if (!user) return;
        const newWarnings = (user.warnings || 0) + 1;
        const updates = { warnings: newWarnings };
        if (newWarnings >= 3) {
            const banDate = new Date();
            banDate.setDate(banDate.getDate() + 5);
            updates.banned_until = banDate.toISOString();
        }
        await backend.entities.User.update(user.id, updates);
        showMsg(newWarnings >= 3
            ? (language === 'ar' ? `تم حظر ${userEmail} لمدة 5 أيام` : `${userEmail} banned for 5 days`)
            : (language === 'ar' ? `تحذير ${newWarnings}/3 لـ ${userEmail}` : `Warning ${newWarnings}/3 for ${userEmail}`));
        loadData();
    };

    const handleUnban = async (user) => {
        await backend.entities.User.update(user.id, { warnings: 0, banned_until: null });
        showMsg(language === 'ar' ? `تم رفع الحظر عن ${user.email}` : `${user.email} unbanned`);
        loadData();
    };

    const handleDeleteUser = async (user) => {
        await backend.entities.User.delete(user.id);
        showMsg(language === 'ar' ? `تم حذف ${user.email}` : `${user.email} deleted`);
        loadData();
    };

    const handleSetVip = async () => {
        if (!vipEmail.trim()) return;
        const user = allUsers.find(u => u.email === vipEmail.trim());
        if (!user) { showMsg(language === 'ar' ? 'المستخدم غير موجود' : 'User not found'); return; }
        await backend.entities.User.update(user.id, { account_type: 'vip' });
        showMsg(language === 'ar' ? `تم ترقية ${vipEmail} إلى VIP` : `${vipEmail} upgraded to VIP`);
        setVipEmail('');
        loadData();
    };

    const handleSetAd = async () => {
        if (!adEmail.trim()) return;
        const user = allUsers.find(u => u.email === adEmail.trim());
        if (!user) { showMsg(language === 'ar' ? 'المستخدم غير موجود' : 'User not found'); return; }
        await backend.entities.User.update(user.id, { account_type: 'ad' });
        showMsg(language === 'ar' ? `تم جعل ${adEmail} حساب إعلاني` : `${adEmail} set as Ad account`);
        setAdEmail('');
        loadData();
    };

    const handleRemoveRole = async (user) => {
        await backend.entities.User.update(user.id, { account_type: 'user' });
        showMsg(language === 'ar' ? `تم إزالة الصلاحية من ${user.email}` : `Removed role from ${user.email}`);
        loadData();
    };

    const handleBulkDeleteReported = async () => {
        const toDelete = reportedPosts.filter(p => p.hidden);
        for (const post of toDelete) {
            await backend.entities.Post.delete(post.id);
        }
        showMsg(language === 'ar' ? `تم حذف ${toDelete.length} منشور مخفي` : `Deleted ${toDelete.length} hidden posts`);
        loadData();
    };

    const filteredUsers = allUsers.filter(u => {
        if (u.account_type === 'admin') return false;
        if (!userSearch.trim()) return true;
        const q = userSearch.toLowerCase();
        return (u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!currentUser || currentUser.account_type !== 'admin') {
        return (
            <div className="text-center py-20" dir={dir}>
                <Shield className="mx-auto h-16 w-16 text-red-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
                </h1>
                <p className="text-gray-500">
                    {language === 'ar' ? 'هذه الصفحة مخصصة للمدير فقط' : 'Admin access only'}
                </p>
            </div>
        );
    }

    const tabs = [
        { key: 'reports', label: language === 'ar' ? 'الإبلاغات' : 'Reports', icon: Flag },
        { key: 'users', label: language === 'ar' ? 'المستخدمين' : 'Users', icon: Ban },
        { key: 'manage', label: language === 'ar' ? 'إدارة الصلاحيات' : 'Roles', icon: Crown },
        { key: 'settings', label: language === 'ar' ? 'إعدادات متقدمة' : 'Advanced', icon: SettingsIcon },
    ];

    const bannedCount = allUsers.filter(u => u.banned_until && new Date(u.banned_until) > new Date()).length;
    const warnedCount = allUsers.filter(u => (u.warnings || 0) > 0 && !u.banned_until).length;
    const recentPosts = allPosts.filter(p => {
        const days = (Date.now() - new Date(p.created_date)) / 86400000;
        return days <= 7;
    }).length;

    const stats = [
        { label: t('totalUsers'), value: allUsers.length, icon: Users, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600' },
        { label: t('totalPosts'), value: allPosts.length, icon: FileText, color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50', text: 'text-purple-600' },
        { label: t('totalServices'), value: allServices.length, icon: Briefcase, color: 'from-green-500 to-teal-600', bg: 'bg-green-50', text: 'text-green-600' },
        { label: t('totalReviews'), value: allReviews.length, icon: Star, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-600' },
    ];

    return (
        <div className="max-w-5xl mx-auto" dir={dir}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
                    </h1>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
            </div>

            {statusMsg && (
                <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                    {statusMsg}
                </div>
            )}

            <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6 gap-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                            <Badge className="bg-red-100 text-red-700">{language === 'ar' ? 'منشورات' : 'Posts'}: {reportedPosts.length}</Badge>
                            <Badge className="bg-blue-100 text-blue-700">{language === 'ar' ? 'تعليقات' : 'Comments'}: {reportedComments.length}</Badge>
                            <Badge className="bg-purple-100 text-purple-700">{language === 'ar' ? 'خدمات' : 'Services'}: {reportedServices.length}</Badge>
                            <Badge className="bg-gray-100 text-gray-700">{language === 'ar' ? 'مخفي' : 'Hidden'}: {hiddenPosts.length}</Badge>
                        </div>
                        {hiddenPosts.length > 0 && (
                            <Button size="sm" variant="outline" onClick={handleBulkDeleteReported} className="text-red-600 border-red-300 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                {language === 'ar' ? `حذف ${hiddenPosts.length} منشور مخفي` : `Delete ${hiddenPosts.length} hidden`}
                            </Button>
                        )}
                    </div>

                    {reportedPosts.length === 0 && reportedComments.length === 0 && reportedServices.length === 0 ? (
                        <p className="text-center py-10 text-gray-400">{language === 'ar' ? 'لا توجد إبلاغات' : 'No reports'}</p>
                    ) : (
                        <>
                            {/* ===== المنشورات المُبلّغ عنها ===== */}
                            {reportedPosts.map(post => {
                                const isHidden = post.hidden;
                                return (
                                    <div key={`post-${post.id}`} className={`bg-white rounded-2xl border p-5 ${isHidden ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className="bg-red-50 text-red-600 text-[10px]">{language === 'ar' ? 'منشور' : 'Post'}</Badge>
                                                    <span className="font-bold text-gray-800 truncate">{post.author_name}</span>
                                                    <span className="text-xs text-gray-400">{post.author_email}</span>
                                                    {isHidden && <Badge className="bg-red-100 text-red-600 text-xs">{language === 'ar' ? 'مخفي' : 'Hidden'}</Badge>}
                                                </div>
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{post.content}</p>
                                                {(post.images?.length > 0 || post.image_url) && (
                                                    <img src={post.images?.length > 0 ? post.images[0] : post.image_url} alt="" className="mt-2 max-h-56 rounded-xl border border-gray-100 object-cover" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-bold flex-shrink-0">
                                                <Flag className="w-3 h-3" />
                                                {post.reports.length}
                                            </div>
                                        </div>

                                        {post.report_reasons?.length > 0 && (
                                            <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                                <p className="text-xs font-semibold text-orange-700 mb-1">{language === 'ar' ? 'أسباب الإبلاغ:' : 'Report reasons:'}</p>
                                                {post.report_reasons.map((reason, i) => <p key={i} className="text-xs text-orange-600">• {reason}</p>)}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {!isHidden ? (
                                                <Button size="sm" variant="outline" onClick={() => handleHidePost(post)} className="text-orange-600 border-orange-300 hover:bg-orange-50">
                                                    <EyeOff className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'إخفاء' : 'Hide'}
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleUnhidePost(post)} className="text-green-600 border-green-300 hover:bg-green-50">
                                                    <Eye className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'إظهار' : 'Restore'}
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" onClick={() => handleDeletePost(post)} className="text-red-600 border-red-300 hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'حذف المنشور' : 'Delete Post'}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleWarnUser(post.author_email)} className="text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'تحذير' : 'Warn'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ===== التعليقات المُبلّغ عنها ===== */}
                            {reportedComments.map(comment => {
                                const isHidden = comment.hidden;
                                const parentPost = allPosts.find(p => String(p.id) === String(comment.post_id));
                                return (
                                    <div key={`comment-${comment.id}`} className={`bg-white rounded-2xl border p-5 ${isHidden ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className="bg-blue-50 text-blue-600 text-[10px]">{language === 'ar' ? 'تعليق' : 'Comment'}</Badge>
                                                    <span className="font-bold text-gray-800 truncate">{comment.author_name}</span>
                                                    <span className="text-xs text-gray-400">{comment.author_email}</span>
                                                    {isHidden && <Badge className="bg-red-100 text-red-600 text-xs">{language === 'ar' ? 'مخفي' : 'Hidden'}</Badge>}
                                                </div>

                                                {parentPost ? (
                                                    <div className="mb-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
                                                            {language === 'ar' ? `على منشور ${parentPost.author_name || ''}` : `On ${parentPost.author_name || ''}'s post`}
                                                        </p>
                                                        <p className="text-xs text-gray-500 line-clamp-2 italic">{parentPost.content}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-amber-600 mb-2">{language === 'ar' ? '⚠️ المنشور الأصلي محذوف أو غير متاح' : '⚠️ Original post unavailable'}</p>
                                                )}

                                                <p className="text-gray-700 text-sm whitespace-pre-wrap font-medium bg-blue-50/30 p-2 rounded-lg">{comment.content}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-bold flex-shrink-0">
                                                <Flag className="w-3 h-3" />
                                                {comment.reports.length}
                                            </div>
                                        </div>

                                        {comment.report_reasons?.length > 0 && (
                                            <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                                <p className="text-xs font-semibold text-orange-700 mb-1">{language === 'ar' ? 'أسباب الإبلاغ:' : 'Report reasons:'}</p>
                                                {comment.report_reasons.map((reason, i) => <p key={i} className="text-xs text-orange-600">• {reason}</p>)}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {!isHidden ? (
                                                <Button size="sm" variant="outline" onClick={() => handleHideComment(comment)} className="text-orange-600 border-orange-300 hover:bg-orange-50">
                                                    <EyeOff className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'إخفاء' : 'Hide'}
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleUnhideComment(comment)} className="text-green-600 border-green-300 hover:bg-green-50">
                                                    <Eye className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'إظهار' : 'Restore'}
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" onClick={() => handleDeleteComment(comment)} className="text-red-600 border-red-300 hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'حذف التعليق' : 'Delete Comment'}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleWarnUser(comment.author_email)} className="text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'تحذير' : 'Warn'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ===== الخدمات المُبلّغ عنها ===== */}
                            {reportedServices.map(service => (
                                <div key={`service-${service.id}`} className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1 min-w-0 flex gap-3">
                                            {service.image_url && (
                                                <img src={service.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className="bg-purple-50 text-purple-600 text-[10px]">{language === 'ar' ? 'خدمة' : 'Service'}</Badge>
                                                    <span className="font-bold text-gray-800 truncate">{service.name}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{service.provider_name} — {service.created_by}</p>
                                                <p className="text-gray-600 text-sm line-clamp-2 mt-1">{service.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-bold flex-shrink-0">
                                            <Flag className="w-3 h-3" />
                                            {service.reports.length}
                                        </div>
                                    </div>

                                    {service.report_reasons?.length > 0 && (
                                        <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                            <p className="text-xs font-semibold text-orange-700 mb-1">{language === 'ar' ? 'أسباب الإبلاغ:' : 'Report reasons:'}</p>
                                            {service.report_reasons.map((reason, i) => <p key={i} className="text-xs text-orange-600">• {reason}</p>)}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleDismissServiceReport(service)} className="text-gray-600 border-gray-300 hover:bg-gray-50">
                                            <Eye className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'تجاهل الإبلاغ' : 'Dismiss'}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDeleteService(service)} className="text-red-600 border-red-300 hover:bg-red-50">
                                            <Trash2 className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'حذف الخدمة' : 'Delete Service'}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleWarnUser(service.created_by)} className="text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />{language === 'ar' ? 'تحذير' : 'Warn'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-gray-400" />
                        <Input
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            placeholder={t('searchUsers')}
                            className="pl-9"
                        />
                    </div>
                    {filteredUsers.length === 0 ? (
                        <p className="text-center py-10 text-gray-400">{t('noUsersFound')}</p>
                    ) : (
                        filteredUsers.map(user => {
                            const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                            return (
                                <div key={user.id} className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-3 ${isBanned ? 'border-red-300 bg-red-50/30' : 'border-gray-100'}`}>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{user.full_name || user.email}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {user.account_type === 'vip' && <Badge className="bg-yellow-100 text-yellow-700 text-xs">VIP</Badge>}
                                            {user.account_type === 'ad' && <Badge className="bg-purple-100 text-purple-700 text-xs">AD</Badge>}
                                            {user.warnings > 0 && <Badge className="bg-orange-100 text-orange-700 text-xs">{language === 'ar' ? 'تحذيرات' : 'Warnings'}: {user.warnings}/3</Badge>}
                                            {isBanned && <Badge className="bg-red-100 text-red-700 text-xs">{language === 'ar' ? 'محظور' : 'Banned'}</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {isBanned ? (
                                            <Button size="sm" variant="outline" onClick={() => handleUnban(user)} className="text-green-600 border-green-300 text-xs">
                                                {language === 'ar' ? 'رفع الحظر' : 'Unban'}
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleWarnUser(user.email)} className="text-yellow-600 border-yellow-300 text-xs">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                {language === 'ar' ? 'تحذير' : 'Warn'}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user)} className="text-red-600 border-red-300 text-xs">
                                            <UserX className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'manage' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-yellow-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-bold text-gray-800">{language === 'ar' ? 'حسابات VIP' : 'VIP Accounts'}</h3>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <Input value={vipEmail} onChange={e => setVipEmail(e.target.value)} placeholder="email@example.com" className="flex-1" />
                            <Button onClick={handleSetVip} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                <Crown className="w-4 h-4 mr-1" />
                                {language === 'ar' ? 'إضافة VIP' : 'Add VIP'}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {vipUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                                    <span className="text-sm font-medium">{u.full_name || u.email} <span className="text-gray-400 text-xs">{u.email}</span></span>
                                    <Button size="sm" variant="ghost" onClick={() => handleRemoveRole(u)} className="text-red-500 hover:text-red-700 text-xs">{language === 'ar' ? 'إزالة' : 'Remove'}</Button>
                                </div>
                            ))}
                            {vipUsers.length === 0 && <p className="text-gray-400 text-sm">{language === 'ar' ? 'لا يوجد' : 'None'}</p>}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-purple-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Megaphone className="w-5 h-5 text-purple-500" />
                            <h3 className="font-bold text-gray-800">{language === 'ar' ? 'حسابات إعلانية' : 'Ad Accounts'}</h3>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <Input value={adEmail} onChange={e => setAdEmail(e.target.value)} placeholder="email@example.com" className="flex-1" />
                            <Button onClick={handleSetAd} className="bg-purple-500 hover:bg-purple-600 text-white">
                                <Megaphone className="w-4 h-4 mr-1" />
                                {language === 'ar' ? 'إضافة إعلاني' : 'Add Ad'}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {adUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                    <span className="text-sm font-medium">{u.full_name || u.email} <span className="text-gray-400 text-xs">{u.email}</span></span>
                                    <Button size="sm" variant="ghost" onClick={() => handleRemoveRole(u)} className="text-red-500 hover:text-red-700 text-xs">{language === 'ar' ? 'إزالة' : 'Remove'}</Button>
                                </div>
                            ))}
                            {adUsers.length === 0 && <p className="text-gray-400 text-sm">{language === 'ar' ? 'لا يوجد' : 'None'}</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-red-500" />
                            <h3 className="font-bold text-gray-800 text-lg">{t('platformStats')}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.map((stat, i) => (
                                <Card key={i} className="border-0 shadow-sm overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                                            <stat.icon className={`w-5 h-5 ${stat.text}`} />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="w-4 h-4 text-blue-500" />
                                {language === 'ar' ? 'توزيع المستخدمين' : 'User Breakdown'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('vipMembers')}</span>
                                </div>
                                <Badge className="bg-yellow-200 text-yellow-800">{vipUsers.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Megaphone className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('adAccounts')}</span>
                                </div>
                                <Badge className="bg-purple-200 text-purple-800">{adUsers.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('regularUsers')}</span>
                                </div>
                                <Badge className="bg-blue-200 text-blue-800">{allUsers.filter(u => u.account_type !== 'admin' && u.account_type !== 'vip' && u.account_type !== 'ad').length}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium text-gray-700">{language === 'ar' ? 'تحذيرات نشطة' : 'Active Warnings'}</span>
                                </div>
                                <Badge className="bg-orange-200 text-orange-800">{warnedCount}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Ban className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-gray-700">{t('bannedUsers')}</span>
                                </div>
                                <Badge className="bg-red-200 text-red-800">{bannedCount}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                {t('recentActivity')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                <span className="text-sm text-gray-700">{language === 'ar' ? 'منشورات آخر 7 أيام' : 'Posts (last 7 days)'}</span>
                                <Badge className="bg-green-200 text-green-800">{recentPosts}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                <span className="text-sm text-gray-700">{language === 'ar' ? 'إجمالي الإبلاغات' : 'Total Reports'}</span>
                                <Badge className="bg-purple-200 text-purple-800">{reportedPosts.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                <span className="text-sm text-gray-700">{language === 'ar' ? 'خدمات مميزة' : 'Featured Services'}</span>
                                <Badge className="bg-amber-200 text-amber-800">{allServices.filter(s => s.subscription_plan === 'premium').length}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

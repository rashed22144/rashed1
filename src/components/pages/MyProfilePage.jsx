import React, { useState, useEffect, useRef } from 'react';
import { backend } from '@/api/backendClient';
import { Service } from '@/entities/Service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Mail, Calendar, Briefcase, FileText, MessageSquare, Camera, Pencil, ThumbsUp, Check, X, ArrowUpRight } from 'lucide-react';
import ServiceCard from '../ServiceCard';
import PostCard from '../community/PostCard';
import { useLanguage } from '@/lib/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function MyProfilePage() {
    const { t, dir, language } = useLanguage();
    const [user, setUser] = useState(null);
    const [myServices, setMyServices] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [myComments, setMyComments] = useState([]);
    const [commentsPostsMap, setCommentsPostsMap] = useState({});
    const [likedPosts, setLikedPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('services');
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const currentUser = await backend.auth.me();
            setUser(currentUser);
            const [servicesR, postsR, commentsR, allPostsR] = await Promise.allSettled([
                Service.filter({ created_by: currentUser.email }),
                backend.entities.Post.filter({ author_email: currentUser.email }),
                backend.entities.PostComment.filter({ author_email: currentUser.email }),
                backend.entities.Post.list('-created_date', 200),
            ]);
            const services = servicesR.status === 'fulfilled' ? servicesR.value : [];
            const posts = postsR.status === 'fulfilled' ? postsR.value : [];
            const comments = commentsR.status === 'fulfilled' ? commentsR.value : [];
            const allPosts = allPostsR.status === 'fulfilled' ? allPostsR.value : [];

            if (servicesR.status === 'rejected') console.error('MyProfilePage: فشل جلب الخدمات', servicesR.reason);
            if (postsR.status === 'rejected') console.error('MyProfilePage: فشل جلب المنشورات', postsR.reason);
            if (commentsR.status === 'rejected') console.error('MyProfilePage: فشل جلب التعليقات', commentsR.reason);
            if (allPostsR.status === 'rejected') console.error('MyProfilePage: فشل جلب كل المنشورات', allPostsR.reason);

            setMyServices(services);
            setMyPosts(posts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
            setMyComments(comments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
            const postMap = {};
            comments.forEach(c => {
                const p = allPosts.find(item => item.id === c.post_id);
                if (p) postMap[c.post_id] = p;
            });
            setCommentsPostsMap(postMap);
            const liked = allPosts.filter(p => p.likes?.includes(currentUser.email) || p.loves?.includes(currentUser.email));
            setLikedPosts(liked);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        const { file_url } = await backend.integrations.Core.UploadFile({ file });
        await backend.auth.updateMe({ avatar_url: file_url });
        setUser(prev => ({ ...prev, avatar_url: file_url }));
        setUploadingAvatar(false);
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        const { file_url } = await backend.integrations.Core.UploadFile({ file });
        await backend.auth.updateMe({ cover_url: file_url });
        setUser(prev => ({ ...prev, cover_url: file_url }));
        setUploadingCover(false);
    };

    const handleServiceDeleted = (id) => setMyServices(prev => prev.filter(s => s.id !== id));
    const handlePostUpdate = (updated) => setMyPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    const handlePostDelete = (id) => setMyPosts(prev => prev.filter(p => p.id !== id));

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    const timeAgo = (date) => {
        try { return formatDistanceToNow(new Date(date), { addSuffix: true, locale: language === 'ar' ? ar : enUS }); }
        catch { return ''; }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!user) return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{language === 'ar' ? 'يجب تسجيل الدخول' : 'Please login first'}</h2>
        </div>
    );

    const tabs = [
        { id: 'services', label: language === 'ar' ? 'الخدمات' : 'Services', icon: Briefcase, count: myServices.length },
        { id: 'posts', label: language === 'ar' ? 'المنشورات' : 'Posts', icon: FileText, count: myPosts.length },
        { id: 'comments', label: language === 'ar' ? 'التعليقات' : 'Comments', icon: MessageSquare, count: myComments.length },
        { id: 'likes', label: language === 'ar' ? 'الإعجابات' : 'Likes', icon: ThumbsUp, count: likedPosts.length },
    ];

    return (
        <div className="max-w-3xl mx-auto" dir={dir}>
            {/* Cover */}
            <div className="relative mb-20">
                <div
                    className="h-48 rounded-2xl relative overflow-hidden group cursor-pointer"
                    style={{ background: user.cover_url ? undefined : 'linear-gradient(135deg, #3b82f6, #7c3aed, #ec4899)' }}
                    onClick={() => coverInputRef.current?.click()}
                >
                    {user.cover_url && <img src={user.cover_url} alt="cover" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        {uploadingCover ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        ) : (
                            <div className="flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
                                <Camera className="w-4 h-4" />
                                {language === 'ar' ? 'تغيير الغلاف' : 'Change Cover'}
                            </div>
                        )}
                    </div>
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

                {/* Avatar */}
                <div className="absolute -bottom-16 px-6 flex items-end justify-between w-full">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-white shadow-xl cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <AvatarImage src={user.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                                {getInitials(user.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            {uploadingAvatar ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <Camera className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

                    <div className="mb-2 flex gap-2">
                        <Button asChild variant="outline" className="rounded-full px-5">
                            <Link to={createPageUrl('SettingsPage')}>
                                <Pencil className="w-4 h-4 me-1" />{language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                            </Link>
                        </Button>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-full px-5">
                            <Link to={createPageUrl('AddServicePage')}>
                                <Plus className="w-4 h-4 me-1" />{t('addService')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="px-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user.email}</span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {t('joinedAt')} {new Date(user.created_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                </div>
                <div className="flex flex-wrap gap-6 mt-4">
                    {[
                        { val: myServices.length, label: language === 'ar' ? 'الخدمات' : 'Services' },
                        { val: myPosts.length, label: language === 'ar' ? 'المنشورات' : 'Posts' },
                        { val: myComments.length, label: language === 'ar' ? 'التعليقات' : 'Comments' },
                        { val: likedPosts.length, label: language === 'ar' ? 'الإعجابات' : 'Likes' },
                    ].map(item => (
                        <div key={item.label} className="text-center">
                            <p className="text-xl font-bold text-gray-900">{item.val}</p>
                            <p className="text-xs text-gray-500">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'services' && (
                    myServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myServices.map(s => <ServiceCard key={s.id} service={s} showActions currentUser={user} onServiceDeleted={handleServiceDeleted} />)}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} label={language === 'ar' ? 'لا توجد خدمات بعد' : 'No services yet'} action={
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-full">
                                <Link to={createPageUrl('AddServicePage')}><Plus className="w-4 h-4 me-1" />{t('addService')}</Link>
                            </Button>
                        } />
                    )
                )}

                {activeTab === 'posts' && (
                    myPosts.length > 0 ? (
                        myPosts.map(post => <PostCard key={post.id} post={post} currentUser={user} onUpdate={handlePostUpdate} onDelete={handlePostDelete} followData={[]} />)
                    ) : (
                        <EmptyState icon={FileText} label={language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'} action={
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-full">
                                <Link to={createPageUrl('CommunityPage')}>{t('community')}</Link>
                            </Button>
                        } />
                    )
                )}

                {activeTab === 'comments' && (
                    myComments.length > 0 ? (
                        <div className="space-y-3">
                            {myComments.map(c => (
                                <CommentCard key={c.id} comment={c} post={commentsPostsMap[c.post_id]} language={language} timeAgo={timeAgo} user={user} onDelete={(id) => setMyComments(prev => prev.filter(x => x.id !== id))} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={MessageSquare} label={language === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'} />
                    )
                )}

                {activeTab === 'likes' && (
                    likedPosts.length > 0 ? (
                        <div className="space-y-4">
                            {likedPosts.map(post => (
                                <PostCard key={post.id} post={post} currentUser={user} onUpdate={() => {}} onDelete={() => {}} followData={[]} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={ThumbsUp} label={language === 'ar' ? 'لم تعجب بأي منشور بعد' : 'No liked posts yet'} />
                    )
                )}
            </div>
        </div>
    );
}

function CommentCard({ comment, post, language, timeAgo, user, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [localContent, setLocalContent] = useState(comment.content);
    const [localUpdated, setLocalUpdated] = useState(comment.updated_date);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleted, setDeleted] = useState(false);

    if (deleted) return null;

    const wasEdited = localUpdated && localUpdated !== comment.created_date;

    const handleEdit = async () => {
        if (!editText.trim()) return;
        await backend.entities.PostComment.update(comment.id, { content: editText.trim() });
        setLocalContent(editText.trim());
        setLocalUpdated(new Date().toISOString());
        setIsEditing(false);
    };

    const handleDelete = async () => {
        await backend.entities.PostComment.delete(comment.id);
        setDeleted(true);
        onDelete(comment.id);
    };

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm group">
            {post ? (
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-700">
                            {language === 'ar' ? `على منشور ${post.author_name || ''}` : `On ${post.author_name || ''}'s post`}
                        </span>
                        <Link
                            to={createPageUrl('CommunityPage') + `?post=${post.id}`}
                            className="flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline shrink-0"
                        >
                            {language === 'ar' ? 'فتح بالمجتمع' : 'Open in feed'}
                            <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {post.content && (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words mb-2">{post.content}</p>
                    )}
                    {(post.images?.length > 0 || post.image_url) && (
                        <div className="rounded-xl overflow-hidden border border-gray-100">
                            <img
                                src={post.images?.length > 0 ? post.images[0] : post.image_url}
                                alt=""
                                className="w-full max-h-64 object-cover"
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-3 pb-3 border-b border-gray-50">
                    <span className="text-[11px] text-amber-600 font-medium">
                        {language === 'ar' ? '⚠️ المنشور الأصلي محذوف أو غير متاح' : '⚠️ Original post unavailable'}
                    </span>
                </div>
            )}
            <div className="flex items-start justify-between gap-2">
                {isEditing ? (
                    <div className="flex-1 flex gap-2">
                        <input
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                            className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <button onClick={handleEdit} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-200 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <p className="text-gray-700 text-sm flex-1 break-words">{localContent}</p>
                )}
                {!isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                <span className="text-xs text-red-500">{language === 'ar' ? 'حذف؟' : 'Del?'}</span>
                                <button onClick={handleDelete} className="text-xs font-bold text-red-600">✓</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-gray-400">✕</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5 rotate-45" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{timeAgo(comment.created_date)}</span>
                {wasEdited && <span className="italic">{language === 'ar' ? `• تم التعديل ${timeAgo(localUpdated)}` : `• edited ${timeAgo(localUpdated)}`}</span>}
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon = FileText, label, action }) {
    return (
        <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 mb-4">{label}</p>
            {action}
        </div>
    );
}

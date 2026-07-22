import React, { useState, useEffect } from 'react';
import { backend } from '@/api/backendClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Briefcase, FileText, Image, ThumbsUp, MessageCircle, Crown, ArrowUpRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import ServiceCard from '../ServiceCard';
import PostCard from '../community/PostCard';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function UserProfilePage() {
    const { t, dir, language } = useLanguage();
    const urlParams = new URLSearchParams(window.location.search);
    const profileEmail = urlParams.get('email');

    const [profileUser, setProfileUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [services, setServices] = useState([]);
    const [posts, setPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [commentsPostsMap, setCommentsPostsMap] = useState({});
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followData, setFollowData] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadData(); }, [profileEmail]);

    const loadData = async () => {
        if (!profileEmail) return;
        setIsLoading(true);
        try {
            let me = null;
            try { me = await backend.auth.me(); setCurrentUser(me); } catch {}

            const [allUsers, postsData, servicesData, followersData, followingData, allPosts, allComments] = await Promise.all([
                backend.entities.User.list(),
                backend.entities.Post.filter({ author_email: profileEmail }),
                backend.entities.Service.filter({ email: profileEmail }),
                backend.entities.Follow.filter({ following_email: profileEmail }),
                backend.entities.Follow.filter({ follower_email: profileEmail }),
                backend.entities.Post.list('-created_date', 200),
                backend.entities.PostComment.filter({ author_email: profileEmail }),
            ]);

            const foundUser = allUsers.find(u => u.email === profileEmail);
            setProfileUser(foundUser || { full_name: profileEmail.split('@')[0], email: profileEmail });
            const visiblePosts = postsData.filter(p => !p.hidden).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            setPosts(visiblePosts);
            setServices(servicesData.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 6));
            setFollowersCount(followersData.length);
            setFollowingCount(followingData.length);

            // Posts liked by this profile user
            const liked = allPosts.filter(p => p.likes?.includes(profileEmail) || p.loves?.includes(profileEmail));
            setLikedPosts(liked);

            // Comments by this user
            const sortedComments = allComments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            setUserComments(sortedComments);
            const postMap = {};
            sortedComments.forEach(c => {
                const post = allPosts.find(p => p.id === c.post_id);
                if (post) postMap[c.post_id] = post;
            });
            setCommentsPostsMap(postMap);

            if (me) {
                const myFollows = await backend.entities.Follow.filter({ follower_email: me.email });
                setFollowData(myFollows);
            }
        } catch (err) {
            console.error('UserProfilePage loadData error:', err);
            // حتى لو فشل أحد الطلبات، نعرض بروفايل أساسي بدل رسالة "المستخدم غير موجود" المضللة
            setProfileUser((prev) => prev || { full_name: profileEmail.split('@')[0], email: profileEmail });
        }
        setIsLoading(false);
    };

    const handleFollowChange = async () => {
        if (!currentUser) return;
        const [myFollows, followersData] = await Promise.all([
            backend.entities.Follow.filter({ follower_email: currentUser.email }),
            backend.entities.Follow.filter({ following_email: profileEmail }),
        ]);
        setFollowData(myFollows);
        setFollowersCount(followersData.length);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    const isFollowing = currentUser && followData.some(f => f.follower_email === currentUser.email && f.following_email === profileEmail);
    const isOwnProfile = currentUser?.email === profileEmail;

    const handleFollow = async () => {
        if (!currentUser || isOwnProfile) return;
        if (isFollowing) {
            const record = followData.find(f => f.follower_email === currentUser.email && f.following_email === profileEmail);
            if (record) await backend.entities.Follow.delete(record.id);
        } else {
            await backend.entities.Follow.create({
                follower_email: currentUser.email,
                following_email: profileEmail,
                follower_name: currentUser.full_name,
            });
        }
        handleFollowChange();
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

    if (!profileUser) return (
        <div className="text-center py-20 text-gray-500">{language === 'ar' ? 'المستخدم غير موجود' : 'User not found'}</div>
    );

    const tabs = [
        { id: 'posts', label: language === 'ar' ? 'المنشورات' : 'Posts', icon: FileText, count: posts.length },
        { id: 'media', label: language === 'ar' ? 'الصور' : 'Photos', icon: Image, count: posts.filter(p => p.image_url).length },
        { id: 'comments', label: language === 'ar' ? 'التعليقات' : 'Comments', icon: MessageCircle, count: userComments.length },
        { id: 'services', label: language === 'ar' ? 'الخدمات' : 'Services', icon: Briefcase, count: services.length },
        { id: 'likes', label: language === 'ar' ? 'الإعجابات' : 'Likes', icon: ThumbsUp, count: likedPosts.length },
    ];

    const avatarColors = ['from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600', 'from-green-500 to-teal-600', 'from-orange-400 to-rose-500'];
    const colorIdx = profileUser.full_name ? profileUser.full_name.charCodeAt(0) % avatarColors.length : 0;

    return (
        <div className="max-w-2xl mx-auto" dir={dir}>
            {/* Cover */}
            <div className="relative mb-20">
                <div
                    className={`h-40 rounded-2xl overflow-hidden ${profileUser.account_type === 'vip' ? 'ring-3 ring-yellow-400' : ''}`}
                    style={{ background: profileUser.cover_url ? undefined : profileUser.account_type === 'vip' ? 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)' : profileUser.account_type === 'ad' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #3b82f6, #7c3aed, #ec4899)' }}
                >
                    {profileUser.cover_url && <img src={profileUser.cover_url} alt="cover" className="w-full h-full object-cover" />}
                    {profileUser.account_type === 'vip' && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5" /> VIP
                        </div>
                    )}
                </div>
                <div className="absolute -bottom-16 px-6 flex items-end justify-between w-full">
                    <div className="relative">
                        {profileUser.account_type === 'vip' && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ padding: '3px', margin: '-3px' }}></div>
                        )}
                        <Avatar className={`h-28 w-28 border-4 border-white shadow-xl relative ${profileUser.account_type === 'vip' ? 'ring-2 ring-yellow-400' : ''}`}>
                            <AvatarImage src={profileUser.avatar_url} className="object-cover" />
                            <AvatarFallback className={`bg-gradient-to-br ${profileUser.account_type === 'vip' ? 'from-yellow-500 to-amber-600' : avatarColors[colorIdx]} text-white text-3xl font-bold`}>
                                {getInitials(profileUser.full_name)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    {currentUser && !isOwnProfile && (
                        <Button
                            onClick={handleFollow}
                            className={`mb-2 rounded-full px-5 ${isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            {isFollowing ? <><UserCheck className="w-4 h-4 me-1" />{t('unfollow')}</> : <><UserPlus className="w-4 h-4 me-1" />{t('follow')}</>}
                        </Button>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="px-4 mb-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profileUser.full_name}</h1>
                    {profileUser.account_type === 'vip' && <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                    {profileUser.account_type === 'ad' && <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">AD</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{profileEmail}</p>
                {profileUser.bio && <p className="text-sm text-gray-700 mt-2">{profileUser.bio}</p>}
                <div className="flex gap-6 mt-4 flex-wrap">
                    {[
                        { val: followersCount, label: t('followers') },
                        { val: followingCount, label: t('following') },
                        { val: posts.length, label: language === 'ar' ? 'المنشورات' : 'Posts' },
                        { val: services.length, label: language === 'ar' ? 'الخدمات' : 'Services' },
                    ].map(item => (
                        <div key={item.label} className="text-center">
                            <p className="text-xl font-bold text-gray-900">{item.val}</p>
                            <p className="text-xs text-gray-500">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'posts' && (
                    posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} currentUser={currentUser} onUpdate={() => {}} onDelete={() => {}} followData={followData} onFollowChange={() => {}} />
                        ))
                    ) : (
                        <div className="text-center py-16 text-gray-400">{t('noPostsYet')}</div>
                    )
                )}

                {activeTab === 'media' && (() => {
                    const mediaPosts = posts.filter(p => p.image_url);
                    return mediaPosts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                            {mediaPosts.map(post => (
                                <div key={post.id} className="aspect-square overflow-hidden rounded-lg">
                                    <img src={post.image_url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-400">{language === 'ar' ? 'لا توجد صور بعد' : 'No photos yet'}</div>
                    );
                })()}

                {activeTab === 'comments' && (
                    userComments.length > 0 ? (
                        <div className="space-y-4">
                            {userComments.map(comment => {
                                const post = commentsPostsMap[comment.post_id];
                                return (
                                    <div key={comment.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        {/* Post preview */}
                                        {post && (
                                            <Link to={`/CommunityPage?post=${post.id}`} className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                                            {getInitials(post.author_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{post.author_name}</p>
                                                        <p className="text-xs text-gray-400">{timeAgo(post.created_date)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium flex-shrink-0">
                                                        {language === 'ar' ? 'عرض المنشور' : 'View post'}
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                                {post.content && (
                                                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-3 mb-3">{post.content}</p>
                                                )}
                                                {post.image_url && (
                                                    <div className="rounded-xl overflow-hidden">
                                                        <img src={post.image_url} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                                                    </div>
                                                )}
                                                {post.images && post.images.length > 0 && (
                                                    <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                        {post.images.slice(0, 2).map((img, i) => (
                                                            <img key={i} src={img} alt="" className="w-full max-h-32 object-cover rounded-lg" />
                                                        ))}
                                                    </div>
                                                )}
                                            </Link>
                                        )}

                                        {/* User's comment */}
                                        <div className="p-4 bg-blue-50/30">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-semibold text-blue-600">
                                                            {language === 'ar' ? 'تعليقك' : 'Your comment'}
                                                        </span>
                                                        <span className="text-xs text-gray-400">• {timeAgo(comment.created_date)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-400">{language === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}</div>
                    )
                )}

                {activeTab === 'services' && (
                    services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map(s => <ServiceCard key={s.id} service={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-400">{language === 'ar' ? 'لا توجد خدمات' : 'No services'}</div>
                    )
                )}

                {activeTab === 'likes' && (
                    likedPosts.length > 0 ? (
                        <div className="space-y-4">
                            {likedPosts.map(post => (
                                <PostCard key={post.id} post={post} currentUser={currentUser} onUpdate={() => {}} onDelete={() => {}} followData={followData} onFollowChange={() => {}} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-400">{language === 'ar' ? 'لا توجد إعجابات بعد' : 'No likes yet'}</div>
                    )
                )}
            </div>
        </div>
    );
}

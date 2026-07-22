import React, { useState, useEffect, useCallback } from 'react';
import { backend } from '@/api/backendClient';
import { useLanguage } from '@/lib/LanguageContext';
import CreatePost from '../community/CreatePost';
import PostCard from '../community/PostCard';
import { Users, Sparkles, UserCheck, Crown, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useLocation } from 'react-router-dom';

export default function CommunityPage() {
    const { t, language, dir } = useLanguage();
    const [currentUser, setCurrentUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [followData, setFollowData] = useState([]);
    const [vipUsers, setVipUsers] = useState([]);
    const [userAvatars, setUserAvatars] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('forYou');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [postsData, vips, allUsers] = await Promise.all([
                backend.entities.Post.list('-created_date', 100),
                backend.entities.User.filter({ account_type: 'vip' }),
                backend.entities.User.list(),
            ]);
            setPosts(postsData);
            setVipUsers(vips);
            // خريطة إيميل -> أحدث صورة بروفايل، عشان نعرض دايماً الصورة الحالية مو صورة وقت النشر
            const avatarsMap = {};
            allUsers.forEach(u => { avatarsMap[u.email] = u.avatar_url; });
            setUserAvatars(avatarsMap);
            try {
                const user = await backend.auth.me();
                setCurrentUser(user);
                const follows = await backend.entities.Follow.filter({ follower_email: user.email });
                setFollowData(follows);
            } catch {}
        } catch (e) { console.error(e); }
        setIsLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const locationHook = useLocation();
    useEffect(() => {
        const targetId = new URLSearchParams(locationHook.search).get('post');
        if (!targetId || isLoading) return;
        const el = document.getElementById(`post-${targetId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400', 'rounded-2xl');
            const timeout = setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'rounded-2xl'), 2500);
            return () => clearTimeout(timeout);
        }
    }, [locationHook.search, isLoading, posts]);

    const refreshFollows = async () => {
        if (!currentUser) return;
        const follows = await backend.entities.Follow.filter({ follower_email: currentUser.email });
        setFollowData(follows);
    };

    const handlePostCreated = (newPost) => setPosts(prev => [newPost, ...prev]);
    const handlePostUpdate = (updatedPost) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    const handlePostDelete = (postId) => setPosts(prev => prev.filter(p => p.id !== postId));

    const getForYouPosts = () => {
        if (!currentUser) return posts;
        const userEmail = currentUser.email;
        const followingEmails = new Set(followData.map(f => f.following_email));
        return buildInterleavedFeed(posts, userEmail, followingEmails);
    };

    // خوارزمية تنويع الخلاصة: نمط متكرر (شهير، شهير، جديد/اكتشاف، إعلان) بدل ترتيب واحد ثابت،
    // يشبه فكرة فيسبوك/إنستقرام بمزج المحتوى المشهور مع محتوى جديد لحسابات عشوائية + الإعلانات
    const buildInterleavedFeed = (allPosts, userEmail, followingEmails) => {
        const engagementScore = (p) =>
            (p.likes?.length || 0) * 1.5 +
            (p.loves?.length || 0) * 2 +
            (p.comments_count || 0) * 3 +
            (p.shares_count || 0) * 2 +
            (followingEmails.has(p.author_email) ? 15 : 0);

        const myPosts = allPosts.filter((p) => p.author_email === userEmail);
        const others = allPosts.filter((p) => p.author_email !== userEmail && !p.is_ad);
        const ads = allPosts.filter((p) => p.is_ad);

        // الأكثر شعبية (تفاعل عالي)
        const popular = [...others].sort((a, b) => engagementScore(b) - engagementScore(a));
        // اكتشاف: منشورات جديدة من حسابات ما نتابعها (فرصة لأشخاص عشوائيين يوصلون محتواهم)
        const fresh = [...others]
            .filter((p) => !followingEmails.has(p.author_email))
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        const usedIds = new Set(myPosts.map((p) => p.id));
        const result = [...myPosts];

        let pi = 0, fi = 0, ai = 0;
        const pattern = ['popular', 'popular', 'fresh', 'ad'];
        let patternIndex = 0;
        const maxSteps = allPosts.length * 2 + 20;

        for (let step = 0; step < maxSteps && usedIds.size < allPosts.length; step++) {
            const type = pattern[patternIndex % pattern.length];
            patternIndex++;
            let added = false;

            if (type === 'popular') {
                while (pi < popular.length && usedIds.has(popular[pi].id)) pi++;
                if (pi < popular.length) { result.push(popular[pi]); usedIds.add(popular[pi].id); pi++; added = true; }
            } else if (type === 'fresh') {
                while (fi < fresh.length && usedIds.has(fresh[fi].id)) fi++;
                if (fi < fresh.length) { result.push(fresh[fi]); usedIds.add(fresh[fi].id); fi++; added = true; }
            } else if (type === 'ad') {
                if (ai < ads.length) { result.push(ads[ai]); usedIds.add(ads[ai].id); ai++; added = true; }
            }

            // لو النوع المطلوب انتهى محتواه، عبّي الفراغ من أي مصدر ثاني متبقي
            if (!added) {
                while (pi < popular.length && usedIds.has(popular[pi].id)) pi++;
                if (pi < popular.length) { result.push(popular[pi]); usedIds.add(popular[pi].id); pi++; continue; }
                while (fi < fresh.length && usedIds.has(fresh[fi].id)) fi++;
                if (fi < fresh.length) { result.push(fresh[fi]); usedIds.add(fresh[fi].id); fi++; continue; }
                if (ai < ads.length) { result.push(ads[ai]); usedIds.add(ads[ai].id); ai++; }
            }
        }

        return result;
    };

    const getFollowingPosts = () => {
        const followingEmails = new Set(followData.map(f => f.following_email));
        if (currentUser) followingEmails.add(currentUser.email);
        return posts.filter(p => followingEmails.has(p.author_email));
    };

    const vipEmails = new Set(vipUsers.map(u => u.email));

    const insertAds = (postsList) => {
        const adPosts = postsList.filter(p => p.is_ad);
        const regularPosts = postsList.filter(p => !p.is_ad);
        const result = [];
        let adIndex = 0;
        regularPosts.forEach((post, i) => {
            result.push(post);
            if ((i + 1) % 5 === 0 && adIndex < adPosts.length) {
                result.push(adPosts[adIndex]);
                adIndex++;
            }
        });
        return result;
    };

    const getWeeklyTrendingPosts = () => {
        const oneWeekAgo = Date.now() - 7 * 24 * 3600000;
        return [...posts]
            .filter((p) => !p.is_ad && new Date(p.created_date).getTime() >= oneWeekAgo)
            .sort((a, b) => {
                const scoreA = (a.likes?.length || 0) + (a.loves?.length || 0) + (a.comments_count || 0) * 2;
                const scoreB = (b.likes?.length || 0) + (b.loves?.length || 0) + (b.comments_count || 0) * 2;
                return scoreB - scoreA;
            })
            .slice(0, 5);
    };

    const displayedPosts = activeTab === 'forYou' ? getForYouPosts() : insertAds(getFollowingPosts());

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    return (
        <div className="max-w-6xl mx-auto flex gap-5 justify-center items-start px-3 md:px-6" dir={dir}>
            {/* Main Content Column */}
            <div className="w-full max-w-2xl flex-shrink min-w-0">
                {/* Hero Header */}
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 mb-5 overflow-hidden shadow-lg shadow-blue-200">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                    </div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{t('community')}</h1>
                            <p className="text-blue-200 text-sm mt-0.5">
                                {language === 'ar' ? 'شارك وتفاعل مع المجتمع' : 'Share & connect with the community'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile VIP Horizontal Scroll - shows on mobile/tablet only */}
                {vipUsers.length > 0 && (
                    <div className="lg:hidden mb-5 bg-white rounded-2xl shadow-sm border border-yellow-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2.5 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-white" />
                            <h3 className="font-bold text-white text-xs">
                                {language === 'ar' ? 'خبراء المجتمع' : 'Community Experts'}
                            </h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto p-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            {vipUsers.map(v => (
                                <Link
                                    key={v.id}
                                    to={`/UserProfilePage?email=${encodeURIComponent(v.email)}`}
                                    className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ padding: '2px', margin: '-2px' }}></div>
                                        <Avatar className="h-12 w-12 relative border-2 border-white rounded-full">
                                            <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white font-bold text-xs">
                                                {getInitials(v.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-700 truncate w-full text-center">{v.full_name?.split(' ')[0] || v.email.split('@')[0]}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-5 gap-1">
                    <button
                        onClick={() => setActiveTab('forYou')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'forYou' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        {t('forYou')}
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'following' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <UserCheck className="w-4 h-4" />
                        {t('followingFeed')}
                    </button>
                </div>

                {/* Create Post */}
                <div className="mb-5">
                    <CreatePost currentUser={currentUser} onPostCreated={handlePostCreated} />
                </div>

                {/* Posts Feed */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse shadow-sm">
                                <div className="flex gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                                        <div className="h-3 bg-gray-100 rounded-full w-1/4"></div>
                                    </div>
                                </div>
                                <div className="h-16 bg-gray-100 rounded-xl"></div>
                                <div className="flex gap-2 mt-4">
                                    <div className="h-8 bg-gray-100 rounded-xl flex-1"></div>
                                    <div className="h-8 bg-gray-100 rounded-xl flex-1"></div>
                                    <div className="h-8 bg-gray-100 rounded-xl flex-1"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Users className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">{t('noPostsYet')}</h3>
                        <p className="text-gray-400 text-sm">{t('beFirst')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayedPosts.map(post => (
                            <div key={post.id} id={`post-${post.id}`}>
                                <PostCard
                                    post={post}
                                    currentUser={currentUser}
                                    onUpdate={handlePostUpdate}
                                    onDelete={handlePostDelete}
                                    followData={followData}
                                    onFollowChange={refreshFollows}
                                    vipEmails={vipEmails}
                                    userAvatars={userAvatars}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* VIP Right Sidebar - visible on desktop only */}
            <div className="hidden lg:block w-60 flex-shrink-0 sticky top-24">
                <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-white" />
                        <h3 className="font-bold text-white text-sm">
                            {language === 'ar' ? 'خبراء المجتمع' : 'Community Experts'}
                        </h3>
                    </div>
                    <div className="p-3 space-y-1.5 max-h-[70vh] overflow-y-auto">
                        {vipUsers.length > 0 ? vipUsers.map(v => (
                            <Link
                                key={v.id}
                                to={`/UserProfilePage?email=${encodeURIComponent(v.email)}`}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-yellow-50 transition-colors group"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ padding: '2px', margin: '-2px' }}></div>
                                    <Avatar className="h-10 w-10 relative border-2 border-white rounded-full">
                                        <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white font-bold text-xs">
                                            {getInitials(v.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-800 truncate">{v.full_name || v.email.split('@')[0]}</p>
                                    <span className="text-[10px] bg-yellow-400 text-white font-bold px-1.5 rounded-full">VIP</span>
                                </div>
                            </Link>
                        )) : (
                            <p className="text-xs text-gray-400 text-center py-4">
                                {language === 'ar' ? 'لا يوجد خبراء حالياً' : 'No experts yet'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Trending sidebar widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-white" />
                        <h3 className="font-bold text-white text-sm">
                            {language === 'ar' ? 'الأكثر تفاعلاً' : 'Trending'}
                        </h3>
                    </div>
                    <div className="p-3 space-y-2">
                        {getWeeklyTrendingPosts().map((post, i) => {
                            const engagement = (post.likes?.length || 0) + (post.loves?.length || 0) + (post.comments_count || 0);
                            return (
                                <Link
                                    key={post.id}
                                    to={`/CommunityPage?post=${post.id}`}
                                    className="block p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg font-bold text-blue-200 flex-shrink-0">{i + 1}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-700 line-clamp-2">{post.content || (language === 'ar' ? 'منشور' : 'Post')}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {engagement} {language === 'ar' ? 'تفاعل' : 'interactions'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                        {getWeeklyTrendingPosts().length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">
                                {language === 'ar' ? 'لا يوجد منشورات' : 'No posts'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

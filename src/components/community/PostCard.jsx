import React, { useState, memo } from 'react';
import { backend } from '@/api/backendClient';
import { Heart, ThumbsUp, MessageCircle, Share2, Send, Trash2, UserPlus, UserCheck, Flag, TrendingUp, Clock, Crown, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/lib/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import CommentItem from './CommentItem';
import PostImageGallery from './PostImageGallery';
import { Link } from 'react-router-dom';

function PostCard({ post, currentUser, onUpdate, onDelete, followData = [], onFollowChange, isOwnerView = false, vipEmails = new Set(), userAvatars = {} }) {
    const { t, language, dir } = useLanguage();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showReportConfirm, setShowReportConfirm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [commentSort, setCommentSort] = useState('top');

    const userEmail = currentUser?.email;
    const isAdmin = currentUser?.account_type === 'admin';
    const isVipAuthor = vipEmails.has(post.author_email);
    const likes = post.likes || [];
    const loves = post.loves || [];
    const reports = post.reports || [];
    const hasLiked = userEmail && likes.includes(userEmail);
    const hasLoved = userEmail && loves.includes(userEmail);
    const hasReported = userEmail && reports.includes(userEmail);
    const isOwner = userEmail && userEmail === post.author_email;
    const isFollowing = followData.some(f => f.follower_email === userEmail && f.following_email === post.author_email);

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    const timeAgo = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: language === 'ar' ? ar : enUS });
        } catch { return ''; }
    };

    const avatarColors = ['from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600', 'from-green-500 to-teal-600', 'from-orange-400 to-rose-500', 'from-pink-400 to-red-500'];
    const colorIdx = post.author_name ? post.author_name.charCodeAt(0) % avatarColors.length : 0;

    const handleLike = async () => {
        if (!userEmail) return;
        const newLikes = hasLiked ? likes.filter(e => e !== userEmail) : [...likes, userEmail];
        await backend.entities.Post.update(post.id, { likes: newLikes });
        onUpdate({ ...post, likes: newLikes });
    };

    const handleLove = async () => {
        if (!userEmail) return;
        const newLoves = hasLoved ? loves.filter(e => e !== userEmail) : [...loves, userEmail];
        await backend.entities.Post.update(post.id, { loves: newLoves });
        onUpdate({ ...post, loves: newLoves });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.origin + '/CommunityPage?post=' + post.id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
        const newShares = (post.shares_count || 0) + 1;
        backend.entities.Post.update(post.id, { shares_count: newShares });
        onUpdate({ ...post, shares_count: newShares });
    };

    const handleDelete = async () => {
        await backend.entities.Post.delete(post.id);
        onDelete(post.id);
    };

    const handleReport = async () => {
        if (!userEmail || hasReported) return;
        const newReports = [...reports, userEmail];
        const newReasons = [...(post.report_reasons || []), reportReason || (language === 'ar' ? 'بدون سبب' : 'No reason')];
        const shouldHide = newReports.length >= 3;
        await backend.entities.Post.update(post.id, { reports: newReports, report_reasons: newReasons, ...(shouldHide ? { hidden: true } : {}) });
        onUpdate({ ...post, reports: newReports, report_reasons: newReasons, ...(shouldHide ? { hidden: true } : {}) });
        setShowReportConfirm(false);
        setReportReason('');
        if (shouldHide) onDelete(post.id);
    };

    const handleFollow = async () => {
        if (!userEmail || isOwner) return;
        if (isFollowing) {
            const record = followData.find(f => f.follower_email === userEmail && f.following_email === post.author_email);
            if (record) await backend.entities.Follow.delete(record.id);
        } else {
            await backend.entities.Follow.create({ follower_email: userEmail, following_email: post.author_email, follower_name: currentUser.full_name });
        }
        onFollowChange?.();
    };

    const loadComments = async () => {
        if (showComments) { setShowComments(false); return; }
        setLoadingComments(true);
        const data = await backend.entities.PostComment.filter({ post_id: post.id });
        setComments(data);
        setLoadingComments(false);
        setShowComments(true);
    };

    const MAX_COMMENTS_PER_USER = 3;

    const submitComment = async () => {
        if (!commentText.trim() || !currentUser) return;

        if (currentUser.banned_until && new Date(currentUser.banned_until) > new Date()) {
            alert(language === 'ar' ? 'حسابك محظور مؤقتاً من النشر والتعليق' : 'Your account is temporarily banned from posting and commenting');
            return;
        }

        const myTopLevelCount = comments.filter(c => !c.parent_comment_id && c.author_email === currentUser.email).length;
        if (myTopLevelCount >= MAX_COMMENTS_PER_USER) {
            alert(language === 'ar'
                ? `يمكنك إضافة ${MAX_COMMENTS_PER_USER} تعليقات كحد أقصى على هذا المنشور`
                : `You can add up to ${MAX_COMMENTS_PER_USER} comments on this post`);
            return;
        }

        setSubmitting(true);
        try {
            const newComment = await backend.entities.PostComment.create({
                post_id: post.id,
                content: commentText.trim(),
                author_name: currentUser.full_name,
                author_email: currentUser.email,
                author_avatar_url: currentUser.avatar_url || null,
                likes: [],
            });
            const newCount = (post.comments_count || 0) + 1;
            await backend.entities.Post.update(post.id, { comments_count: newCount });
            onUpdate({ ...post, comments_count: newCount });
            setComments(prev => [...prev, newComment]);
            setCommentText('');
        } catch (error) {
            console.error(error);
            alert(language === 'ar' ? `تعذر إرسال التعليق: ${error.message}` : `Could not send comment: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCommentAdded = (newComment) => setComments(prev => [...prev, newComment]);
    const handleCommentUpdated = (updated) => setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
    const handleCommentDeleted = (id) => setComments(prev => prev.filter(c => c.id !== id));

    const topLevelComments = comments.filter(c => !c.parent_comment_id);
    const sortedComments = [...topLevelComments].sort((a, b) => {
        const aVip = vipEmails.has(a.author_email);
        const bVip = vipEmails.has(b.author_email);
        if (aVip && !bVip) return -1;
        if (!aVip && bVip) return 1;

        if (commentSort === 'top') {
            return (b.likes?.length || 0) - (a.likes?.length || 0);
        }
        return new Date(b.created_date) - new Date(a.created_date);
    });

    if (post.hidden && !isOwner) return null;

    return (
        <div className={`rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg ${post.is_ad ? 'border-2 border-purple-400 bg-gradient-to-br from-purple-50/50 to-pink-50/50 shadow-purple-100' : isVipAuthor ? 'border-2 border-amber-300 bg-gradient-to-br from-amber-50/60 via-yellow-50/30 to-white shadow-amber-100/50' : post.hidden ? 'border border-red-100 opacity-60 bg-white' : 'border border-gray-100 bg-white hover:shadow-md'}`} dir={dir}>
            {post.is_ad && (
                <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Megaphone className="w-3 h-3" />
                    {language === 'ar' ? 'إعلان ممول' : 'Sponsored'}
                </div>
            )}
            {isVipAuthor && !post.is_ad && (
                <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-white" />
                    {language === 'ar' ? 'شخصية مميزة' : 'VIP'}
                </div>
            )}
            <div className={`p-4 flex items-center justify-between gap-3 relative ${isVipAuthor ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/UserProfilePage?email=${encodeURIComponent(post.author_email)}`}>
                        <div className="relative">
                            {isVipAuthor && <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ padding: '2px', margin: '-2px' }}></div>}
                            <Avatar className={`h-11 w-11 flex-shrink-0 cursor-pointer transition-all relative ${isVipAuthor ? 'ring-2 ring-yellow-400 ring-offset-1' : 'ring-2 ring-offset-1 ring-transparent hover:ring-blue-300'}`}>
                                <AvatarImage src={userAvatars[post.author_email] || post.author_avatar_url} />
                                <AvatarFallback className={`bg-gradient-to-br ${isVipAuthor ? 'from-yellow-500 to-amber-600' : avatarColors[colorIdx]} text-white font-bold text-sm`}>
                                    {getInitials(post.author_name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </Link>
                    <div className="min-w-0">
                        <Link to={`/UserProfilePage?email=${encodeURIComponent(post.author_email)}`}>
                            <p className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors cursor-pointer truncate flex items-center gap-1.5">
                                {post.author_name}
                                {isVipAuthor && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                            </p>
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(post.created_date)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {currentUser && !isOwner && (
                        <button onClick={handleFollow} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isFollowing ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500' : isVipAuthor ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700 shadow-sm shadow-amber-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}>
                            {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                            {isFollowing ? t('unfollow') : t('follow')}
                        </button>
                    )}
                    {currentUser && !isOwner && (
                        showReportConfirm ? (
                            <div className="flex flex-col gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-orange-600">{language === 'ar' ? 'سبب الإبلاغ:' : 'Reason:'}</span>
                                    <button onClick={handleReport} className="text-xs font-bold text-orange-600 hover:underline">✓</button>
                                    <button onClick={() => { setShowReportConfirm(false); setReportReason(''); }} className="text-xs text-gray-400 hover:underline">✕</button>
                                </div>
                                <input value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder={language === 'ar' ? 'اكتب السبب...' : 'Write reason...'} className="text-xs bg-white border border-orange-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-400" />
                            </div>
                        ) : (
                            <button onClick={() => setShowReportConfirm(true)} className={`p-2 rounded-full transition-colors ${hasReported ? 'text-orange-400 cursor-default' : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'}`}><Flag className="w-3.5 h-3.5" /></button>
                        )
                    )}
                    {(isOwner || isAdmin) && (
                        showDeleteConfirm ? (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                                <button onClick={handleDelete} className="text-xs font-bold text-red-600 hover:underline">حذف؟ ✓</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-gray-400 hover:underline">✕</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-full text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        )
                    )}
                </div>
            </div>
            {post.content && <div className="px-4 pb-3"><p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap break-words">{post.content}</p></div>}
            {(post.images?.length > 0 || post.image_url) && <PostImageGallery images={post.images?.length > 0 ? post.images : [post.image_url]} isAd={post.is_ad} linkUrl={post.link_url} />}
            {(likes.length > 0 || loves.length > 0 || (post.comments_count || 0) > 0) && (
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-500 border-t">
                    <div className="flex items-center gap-1">
                        {loves.length > 0 && <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />}
                        {likes.length > 0 && <ThumbsUp className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />}
                        {(likes.length + loves.length) > 0 && <span>{likes.length + loves.length}</span>}
                    </div>
                    {(post.comments_count || 0) > 0 && (
                        <span>{post.comments_count} {t('comment')}</span>
                    )}
                </div>
            )}
            <div className="px-3 py-1 grid grid-cols-4 gap-1 border-t">
                <button onClick={handleLike} className={`flex items-center justify-center gap-1.5 py-2.5 text-sm ${hasLiked ? 'text-blue-600' : 'text-gray-500'}`}><ThumbsUp className="w-4 h-4" /> {t('like')}</button>
                <button onClick={handleLove} className={`flex items-center justify-center gap-1.5 py-2.5 text-sm ${hasLoved ? 'text-red-500' : 'text-gray-500'}`}><Heart className="w-4 h-4" /> {t('love')}</button>
                <button onClick={loadComments} className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-500"><MessageCircle className="w-4 h-4" /> {t('comment')}</button>
                <button onClick={handleShare} className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-500"><Share2 className="w-4 h-4" /> {t('share')}</button>
            </div>
            {showComments && (
                <div className="border-t bg-gray-50 px-4 py-3">
                    {sortedComments.map(c => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            currentUser={currentUser}
                            allComments={comments}
                            onCommentAdded={handleCommentAdded}
                            onCommentUpdated={handleCommentUpdated}
                            onCommentDeleted={handleCommentDeleted}
                            isPostOwner={userEmail && userEmail === post.author_email}
                            userAvatars={userAvatars}
                        />
                    ))}
                    {currentUser && (
                        <div className="flex gap-2 mt-3">
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 border rounded-full px-4 py-2 text-sm" placeholder={t('writeComment')} />
                            <button onClick={submitComment} className="p-2 bg-blue-600 text-white rounded-full"><Send className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default memo(PostCard);
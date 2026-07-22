import React, { useState } from 'react';
import { backend } from '@/api/backendClient';
import { ThumbsUp, Send, MessageCircle, ChevronDown, ChevronUp, Flag, CornerDownRight, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/lib/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export default function CommentItem({ comment, currentUser, depth = 0, allComments, onCommentAdded, onCommentUpdated, onCommentDeleted, isPostOwner = false, userAvatars = {} }) {
    const { t, language, dir } = useLanguage();
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localLikes, setLocalLikes] = useState(comment.likes || []);
    const [ownerReplyText, setOwnerReplyText] = useState('');
    const [showOwnerReply, setShowOwnerReply] = useState(false);
    const [showReportConfirm, setShowReportConfirm] = useState(false);
    const [reported, setReported] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [localContent, setLocalContent] = useState(comment.content);
    const [localUpdatedDate, setLocalUpdatedDate] = useState(comment.updated_date);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const userEmail = currentUser?.email;
    const hasLiked = userEmail && localLikes.includes(userEmail);
    const replies = allComments.filter(c => c.parent_comment_id === comment.id);
    const isCommentOwner = userEmail && userEmail === comment.author_email;
    const wasEdited = localUpdatedDate && localUpdatedDate !== comment.created_date;

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2);
    };

    const timeAgo = (date) => {
        try { 
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: language === 'ar' ? ar : enUS }); 
        } catch { 
            return ''; 
        }
    };

    const avatarColors = [
        'from-violet-500 to-purple-600', 
        'from-blue-500 to-cyan-500', 
        'from-green-500 to-emerald-600', 
        'from-orange-400 to-pink-500', 
        'from-rose-400 to-red-500'
    ];
    const colorIdx = comment.author_name ? comment.author_name.charCodeAt(0) % avatarColors.length : 0;

    const handleLike = async () => {
        if (!userEmail) return;
        const newLikes = hasLiked ? localLikes.filter(e => e !== userEmail) : [...localLikes, userEmail];
        setLocalLikes(newLikes);
        await backend.entities.PostComment.update(comment.id, { likes: newLikes });
    };

    const handleReport = async () => {
        if (!userEmail) return;
        setShowReportConfirm(false);
        try {
            const currentReports = comment.reports || [];
            if (currentReports.includes(userEmail)) { setReported(true); return; }
            await backend.entities.PostComment.update(comment.id, {
                reports: [...currentReports, userEmail],
                report_reasons: [...(comment.report_reasons || []), (language === 'ar' ? 'إبلاغ من مستخدم' : 'User report')],
            });
            setReported(true);
        } catch (error) {
            console.error('Failed to report comment:', error);
        }
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        setSubmitting(true);
        await backend.entities.PostComment.update(comment.id, { content: editText.trim() });
        setLocalContent(editText.trim());
        setLocalUpdatedDate(new Date().toISOString());
        setIsEditing(false);
        setSubmitting(false);
        onCommentUpdated?.({ ...comment, content: editText.trim() });
    };

    const handleDelete = async () => {
        await backend.entities.PostComment.delete(comment.id);
        onCommentDeleted?.(comment.id);
    };

    const submitReply = async () => {
        if (!replyText.trim() || !currentUser) return;
        setSubmitting(true);
        const newReply = await backend.entities.PostComment.create({
            post_id: comment.post_id,
            parent_comment_id: comment.id,
            content: replyText.trim(),
            author_name: currentUser.full_name,
            author_email: currentUser.email,
            author_avatar_url: currentUser.avatar_url || null,
            likes: [],
        });
        setReplyText('');
        setShowReplyInput(false);
        setShowReplies(true);
        onCommentAdded(newReply);
        setSubmitting(false);
    };

    const submitOwnerReply = async () => {
        if (!ownerReplyText.trim() || !currentUser) return;
        setSubmitting(true);
        const newReply = await backend.entities.PostComment.create({
            post_id: comment.post_id,
            parent_comment_id: comment.id,
            content: ownerReplyText.trim(),
            author_name: currentUser.full_name,
            author_email: currentUser.email,
            author_avatar_url: currentUser.avatar_url || null,
            likes: [],
        });
        setOwnerReplyText('');
        setShowOwnerReply(false);
        setShowReplies(true);
        onCommentAdded(newReply);
        setSubmitting(false);
    };

    if (reported) return null;

    return (
        <div 
            className={`animate-in fade-in duration-200 ${
                depth > 0 
                ? (dir === 'rtl' ? 'mr-4 pr-3 border-r border-gray-100' : 'ml-4 pl-3 border-l border-gray-100') 
                : ''
            }`} 
            dir={dir}
        >
            <div className="flex gap-2.5 group mt-3">
                <Avatar className={`flex-shrink-0 shadow-xs ${depth > 0 ? 'h-7 w-7' : 'h-8 w-8'}`}>
                    <AvatarImage src={userAvatars[comment.author_email] || comment.author_avatar_url} />
                    <AvatarFallback className={`bg-gradient-to-br ${avatarColors[colorIdx]} text-white font-bold ${depth > 0 ? 'text-[10px]' : 'text-xs'}`}>
                        {getInitials(comment.author_name)}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    {/* الفقاعة الخاصة بالتعليق */}
                    <div className="bg-gray-50/80 hover:bg-gray-50 transition-colors rounded-2xl px-3.5 py-2 border border-gray-100/50">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-gray-900">{comment.author_name}</p>
                            
                            {/* التحكم بالتعليق (تعديل / حذف) لصاحب التعليق */}
                            {isCommentOwner && !isEditing && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                    <button 
                                        onClick={() => { setIsEditing(true); setEditText(localContent); }} 
                                        className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white shadow-xs transition-all"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    
                                    {showDeleteConfirm ? (
                                        <div className="flex items-center gap-1.5 bg-white border border-red-100 rounded-lg px-1.5 py-0.5 shadow-xs animate-in zoom-in-95 duration-100">
                                            <span className="text-[10px] font-bold text-red-500">{language === 'ar' ? 'حذف؟' : 'Delete?'}</span>
                                            <button onClick={handleDelete} className="text-[10px] font-bold text-red-600 hover:scale-110 transition-transform">✓</button>
                                            <button onClick={() => setShowDeleteConfirm(false)} className="text-[10px] font-bold text-gray-400 hover:scale-110 transition-transform">✕</button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setShowDeleteConfirm(true)} 
                                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white shadow-xs transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* محتوى النص أو حقل التعديل الإدخالي */}
                        {isEditing ? (
                            <div className="flex gap-1.5 mt-1.5 animate-in fade-in duration-150">
                                <input
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                                    className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-1 text-xs focus:outline-none focus:border-blue-500 text-right"
                                    autoFocus
                                />
                                <button onClick={handleEdit} disabled={submitting} className="p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-xs">
                                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 shadow-xs">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="mt-0.5">
                                <p className="text-xs text-gray-700 leading-relaxed break-words text-right">{localContent}</p>
                                {wasEdited && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 italic">
                                        {language === 'ar' ? `• تم التعديل ${timeAgo(localUpdatedDate)}` : `• edited ${timeAgo(localUpdatedDate)}`}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* سطر التفاعلات والإجراءات سفلي الفقاعة */}
                    <div className="flex items-center gap-3 mt-1 px-1 flex-wrap text-right">
                        <span className="text-[10px] text-gray-400 font-medium">{timeAgo(comment.created_date)}</span>

                        <button 
                            onClick={handleLike} 
                            className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${hasLiked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                        >
                            <ThumbsUp className="w-3 h-3" />
                            {localLikes.length > 0 && <span className="text-[10px]">{localLikes.length}</span>}
                            {t('likeComment')}
                        </button>

                        {depth < 2 && currentUser && (
                            <button 
                                onClick={() => { setShowReplyInput(v => !v); setShowOwnerReply(false); }} 
                                className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${showReplyInput ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                            >
                                <CornerDownRight className="w-3 h-3" />
                                {t('reply')}
                            </button>
                        )}

                        {isPostOwner && currentUser && !isCommentOwner && depth === 0 && (
                            <button 
                                onClick={() => { setShowOwnerReply(v => !v); setShowReplyInput(false); }} 
                                className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${showOwnerReply ? 'text-blue-600' : 'text-blue-500 hover:text-blue-600'}`}
                            >
                                <MessageCircle className="w-3 h-3" />
                                <span>{language === 'ar' ? 'رد كصاحب المنشور' : 'Reply as owner'}</span>
                            </button>
                        )}

                        {currentUser && !isCommentOwner && (
                            showReportConfirm ? (
                                <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 shadow-xs animate-in zoom-in-95 duration-100">
                                    <span className="text-[10px] font-bold text-orange-600">{language === 'ar' ? 'إبلاغ؟' : 'Report?'}</span>
                                    <button onClick={handleReport} className="text-[10px] font-bold text-orange-600">✓</button>
                                    <button onClick={() => setShowReportConfirm(false)} className="text-[10px] font-bold text-gray-400">✕</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setShowReportConfirm(true)} 
                                    className="text-[11px] text-gray-300 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                                >
                                    <Flag className="w-3 h-3" />
                                </button>
                            )
                        )}
                    </div>

                    {/* حقل رد صاحب المنشور الأصلي */}
                    {showOwnerReply && (
                        <div className="flex gap-2 mt-2 animate-in slide-in-from-top-2 duration-150">
                            <input 
                                value={ownerReplyText} 
                                onChange={e => setOwnerReplyText(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && submitOwnerReply()} 
                                placeholder={language === 'ar' ? 'اكتب ردك كصاحب للمنشور...' : 'Reply as post owner...'} 
                                className="flex-1 bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 text-right" 
                                autoFocus 
                            />
                            <button 
                                onClick={submitOwnerReply} 
                                disabled={submitting || !ownerReplyText.trim()} 
                                className="p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* حقل الرد العادي */}
                    {showReplyInput && (
                        <div className="flex gap-2 mt-2 animate-in slide-in-from-top-2 duration-150">
                            <input 
                                value={replyText} 
                                onChange={e => setReplyText(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && submitReply()} 
                                placeholder={t('writeReply')} 
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 text-right" 
                                autoFocus 
                            />
                            <button 
                                onClick={submitReply} 
                                disabled={submitting || !replyText.trim()} 
                                className="p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* زر استعراض / إخفاء الردود الفرعية */}
                    {replies.length > 0 && (
                        <button 
                            onClick={() => setShowReplies(v => !v)} 
                            className="mt-2 text-xs text-blue-600 font-bold flex items-center gap-1 hover:text-blue-700 transition-colors"
                        >
                            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{replies.length}</span>
                            <span>{t('replies')}</span>
                        </button>
                    )}

                    {/* عرض قائمة الردود الفرعية داخل هذا التعليق */}
                    {showReplies && replies.length > 0 && (
                        <div className="mt-1 space-y-1">
                            {replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    currentUser={currentUser}
                                    depth={depth + 1}
                                    allComments={allComments}
                                    onCommentAdded={onCommentAdded}
                                    onCommentUpdated={onCommentUpdated}
                                    onCommentDeleted={onCommentDeleted}
                                    isPostOwner={isPostOwner}
                                    userAvatars={userAvatars}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
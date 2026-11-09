import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Clock,
  Calendar,
  Check,
  Send,
  Trash2,
  ThumbsUp,
  Flag,
  UserPlus,
  UserCheck,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';
import { Blog, Comment, PageRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getBlogById,
  toggleLike,
  toggleBookmark,
  isBlogLikedByUser,
  isBlogBookmarkedByUser,
  incrementBlogViews,
  subscribeToPublishedBlogs,
  deleteBlog,
} from '../../services/blogService';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import {
  subscribeToBlogComments,
  addComment,
  deleteComment,
  likeComment,
  toggleFollow,
  isFollowingUser,
  createNotification,
  submitContentReport,
} from '../../services/socialService';

interface BlogReadingPageProps {
  blogId: string;
  onNavigate: (route: PageRoute) => void;
}

export const BlogReadingPage: React.FC<BlogReadingPageProps> = ({ blogId, onNavigate }) => {
  const { user, profile, isAdmin } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // Social interactions state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt?: string } | null>(null);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Reading progress bar
  const [scrollProgress, setScrollProgress] = useState(0);

  // Deletion modals state
  const [showDeleteBlogModal, setShowDeleteBlogModal] = useState(false);
  const [isDeletingBlog, setIsDeletingBlog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; authorName: string } | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // Load blog & view count
  useEffect(() => {
    let isMounted = true;
    getBlogById(blogId).then((data) => {
      if (isMounted) {
        setBlog(data);
        if (data) {
          setLikesCount(data.likesCount || 0);
          incrementBlogViews(data.id);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [blogId]);

  // Check like, bookmark, follow status
  useEffect(() => {
    if (!user || !blog) return;
    isBlogLikedByUser(blog.id, user.uid).then(setLiked);
    isBlogBookmarkedByUser(blog.id, user.uid).then(setBookmarked);
    isFollowingUser(user.uid, blog.authorId).then(setIsFollowing);
  }, [blog, user]);

  // Comments subscription
  useEffect(() => {
    const unsub = subscribeToBlogComments(blogId, (list) => {
      setComments(list);
    });
    return () => unsub();
  }, [blogId]);

  // Related blogs
  useEffect(() => {
    if (!blog) return;
    const unsub = subscribeToPublishedBlogs((all) => {
      const related = all
        .filter((b) => b.id !== blog.id && b.category === blog.category)
        .slice(0, 3);
      setRelatedBlogs(related);
    });
    return () => unsub();
  }, [blog]);

  // Scroll Progress listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleLike = async () => {
    if (!user) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    if (!blog) return;

    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      await toggleLike(blog.id, user.uid, async () => {
        if (!prevLiked && blog.authorId !== user.uid) {
          await createNotification({
            recipientId: blog.authorId,
            senderId: user.uid,
            senderName: profile?.fullName || 'A reader',
            senderPhotoURL: profile?.photoURL,
            type: 'like',
            blogId: blog.id,
            blogTitle: blog.title,
          });
        }
      });
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    if (!blog) return;
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      await toggleBookmark(blog.id, user.uid);
    } catch {
      setBookmarked(prev);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profile || !blog) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      await toggleFollow(
        { id: user.uid, name: profile.fullName, photoURL: profile.photoURL },
        blog.authorId
      );
    } catch {
      setIsFollowing(prev);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !blog) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(
        blog.id,
        {
          id: user.uid,
          name: profile.fullName,
          username: profile.username,
          photoURL: profile.photoURL,
        },
        commentText.trim(),
        replyToId,
        async () => {
          if (blog.authorId !== user.uid) {
            await createNotification({
              recipientId: blog.authorId,
              senderId: user.uid,
              senderName: profile.fullName,
              senderPhotoURL: profile.photoURL,
              type: replyToId ? 'reply' : 'comment',
              blogId: blog.id,
              blogTitle: blog.title,
            });
          }
        }
      );
      setCommentText('');
      setReplyToId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleConfirmDeleteBlog = async () => {
    if (!blog || !user) return;
    setIsDeletingBlog(true);
    try {
      await deleteBlog(blog.id, blog.authorId);
      setShowDeleteBlogModal(false);
      onNavigate({ type: 'dashboard' });
    } catch (err) {
      console.error('Failed to delete story:', err);
    } finally {
      setIsDeletingBlog(false);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete || !blog) return;
    setIsDeletingComment(true);
    try {
      await deleteComment(commentToDelete.id, blog.id);
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setCommentToDelete(null);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !blog) return;
    try {
      await submitContentReport(
        { id: user.uid, name: profile.fullName },
        'blog',
        blog.id,
        blog.title,
        reportReason.trim()
      );
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason('');
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ambient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono-code">Opening article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-ambient-mesh flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md border border-white/10">
          <h2 className="font-editorial text-2xl font-bold text-white mb-2">Article Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            This story may have been removed or set to private draft by its author.
          </p>
          <button
            onClick={() => onNavigate({ type: 'dashboard' })}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-ambient-mesh pb-32 relative">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-amber-300 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating Back Button & Quick Actions Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Author or Admin edit and delete triggers */}
          {(user?.uid === blog.authorId || isAdmin) && (
            <>
              <button
                onClick={() => onNavigate({ type: 'write', editBlogId: blog.id })}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/25 transition-all"
              >
                Edit Story
              </button>
              <button
                onClick={() => setShowDeleteBlogModal(true)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 flex items-center gap-1.5 transition-all"
                title="Delete this story"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
            title="Flag or report content"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Reading Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Category Pill */}
        <div className="mb-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-mono-code uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 tracking-wider">
            {blog.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-editorial text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.15] mb-6">
          {blog.title}
        </h1>

        {/* Subtitle / Excerpt */}
        {blog.excerpt && (
          <p className="text-lg sm:text-xl text-slate-300 font-light leading-relaxed mb-8 italic border-l-2 border-cyan-400 pl-4 py-1">
            {blog.excerpt}
          </p>
        )}

        {/* Author Details Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            onClick={() => onNavigate({ type: 'profile', userId: blog.authorId })}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <img
              src={
                blog.authorPhotoURL ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${blog.authorId}`
              }
              alt={blog.authorName}
              className="w-12 h-12 rounded-full object-cover border border-cyan-400/50 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                  {blog.authorName}
                </span>
                <span className="text-xs text-slate-400 font-mono-code">@{blog.authorUsername}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-code mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {blog.readTimeMinutes || 5} min read
                </span>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          {user && user.uid !== blog.authorId && (
            <button
              onClick={handleToggleFollow}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto ${
                isFollowing
                  ? 'bg-slate-800 text-slate-300 border border-white/10 hover:border-rose-500/40 hover:text-rose-400'
                  : 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-md shadow-cyan-400/20 hover:scale-105'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow Author</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Full Uncropped Cover Image */}
        {blog.coverImage && (
          <div className="rounded-3xl overflow-hidden mb-12 shadow-2xl border border-white/10 bg-slate-950/80 backdrop-blur-md relative group flex flex-col items-center justify-center p-2 sm:p-3">
            <img
              src={blog.coverImage}
              alt={blog.title}
              onClick={() => setLightboxImage({ url: blog.coverImage!, alt: blog.title })}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl mx-auto cursor-pointer transition-transform duration-300 hover:scale-[1.008]"
              title="Click to view full image"
            />
            <button
              onClick={() => setLightboxImage({ url: blog.coverImage!, alt: blog.title })}
              className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-mono-code opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 backdrop-blur-md border border-white/15 shadow-lg"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full View</span>
            </button>
          </div>
        )}

        {/* Article Body */}
        <div className="text-slate-200 text-lg sm:text-xl font-light leading-[1.8] space-y-6 select-text">
          {blog.content.split('\n\n').map((paragraph, idx) => {
            // Heading check
            if (paragraph.startsWith('## ')) {
              return (
                <h2
                  key={idx}
                  className="font-editorial text-2xl sm:text-3xl font-bold text-white mt-10 mb-4 pt-4 border-t border-white/5"
                >
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3
                  key={idx}
                  className="font-editorial text-xl sm:text-2xl font-bold text-cyan-200 mt-8 mb-3"
                >
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote
                  key={idx}
                  className="p-5 my-6 rounded-2xl glass-panel border-l-4 border-amber-300 text-slate-200 italic font-editorial text-xl"
                >
                  {paragraph.replace('> ', '')}
                </blockquote>
              );
            }

            // Embedded article image match: ![caption](url)
            const imgMatch = paragraph.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (imgMatch) {
              const alt = imgMatch[1];
              const src = imgMatch[2];
              return (
                <figure
                  key={idx}
                  className="my-8 rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl bg-slate-950/80 group"
                >
                  <div className="relative flex items-center justify-center p-2 sm:p-3">
                    <img
                      src={src}
                      alt={alt || 'Article illustration'}
                      loading="lazy"
                      onClick={() => setLightboxImage({ url: src, alt: alt || 'Story illustration' })}
                      className="w-full h-auto max-h-[85vh] object-contain rounded-2xl mx-auto cursor-pointer transition-transform duration-300 hover:scale-[1.008]"
                      title="Click to view full image"
                    />
                    <button
                      onClick={() => setLightboxImage({ url: src, alt: alt || 'Story illustration' })}
                      className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-mono-code opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 backdrop-blur-md border border-white/15"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Full View</span>
                    </button>
                  </div>
                  {alt && (
                    <figcaption className="p-3 text-center text-xs text-slate-400 font-mono-code bg-slate-950/90 border-t border-white/5">
                      {alt}
                    </figcaption>
                  )}
                </figure>
              );
            }

            return (
              <p key={idx} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-2">
            {blog.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl text-xs font-mono-code bg-slate-900/80 border border-white/10 text-cyan-300"
              >
                #{t.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}

        {/* Floating / Sticky Interaction Bar */}
        <div className="sticky bottom-6 z-30 mt-12 py-3 px-6 glass-panel rounded-2xl border border-white/15 flex items-center justify-between shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            {/* Like */}
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                liked
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-300 hover:text-rose-400 hover:bg-white/5'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span className="font-mono-code text-xs font-bold">{likesCount}</span>
            </button>

            {/* Comment Scroll */}
            <a
              href="#comments-section"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/5 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-mono-code text-xs font-bold">{comments.length}</span>
            </a>

            {/* Bookmark */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl transition-all ${
                bookmarked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-mono-code">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-mono-code hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Author Bio Box */}
        <div className="mt-16 glass-card-gold p-6 sm:p-8 rounded-3xl border border-amber-300/20 flex flex-col sm:flex-row items-center gap-6">
          <img
            src={
              blog.authorPhotoURL ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${blog.authorId}`
            }
            alt={blog.authorName}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-300/40 shrink-0"
          />
          <div className="text-center sm:text-left flex-1">
            <span className="text-[10px] uppercase font-mono-code tracking-widest text-amber-300">
              Written by
            </span>
            <h3 className="font-editorial text-2xl font-bold text-white mt-0.5">
              {blog.authorName}
            </h3>
            <p className="text-xs text-cyan-400/90 font-mono-code mb-2">@{blog.authorUsername}</p>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Contributing author on Soumil’s Blog dedicated to deep perspective and long-form storytelling.
            </p>
          </div>
          <button
            onClick={() => onNavigate({ type: 'profile', userId: blog.authorId })}
            className="px-4 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white"
          >
            View Profile
          </button>
        </div>

        {/* Comments Section */}
        <section id="comments-section" className="mt-16 pt-10 border-t border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h3 className="font-editorial text-2xl font-bold text-white">
                Discussions ({comments.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono-code">Respectful discourse only</span>
          </div>

          {/* Add Comment Box */}
          {user ? (
            <form onSubmit={handleAddComment} className="glass-panel p-4 rounded-2xl border border-white/10 mb-8">
              {replyToId && (
                <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-950/60 text-xs text-cyan-300">
                  <span>Replying to comment...</span>
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel ×
                  </button>
                </div>
              )}

              <textarea
                rows={3}
                required
                placeholder="What are your thoughts on this story? Add to the discussion..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none font-light"
              />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[11px] text-slate-500 font-mono-code">
                  Commenting as <strong>{profile?.fullName}</strong>
                </span>
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl glass-panel border border-white/10 text-center mb-8">
              <p className="text-sm text-slate-300 mb-3">Sign in to participate in the conversation.</p>
              <button
                onClick={() => onNavigate({ type: 'auth', mode: 'login' })}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
              >
                Sign In to Comment
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No comments yet. Start the conversation!
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl glass-panel border border-white/5 ${
                    c.parentCommentId ? 'ml-6 border-l-2 border-cyan-400/40 bg-slate-900/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          c.authorPhotoURL ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${c.authorId}`
                        }
                        alt={c.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{c.authorName}</h4>
                        <span className="text-[10px] text-slate-500 font-mono-code">
                          @{c.authorUsername} •{' '}
                          {new Date(c.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {(user?.uid === c.authorId || isAdmin) && (
                      <button
                        onClick={() => setCommentToDelete({ id: c.id, authorName: c.authorName })}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-light whitespace-pre-wrap pl-10">
                    {c.content}
                  </p>

                  <div className="flex items-center gap-4 pl-10 mt-3 pt-2 border-t border-white/5">
                    <button
                      onClick={() => likeComment(c.id)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{c.likesCount || 0}</span>
                    </button>

                    <button
                      onClick={() => {
                        setReplyToId(c.id);
                        const el = document.getElementById('comments-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related Stories */}
        {relatedBlogs.length > 0 && (
          <section className="mt-20 pt-10 border-t border-white/10">
            <h3 className="font-editorial text-2xl font-bold text-white mb-6">
              More in {blog.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedBlogs.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    onNavigate({ type: 'read', blogId: r.id });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-400/40 cursor-pointer transition-all group"
                >
                  {r.coverImage && (
                    <div className="h-28 rounded-xl overflow-hidden mb-3 bg-slate-900">
                      <img
                        src={r.coverImage}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <h4 className="font-editorial text-sm font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">
                    {r.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono-code mt-2">
                    {r.readTimeMinutes || 4} min read
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Content Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl border border-white/15 max-w-md w-full animate-in zoom-in-95 duration-150">
            <h3 className="font-editorial text-xl font-bold text-white mb-2">Report Content</h3>
            <p className="text-xs text-slate-400 mb-4">
              Our moderation team reviews reported blogs and comments to maintain quality and safety.
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs text-center">
                Report received. Thank you for helping keep our community clean.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Reason for report</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe why this content violates community standards..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Full Resolution Image Viewer Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/92 backdrop-blur-xl animate-in fade-in duration-200 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 shadow-xl"
            aria-label="Close full image"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-[96vw] max-h-[96vh] flex flex-col items-center justify-center cursor-default"
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt || 'Full Resolution Image'}
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none bg-slate-950"
            />
            {lightboxImage.alt && (
              <p className="mt-3 text-center text-xs text-slate-300 font-mono-code bg-black/75 px-5 py-2 rounded-full border border-white/10 shadow-lg">
                {lightboxImage.alt}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete Story Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteBlogModal}
        title="Delete Story?"
        itemTitle={blog.title}
        description="Are you sure you want to permanently delete this story? This will remove all associated comments and metrics."
        isDeleting={isDeletingBlog}
        onConfirm={handleConfirmDeleteBlog}
        onCancel={() => setShowDeleteBlogModal(false)}
      />

      {/* Delete Comment Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!commentToDelete}
        title="Delete Comment?"
        itemTitle={commentToDelete ? `Comment by ${commentToDelete.authorName}` : undefined}
        description="Are you sure you want to delete this comment? This action cannot be undone."
        isDeleting={isDeletingComment}
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};

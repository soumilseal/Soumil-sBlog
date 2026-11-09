import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Clock,
  Tag,
  Check,
  Eye,
} from 'lucide-react';
import { Blog, PageRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  toggleLike,
  toggleBookmark,
  isBlogLikedByUser,
  isBlogBookmarkedByUser,
} from '../../services/blogService';
import { createNotification } from '../../services/socialService';

interface BlogCardProps {
  blog: Blog;
  onNavigate: (route: PageRoute) => void;
  featured?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog, onNavigate, featured = false }) => {
  const { user, profile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(blog.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      isBlogLikedByUser(blog.id, user.uid).then((res) => {
        if (isMounted) setLiked(res);
      });
      isBlogBookmarkedByUser(blog.id, user.uid).then((res) => {
        if (isMounted) setBookmarked(res);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [blog.id, user]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

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
      // Revert optimistic update
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    const prevBookmarked = bookmarked;
    setBookmarked(!prevBookmarked);

    try {
      await toggleBookmark(blog.id, user.uid);
    } catch {
      setBookmarked(prevBookmarked);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      onClick={() => onNavigate({ type: 'read', blogId: blog.id })}
      className={`group cursor-pointer rounded-3xl glass-panel border border-white/10 overflow-hidden transition-all duration-300 hover:border-cyan-400/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col ${
        featured ? 'md:grid md:grid-cols-12 md:max-h-[300px]' : ''
      }`}
    >
      {/* Cover Image */}
      {blog.coverImage && (
        <div
          className={`relative overflow-hidden bg-slate-950 flex items-center justify-center ${
            featured
              ? 'md:col-span-5 h-52 sm:h-60 md:h-full md:max-h-[300px]'
              : 'h-48 sm:h-52 w-full shrink-0'
          }`}
        >
          {/* Subtle blurred ambient backdrop so non-standard aspect ratio images blend seamlessly */}
          <div
            className="absolute inset-0 bg-cover bg-center blur-xl opacity-35 scale-110"
            style={{ backgroundImage: `url(${blog.coverImage})` }}
          />

          <img
            src={blog.coverImage}
            alt={blog.title}
            loading="lazy"
            className="relative z-10 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#060911]/90 via-[#060911]/25 to-transparent pointer-events-none md:bg-gradient-to-r md:from-transparent md:to-[#060911]/40" />

          {/* Category Badge overlay */}
          <div className="absolute top-3.5 left-3.5 z-20">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono-code font-semibold tracking-wider uppercase bg-slate-950/85 backdrop-blur-md text-cyan-300 border border-cyan-400/30 shadow-lg">
              {blog.category}
            </span>
          </div>
        </div>
      )}

      {/* Content Body */}
      <div
        className={`p-5 sm:p-6 flex-1 flex flex-col justify-between overflow-hidden ${
          featured ? 'md:col-span-7' : ''
        }`}
      >
        <div>
          {/* Author Header */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onNavigate({ type: 'profile', userId: blog.authorId });
            }}
            className="flex items-center gap-3 mb-4 group/author hover:opacity-90 transition-opacity"
          >
            <img
              src={
                blog.authorPhotoURL ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${blog.authorId}`
              }
              alt={blog.authorName}
              className="w-10 h-10 rounded-full object-cover border border-cyan-400/40 group-hover/author:border-cyan-300 transition-colors"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white group-hover/author:text-cyan-300 transition-colors truncate">
                {blog.authorName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
                <span>@{blog.authorUsername}</span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* If no cover image was provided, display category badge here */}
          {!blog.coverImage && (
            <div className="mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                {blog.category}
              </span>
            </div>
          )}

          {/* Blog Title */}
          <h3 className="font-editorial text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-2 leading-tight mb-3">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4 font-light">
            {blog.excerpt}
          </p>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {blog.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-slate-400 font-mono-code px-2 py-0.5 rounded-md bg-white/5 border border-white/5"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Read time & Interactive buttons */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{blog.readTimeMinutes || 4} min read</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Like */}
            <button
              onClick={handleLikeClick}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs ${
                liked
                  ? 'text-rose-400 bg-rose-500/15'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
              }`}
              title="Like this blog"
              aria-label="Like"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current scale-110' : ''}`} />
              <span className="font-mono-code text-[11px]">{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate({ type: 'read', blogId: blog.id });
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs"
              title="Comments"
              aria-label="Comments"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-mono-code text-[11px]">{blog.commentsCount || 0}</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmarkClick}
              className={`p-2 rounded-xl transition-all ${
                bookmarked
                  ? 'text-amber-300 bg-amber-500/15'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
              }`}
              title="Save to bookmarks"
              aria-label="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShareClick}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
              title="Share article"
              aria-label="Share"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

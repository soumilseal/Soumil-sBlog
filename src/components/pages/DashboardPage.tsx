import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Filter,
  ArrowUpDown,
  Calendar,
  PenSquare,
  TrendingUp,
  Compass,
  Users,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Blog, PageRoute } from '../../types';
import { subscribeToPublishedBlogs, seedInitialBlogsIfEmpty } from '../../services/blogService';
import { BlogCard } from '../blog/BlogCard';
import { BRANDING } from '../../config/branding';
import { useAuth } from '../../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (route: PageRoute) => void;
}

type SortOption = 'newest' | 'oldest' | 'popular' | 'liked' | 'discussed';
type DateFilterOption = 'all' | 'today' | '7days' | '30days' | '90days';

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to real-time blogs
  useEffect(() => {
    let unsub: (() => void) | undefined;
    seedInitialBlogsIfEmpty().then(() => {
      unsub = subscribeToPublishedBlogs(
        (list) => {
          setBlogs(list);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Filter and sort blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      // 1. Category filter
      if (selectedCategory !== 'all' && blog.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 2. Search query (title, author, tags, content)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = blog.title.toLowerCase().includes(q);
        const matchesAuthor = blog.authorName.toLowerCase().includes(q) || blog.authorUsername.toLowerCase().includes(q);
        const matchesTags = blog.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesExcerpt = blog.excerpt?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesTags && !matchesExcerpt) {
          return false;
        }
      }

      // 3. Date filter
      if (dateFilter !== 'all') {
        const blogDate = new Date(blog.createdAt).getTime();
        const now = Date.now();
        const oneDay = 1000 * 60 * 60 * 24;

        if (dateFilter === 'today' && now - blogDate > oneDay) return false;
        if (dateFilter === '7days' && now - blogDate > oneDay * 7) return false;
        if (dateFilter === '30days' && now - blogDate > oneDay * 30) return false;
        if (dateFilter === '90days' && now - blogDate > oneDay * 90) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'popular') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (sortBy === 'liked') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortBy === 'discussed') {
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      }
      return 0;
    });
  }, [blogs, selectedCategory, searchQuery, dateFilter, sortBy]);

  // Featured blog (the top blog with cover image)
  const featuredBlog = useMemo(() => {
    return filteredBlogs.find((b) => b.coverImage) || filteredBlogs[0];
  }, [filteredBlogs]);

  // Remaining blogs
  const standardBlogs = useMemo(() => {
    if (!featuredBlog) return [];
    return filteredBlogs.filter((b) => b.id !== featuredBlog.id);
  }, [filteredBlogs, featuredBlog]);

  return (
    <div className="min-h-screen bg-ambient-mesh pb-24">
      {/* Top Banner / Feed Greeting */}
      <section className="px-4 sm:px-8 pt-8 pb-6 max-w-7xl mx-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono-code mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Editorial Community Feed</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Welcome, {profile?.fullName?.split(' ')[0] || 'Writer'}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 font-light">
              Explore long-form essays, technical treatises, and artistic prose curated from thinkers across the globe.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate({ type: 'write' })}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <PenSquare className="w-4 h-4" />
              <span>Publish a Story</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area: Categories & Filters & Feed */}
      <main className="px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          {BRANDING.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-amber-500/20 text-white border border-cyan-400/40 shadow-sm'
                  : 'glass-panel text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Toolbar: Search, Sort & Date Filters */}
        <div className="mt-4 mb-8 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword, title, author or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Sorting */}
            <div className="flex items-center gap-2 glass-panel px-3 py-2 rounded-xl border border-white/5">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-slate-900 text-white">Newest First</option>
                <option value="oldest" className="bg-slate-900 text-white">Oldest First</option>
                <option value="popular" className="bg-slate-900 text-white">Most Popular (Views)</option>
                <option value="liked" className="bg-slate-900 text-white">Most Liked</option>
                <option value="discussed" className="bg-slate-900 text-white">Most Discussed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 glass-panel px-3 py-2 rounded-xl border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Time</option>
                <option value="today" className="bg-slate-900 text-white">Today</option>
                <option value="7days" className="bg-slate-900 text-white">Last 7 Days</option>
                <option value="30days" className="bg-slate-900 text-white">Last 30 Days</option>
                <option value="90days" className="bg-slate-900 text-white">Last 3 Months</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-mono-code">Loading editorial library...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 glass-panel rounded-3xl p-8 text-center border border-white/10 max-w-lg mx-auto">
            <Compass className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-80" />
            <h3 className="font-editorial text-2xl font-bold text-white mb-2">No Stories Found</h3>
            <p className="text-slate-400 text-sm mb-6">
              There are no published stories matching your current filters. Be the first to share your thoughts in this category!
            </p>
            <button
              onClick={() => onNavigate({ type: 'write' })}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
            >
              Write First Story
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Post Card (Hero blog) */}
            {featuredBlog && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-xs uppercase font-mono-code tracking-widest text-cyan-400 font-semibold">
                    Featured Editorial
                  </h3>
                </div>
                <BlogCard blog={featuredBlog} onNavigate={onNavigate} featured={true} />
              </div>
            )}

            {/* Grid of standard blogs */}
            {standardBlogs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-xs uppercase font-mono-code tracking-widest text-slate-400 font-semibold">
                      Community Prose & Essays ({standardBlogs.length})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {standardBlogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

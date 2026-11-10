import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Tag,
  ArrowRight,
  BookOpen,
  Cpu,
  Feather,
  Palette,
  Rocket,
  Flame,
  Globe,
  PenSquare,
  Layers,
} from 'lucide-react';
import { Blog, PageRoute, UserProfile } from '../../types';
import { subscribeToPublishedBlogs } from '../../services/blogService';
import { getAllUsers } from '../../services/socialService';
import { BlogCard } from '../blog/BlogCard';
import { BRANDING } from '../../config/branding';

interface ExplorePageProps {
  onNavigate: (route: PageRoute) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [authors, setAuthors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'authors' | 'tags'>('stories');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToPublishedBlogs((list) => {
      setBlogs(list);
      setLoading(false);
    });

    getAllUsers().then((userList) => {
      setAuthors(userList);
    }).catch(() => {});

    return () => unsub();
  }, []);

  // Compute all unique tags
  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();
    blogs.forEach((b) => {
      b.tags?.forEach((t) => {
        const clean = t.replace(/^#/, '').trim();
        if (clean) map.set(clean, (map.get(clean) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [blogs]);

  // Ranking formula calculation for Explore
  // Score = (likesCount * 2) + (commentsCount * 3) + (bookmarksCount * 4) + (log(viewsCount + 1) * 0.5) + freshnessBoost
  const computeBlogScore = (b: Blog, now: number): number => {
    const likes = b.likesCount || 0;
    const comments = b.commentsCount || 0;
    const bookmarks = b.bookmarksCount || 0;
    const views = b.viewsCount || 0;

    const baseScore =
      likes * 2 +
      comments * 3 +
      bookmarks * 4 +
      Math.log(views + 1) * 0.5;

    // Freshness boost: Give new publications high visibility even with 0 initial engagement
    const createdTime = new Date(b.createdAt).getTime();
    const hoursSinceCreation = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

    let freshnessBoost = 0;
    if (hoursSinceCreation < 12) {
      // First 12 hours: Strong boost (+15 down to +10)
      freshnessBoost = 15 - (hoursSinceCreation / 12) * 5;
    } else if (hoursSinceCreation < 48) {
      // 12 - 48 hours: Moderate boost (+10 down to +4)
      freshnessBoost = 10 - ((hoursSinceCreation - 12) / 36) * 6;
    } else if (hoursSinceCreation < 168) {
      // 2 - 7 days: Gentle recency incentive (+4 down to 0)
      freshnessBoost = 4 - ((hoursSinceCreation - 48) / 120) * 4;
    }

    return baseScore + Math.max(0, freshnessBoost);
  };

  // Filtered and ranked stories
  const filteredBlogs = React.useMemo(() => {
    // 1. Filter matching active tag, active category, or search query
    const filtered = blogs.filter((b) => {
      if (activeCategory) {
        const matchesCategory =
          b.category?.toLowerCase() === activeCategory.toLowerCase() ||
          b.category?.toLowerCase().replace(/\s+/g, '-') === activeCategory.toLowerCase();
        if (!matchesCategory) return false;
      }
      if (activeTag) {
        return b.tags?.some((t) => t.replace(/^#/, '').toLowerCase() === activeTag.toLowerCase());
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // 2. If user is actively searching, preserve direct relevance (newest first for matches)
    if (search.trim()) {
      return [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // 3. Otherwise rank by Engagement Score + Freshness Boost with tie-breaker and author diversity
    const now = Date.now();
    const scored = filtered.map((blog) => ({
      blog,
      score: computeBlogScore(blog, now),
      createdAtMs: new Date(blog.createdAt).getTime(),
    }));

    // Sort descending by score, tie-break with newest publication date
    scored.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.001) {
        return b.score - a.score;
      }
      return b.createdAtMs - a.createdAtMs;
    });

    // 4. Author diversity: Prevent 3+ consecutive articles from the exact same author
    // Interleave diverse authors gracefully without sacrificing top ranking
    const result: Blog[] = [];
    const pool = [...scored];

    while (pool.length > 0) {
      const lastAuthorId = result.length > 0 ? result[result.length - 1].authorId : null;
      const secondLastAuthorId = result.length > 1 ? result[result.length - 2].authorId : null;

      // Check if top item causes 3 consecutive posts by same author
      if (
        lastAuthorId &&
        secondLastAuthorId &&
        lastAuthorId === secondLastAuthorId &&
        pool[0].blog.authorId === lastAuthorId
      ) {
        // Find next highest-ranked blog by a different author within reasonable range
        const nextDiffIndex = pool.findIndex((item) => item.blog.authorId !== lastAuthorId);
        if (nextDiffIndex !== -1 && nextDiffIndex <= 4) {
          result.push(pool.splice(nextDiffIndex, 1)[0].blog);
          continue;
        }
      }

      // Default: take highest ranked
      result.push(pool.shift()!.blog);
    }

    return result;
  }, [blogs, search, activeTag, activeCategory]);

  // Reset to All Stories tab whenever Explore is navigated to
  useEffect(() => {
    setActiveTab('stories');
    setActiveTag(null);
    setActiveCategory(null);
  }, []);

  // Filtered genuine published authors (strictly users who have at least one genuinely published blog)
  const publishedAuthorIds = React.useMemo(() => {
    const ids = new Set<string>();
    blogs.forEach((b) => {
      if (b.authorId) ids.add(b.authorId);
    });
    return ids;
  }, [blogs]);

  const filteredAuthors = React.useMemo(() => {
    return authors.filter((a) => {
      // Must have at least 1 genuinely published blog
      const hasPublishedBlog = (a.blogsCount && a.blogsCount > 0) || publishedAuthorIds.has(a.id);
      if (!hasPublishedBlog) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q);
      }
      return true;
    });
  }, [authors, publishedAuthorIds, search]);

  return (
    <div className="min-h-screen bg-ambient-mesh px-4 sm:px-8 py-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono-code mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>Curated Discovery</span>
        </div>
        <h1 className="font-editorial text-4xl font-bold text-white mb-3">
          Explore Perspectives & Creators
        </h1>
        <p className="text-slate-400 text-sm">
          Discover authors pushing frontiers in thought, technology, design, and literature.
        </p>

        {/* Global Search Bar */}
        <div className="mt-6 relative max-w-lg mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by story, writer, niche, or #tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveTag(null);
            }}
            className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-xl"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { id: 'stories', label: 'All Stories', icon: BookOpen },
          { id: 'authors', label: 'Authors & Thinkers', icon: Users },
          { id: 'tags', label: 'Popular Topics', icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== 'stories') setActiveTag(null);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-md shadow-cyan-400/20'
                  : 'glass-panel text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter notifications if activeTag or activeCategory is active */}
      {(activeTag || activeCategory) && (
        <div className="mb-6 flex items-center justify-between glass-panel px-5 py-2.5 rounded-2xl border border-cyan-400/30 max-w-lg mx-auto shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-mono-code">
              {activeCategory && (
                <>
                  Category: <strong className="text-cyan-300 capitalize">{activeCategory.replace(/-/g, ' ')}</strong>
                </>
              )}
              {activeCategory && activeTag && <span className="mx-2 text-slate-500">•</span>}
              {activeTag && (
                <>
                  Tag: <strong className="text-amber-300">#{activeTag}</strong>
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setActiveTag(null);
              setActiveCategory(null);
            }}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-semibold"
          >
            Clear Filter ×
          </button>
        </div>
      )}

      {/* Tab: Stories */}
      {activeTab === 'stories' && (
        <div>
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono-code">Gathering stories...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm glass-panel rounded-3xl max-w-lg mx-auto p-8 border border-white/10 shadow-2xl">
              {activeCategory ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-editorial text-2xl font-bold text-white mb-2">No stories here yet.</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                    Be the first to share something about this topic.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onNavigate({ type: 'write' })}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <PenSquare className="w-4 h-4" />
                      <span>Write a Story</span>
                    </button>
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="px-4 py-2.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-all font-semibold"
                    >
                      View All Stories
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Compass className="w-10 h-10 text-cyan-400/60 mx-auto mb-3" />
                  <h3 className="font-editorial text-xl font-bold text-white mb-2">No matching stories found</h3>
                  <p className="text-slate-400 text-xs mb-4">Try a different keyword or explore our authors.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((b) => (
                <BlogCard key={b.id} blog={b} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Authors */}
      {activeTab === 'authors' && (
        <div>
          {filteredAuthors.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm glass-panel rounded-2xl max-w-md mx-auto p-8">
              No published authors found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuthors.map((author) => (
                <div
                  key={author.id}
                  onClick={() => onNavigate({ type: 'profile', userId: author.id })}
                  className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={
                        author.photoURL ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${author.id}`
                      }
                      alt={author.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-cyan-400/40 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {author.fullName}
                      </h3>
                      <p className="text-xs text-cyan-400/80 font-mono-code">
                        @{author.username}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono-code">
                        Joined {new Date(author.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-3 mb-4 font-light leading-relaxed">
                    {author.bio || 'Author on Soumil’s Blog.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono-code">
                  <span>{author.blogsCount || 0} Stories</span>
                  <span>{author.followersCount || 0} Followers</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Tab: Popular Topics (Explore by Category & Trending Tags) */}
      {activeTab === 'tags' && (
        <div className="space-y-12">
          {/* Section 1: Explore by Category */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono-code mb-2.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Editorial Taxonomy</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white mb-2">
                Explore by Category
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Find your next favourite story. Explore ideas, interests and perspectives from our community.
              </p>
            </div>

            {/* Grid of Categories (Desktop: 3 cols, Tablet: 2 cols, Mobile: 1 col) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                {
                  id: 'technology',
                  name: 'Technology & AI',
                  icon: Cpu,
                  description: 'Artificial intelligence, software craft, cybernetic frontiers, and the digital ethos.',
                },
                {
                  id: 'creative-writing',
                  name: 'Creative Writing',
                  icon: Feather,
                  description: 'Original prose, memoirs, poetry, experimental fiction, and evocative storytelling.',
                },
                {
                  id: 'philosophy',
                  name: 'Philosophy & Mind',
                  icon: Compass,
                  description: 'Existential inquiries, consciousness, ethics, cognitive models, and deep contemplation.',
                },
                {
                  id: 'design',
                  name: 'Design & Aesthetics',
                  icon: Palette,
                  description: 'Visual culture, typography, intentional UI/UX, architectural form, and creative craft.',
                },
                {
                  id: 'future',
                  name: 'Space & Future',
                  icon: Rocket,
                  description: 'Interplanetary exploration, deep science, astronomical phenomena, and tomorrow’s horizons.',
                },
                {
                  id: 'personal-growth',
                  name: 'Personal Growth',
                  icon: Flame,
                  description: 'Intellectual mastery, habits, creative resilience, focus, and mindful living.',
                },
                {
                  id: 'culture',
                  name: 'Culture & Society',
                  icon: Globe,
                  description: 'Contemporary commentary, cinema, anthropology, literature, and social dynamics.',
                },
              ].map((cat) => {
                const IconComponent = cat.icon;
                // Count published blogs belonging to this category
                const count = blogs.filter(
                  (b) =>
                    b.category?.toLowerCase() === cat.id.toLowerCase() ||
                    b.category?.toLowerCase() === cat.name.toLowerCase()
                ).length;

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveTag(null);
                      setActiveTab('stories');
                    }}
                    className="group cursor-pointer p-6 sm:p-7 rounded-3xl glass-panel border border-white/10 hover:border-cyan-400/40 hover:-translate-y-1.5 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Subtle top-right ambient glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                    <div>
                      {/* Top Bar: Icon & Article Count */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-amber-300 group-hover:text-slate-950 transition-all duration-300 shadow-md">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-mono-code font-semibold bg-white/5 border border-white/10 text-slate-300 group-hover:border-cyan-400/30 group-hover:text-cyan-300 transition-colors">
                          {count} {count === 1 ? 'story' : 'stories'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-editorial text-xl font-bold text-white group-hover:text-cyan-200 transition-colors mb-2.5">
                        {cat.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed font-light mb-6 transition-colors">
                        {cat.description}
                      </p>
                    </div>

                    {/* Bottom Action Hint */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 group-hover:text-cyan-300 font-mono-code font-semibold transition-colors">
                      <span>Explore Stories</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-cyan-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Trending Tags */}
          <div className="glass-panel p-7 sm:p-9 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <h3 className="font-editorial text-xl font-bold text-white">Trending Tags</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Popular hashtags curated across community stories. Click any tag to view matching articles.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono-code self-start sm:self-auto">
                {allTags.length} active {allTags.length === 1 ? 'tag' : 'tags'}
              </span>
            </div>

            {allTags.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No community tags recorded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {allTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveTag(tag);
                      setActiveCategory(null);
                      setActiveTab('stories');
                    }}
                    className="px-4 py-2 rounded-full text-xs font-mono-code glass-panel border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group shadow-sm"
                  >
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300">#{tag}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-400 border border-white/5 group-hover:border-cyan-400/30 group-hover:text-cyan-300">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

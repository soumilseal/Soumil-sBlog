import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Users, ArrowRight, Tag, Clock } from 'lucide-react';
import { Blog, PageRoute, UserProfile } from '../../types';
import { subscribeToPublishedBlogs } from '../../services/blogService';
import { getAllUsers } from '../../services/socialService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: PageRoute) => void;
}

type SearchFilter = 'all' | 'people' | 'stories';

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('people');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setRemovedUserIds(new Set());
      setToastMessage(null);
      setFilter('people');
      return;
    }
    const unsub = subscribeToPublishedBlogs((list) => setBlogs(list));
    getAllUsers().then((u) => setUsers(u)).catch(() => {});
    return () => unsub();
  }, [isOpen]);

  const handleRemoveUserFromResults = (e: React.MouseEvent, userId: string, fullName: string) => {
    e.stopPropagation();
    setRemovedUserIds((prev) => new Set(prev).add(userId));
    setToastMessage(`Removed "${fullName}" from search results`);
    setTimeout(() => {
      setToastMessage((current) => (current?.includes(fullName) ? null : current));
    }, 2400);
  };

  // Users matching (active in 'all' and 'people' modes ONLY)
  // De-duplicates confirmed duplicate records (same id, or identical lowercase username)
  // Must be called before any early return according to React Rules of Hooks
  const deduplicatedUsers = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: UserProfile[] = [];
    users.forEach((u) => {
      const key = `${(u.username || '').toLowerCase()}_${(u.fullName || '').toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(u);
      }
    });
    return unique;
  }, [users]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Full-name people search:
  // 1. Single-letter queries (length === 1):
  //    ONLY match full names beginning with that letter (e.g. 'S' -> 'Soumil Seal', but not 'Joydeb Seal').
  // 2. Multi-letter queries (length >= 2):
  //    Prefix matching against individual name tokens (first name, last name).
  //    (e.g., 'Sou' -> 'Soumil Seal', 'Seal' -> 'Soumil Seal', 'Alex' -> 'Alex Johnson').
  // 3. Usernames, emails, and biographies are strictly NOT searched or exposed.
  const doesUserMatchQuery = (u: UserProfile, searchStr: string): boolean => {
    if (!searchStr) return false;
    const cleanSearch = searchStr.startsWith('@') ? searchStr.slice(1).trim() : searchStr.trim();
    if (!cleanSearch) return false;

    const fullNameLower = (u.fullName || '').toLowerCase().trim();
    if (!fullNameLower) return false;

    if (cleanSearch.length === 1) {
      // Single-letter search: strictly beginning of Full Name
      return fullNameLower.startsWith(cleanSearch);
    }

    // Multi-letter search (>= 2 characters):
    // Check full name prefix
    if (fullNameLower.startsWith(cleanSearch)) return true;

    // Check individual name parts (e.g. first name, last name)
    const tokens = fullNameLower.split(/\s+/).filter(Boolean);
    return tokens.some((token) => token.startsWith(cleanSearch));
  };

  // Blogs matching (active in 'all' and 'stories' modes ONLY)
  const matchedBlogs = (filter === 'all' || filter === 'stories') && q
    ? blogs.filter((b) => {
        return (
          b.title.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.content?.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }).slice(0, filter === 'stories' ? 12 : 5)
    : [];

  const matchedUsers = (filter === 'all' || filter === 'people') && q
    ? deduplicatedUsers
        .filter((u) => !removedUserIds.has(u.id))
        .filter((u) => doesUserMatchQuery(u, q))
        .sort((a, b) => {
          // Sort alphabetically by full name (A-Z)
          const nameCompare = (a.fullName || '').localeCompare(b.fullName || '', undefined, {
            sensitivity: 'base',
          });
          if (nameCompare !== 0) return nameCompare;
          // Secondary sort: username (A-Z)
          return (a.username || '').localeCompare(b.username || '', undefined, {
            sensitivity: 'base',
          });
        })
        .slice(0, filter === 'people' ? 12 : 6)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/15 p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
        {/* Toast confirmation */}
        {toastMessage && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-slate-900/95 border border-cyan-400/30 text-cyan-300 text-xs font-mono-code shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search Input Bar */}
        <div className="relative flex items-center mb-4">
          <Search className="w-5 h-5 absolute left-4 text-cyan-400" />
          <input
            type="text"
            autoFocus
            placeholder={
              filter === 'people'
                ? 'Search people by first name or last name...'
                : filter === 'stories'
                ? 'Search stories by title, excerpt, content, category, or tags...'
                : 'Search stories, people, categories, or keywords...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={onClose}
            className="absolute right-4 text-slate-400 hover:text-white p-1"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills (All / People / Stories) */}
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-white/5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('people')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'people'
                ? 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('stories')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'stories'
                ? 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Stories</span>
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto space-y-6">
          {!q ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono-code">
              {filter === 'people'
                ? 'Type a first or last name (e.g. Soumil, Alex) to find people...'
                : filter === 'stories'
                ? 'Type to search stories by title, content, category, or tags...'
                : 'Type to search stories by title, author name, tags or category...'}
            </div>
          ) : filter === 'people' && matchedUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm glass-panel rounded-2xl border border-white/5 p-8 max-w-md mx-auto">
              <Users className="w-8 h-8 text-cyan-400/50 mx-auto mb-2" />
              <p className="font-semibold text-white mb-1">No matching people found.</p>
              <p className="text-xs text-slate-500 font-mono-code">No authors match "{query}".</p>
            </div>
          ) : filter === 'stories' && matchedBlogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm glass-panel rounded-2xl border border-white/5 p-8 max-w-md mx-auto">
              <BookOpen className="w-8 h-8 text-amber-400/50 mx-auto mb-2" />
              <p className="font-semibold text-white mb-1">No matching stories found.</p>
              <p className="text-xs text-slate-500 font-mono-code">Try a different title, topic, or keyword.</p>
            </div>
          ) : filter === 'all' && matchedBlogs.length === 0 && matchedUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm glass-panel rounded-2xl border border-white/5 p-8 max-w-md mx-auto">
              <Search className="w-8 h-8 text-cyan-400/50 mx-auto mb-2" />
              <p className="font-semibold text-white mb-1">No matching stories or people found.</p>
              <p className="text-xs text-slate-500 font-mono-code">No results matching "{query}".</p>
            </div>
          ) : (
            <>
              {/* Authors matching (shown in 'all' and 'people') */}
              {(filter === 'all' || filter === 'people') && (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-code uppercase text-cyan-400 mb-3 tracking-wider">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Authors & Thinkers</span>
                    </div>
                    {matchedUsers.length > 0 && (
                      <span className="text-[10px] text-slate-500 normal-case font-mono-code">
                        Sorted A–Z ({matchedUsers.length})
                      </span>
                    )}
                  </div>

                  {matchedUsers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-500">
                      No matching people found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchedUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            onClose();
                            onNavigate({ type: 'profile', userId: u.id });
                          }}
                          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 cursor-pointer flex items-center gap-3 transition-all duration-200 group relative"
                        >
                          <img
                            src={
                              u.photoURL ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`
                            }
                            alt={u.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-cyan-400 transition-colors shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 truncate">
                              {u.fullName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Remove from search results button */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveUserFromResults(e, u.id, u.fullName)}
                              className="p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/30 transition-all"
                              title="Remove from search results"
                              aria-label={`Remove ${u.fullName} from search results`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 ml-1 hidden sm:block" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stories matching (shown in 'all' and 'stories') */}
              {(filter === 'all' || filter === 'stories') && (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-code uppercase text-amber-400 mb-3 tracking-wider">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Stories & Essays</span>
                    </div>
                    {matchedBlogs.length > 0 && (
                      <span className="text-[10px] text-slate-500 normal-case font-mono-code">
                        {matchedBlogs.length} {matchedBlogs.length === 1 ? 'match' : 'matches'}
                      </span>
                    )}
                  </div>

                  {matchedBlogs.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-500">
                      No matching stories found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matchedBlogs.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            onClose();
                            onNavigate({ type: 'read', blogId: b.id });
                          }}
                          className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 cursor-pointer flex items-start justify-between gap-4 transition-colors group"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono-code uppercase text-cyan-300 mb-1 inline-block">
                              {b.category}
                            </span>
                            <h4 className="text-sm font-editorial font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                              {b.title}
                            </h4>
                            <p className="text-xs text-slate-400 font-light line-clamp-1 mt-0.5">
                              {b.excerpt}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono-code shrink-0 pt-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{b.readTimeMinutes || 4}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

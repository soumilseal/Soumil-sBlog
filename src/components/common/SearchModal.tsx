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

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToPublishedBlogs((list) => setBlogs(list));
    getAllUsers().then((u) => setUsers(u)).catch(() => {});
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedBlogs = q
    ? blogs.filter((b) => {
        return (
          b.title.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }).slice(0, 5)
    : [];

  const matchedUsers = q
    ? users.filter((u) => {
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.bio?.toLowerCase().includes(q)
        );
      }).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/15 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="relative flex items-center mb-6">
          <Search className="w-5 h-5 absolute left-4 text-cyan-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search stories, authors, categories, or keywords..."
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

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto space-y-6">
          {!q ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono-code">
              Type to search stories by title, author name, username, tags or category...
            </div>
          ) : matchedBlogs.length === 0 && matchedUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching stories or writers found for "{query}".
            </div>
          ) : (
            <>
              {/* Authors matching */}
              {matchedUsers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-code uppercase text-cyan-400 mb-3 tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    <span>Authors & Thinkers</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchedUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          onClose();
                          onNavigate({ type: 'profile', userId: u.id });
                        }}
                        className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 cursor-pointer flex items-center gap-3 transition-colors group"
                      >
                        <img
                          src={
                            u.photoURL ||
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`
                          }
                          alt={u.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-cyan-400 transition-colors"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                            {u.fullName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono-code truncate block">
                            @{u.username}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stories matching */}
              {matchedBlogs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-code uppercase text-amber-400 mb-3 tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Stories & Essays</span>
                  </div>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

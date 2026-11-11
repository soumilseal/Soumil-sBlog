import React, { useState, useEffect, useRef } from 'react';
import {
  Feather,
  Compass,
  Home,
  PenSquare,
  Users,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BRANDING } from '../../config/branding';
import { Notification, PageRoute } from '../../types';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/socialService';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  onOpenSearch: () => void;
  onRequestLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenSearch,
  onRequestLogout,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Real-time notifications listener
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserNotifications(user.uid, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActive = (type: string) => currentRoute.type === type;

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto rounded-2xl glass-panel px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-2xl">
        {/* Left: Branding & Logo */}
        <div
          onClick={() => onNavigate(user ? { type: 'dashboard' } : { type: 'landing' })}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-cyan-400/40 to-amber-300/30 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-300 group-hover:scale-105 transition-all">
            <Feather className="w-5 h-5 text-cyan-300 group-hover:text-amber-300 transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                {BRANDING.name}
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="hidden md:block text-[10px] tracking-widest uppercase font-mono-code text-cyan-400/80">
              Social Editorial
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation (Logged In) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => onNavigate({ type: 'dashboard' })}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive('dashboard')
                  ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Feed</span>
            </button>

            <button
              onClick={() => onNavigate({ type: 'explore' })}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive('explore')
                  ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => onNavigate({ type: 'write' })}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                isActive('write')
                  ? 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-lg shadow-cyan-400/20'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/25'
              }`}
            >
              <PenSquare className="w-4 h-4" />
              <span>Write Story</span>
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <span className="text-xs uppercase font-mono-code tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              The Art of Long-Form Thought
            </span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Search Trigger */}
              <button
                onClick={onOpenSearch}
                aria-label="Search"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                title="Search stories, authors, tags"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notifications Dropdown */}
              <div className="relative z-50" ref={notifRef}>
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#080d1a]/98 p-4 shadow-2xl shadow-black/80 border border-white/12 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50 max-w-[calc(100vw-2rem)]">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-semibold text-sm text-white">Notifications</h4>
                        <span className="text-xs text-slate-400">({notifications.length})</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead(notifications)}
                          className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No notifications yet. When members interact with your stories, they will appear here!
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.read) await markNotificationAsRead(n.id);
                              if (n.blogId) onNavigate({ type: 'read', blogId: n.blogId });
                              else if (n.senderId) onNavigate({ type: 'profile', userId: n.senderId });
                              setShowNotifMenu(false);
                            }}
                            className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-start gap-3 ${
                              n.read
                                ? 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/40'
                                : 'bg-cyan-950/40 text-white border-l-2 border-cyan-400 hover:bg-cyan-900/40'
                            }`}
                          >
                            <img
                              src={
                                n.senderPhotoURL ||
                                `https://api.dicebear.com/7.x/identicon/svg?seed=${n.senderId}`
                              }
                              alt={n.senderName}
                              className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="leading-snug">
                                <span className="font-semibold text-white">{n.senderName}</span>{' '}
                                {n.type === 'like' && 'liked your story'}
                                {n.type === 'comment' && 'commented on your story'}
                                {n.type === 'reply' && 'replied to your comment on'}
                                {n.type === 'follow' && 'started following you.'}
                                {n.blogTitle && (
                                  <span className="italic text-cyan-300 block truncate">
                                    "{n.blogTitle}"
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono-code block mt-1">
                                {new Date(n.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Dropdown */}
              <div className="relative z-50" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-white/5 border border-white/10 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <img
                    src={
                      profile?.photoURL ||
                      user.photoURL ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`
                    }
                    alt={profile?.fullName || 'User avatar'}
                    className="w-8 h-8 rounded-lg object-cover border border-cyan-400/40"
                  />
                  <span className="hidden lg:inline-block text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                    {profile?.fullName?.split(' ')[0] || 'My Account'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-[#080d1a]/98 p-2 shadow-2xl shadow-black/90 border border-white/12 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50 max-w-[calc(100vw-2rem)]">
                    <div className="px-3.5 py-2.5 border-b border-white/10 mb-1.5">
                      <p className="text-xs font-bold text-white truncate">{profile?.fullName}</p>
                      <p className="text-[10px] text-cyan-400 font-mono-code truncate">
                        @{profile?.username}
                      </p>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          onNavigate({ type: 'profile', userId: user.uid, tab: 'blogs' });
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/8 transition-all text-left"
                      >
                        <UserIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate({ type: 'profile', userId: user.uid, tab: 'bookmarks' });
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/8 transition-all text-left"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>My Bookmarks</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate({ type: 'write' });
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/8 transition-all text-left"
                      >
                        <PenSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Write Story</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            onNavigate({ type: 'admin' });
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-all text-left"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>Admin Console</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-white/10 my-1.5" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onRequestLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate({ type: 'auth', mode: 'login' })}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate({ type: 'auth', mode: 'register' })}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-md shadow-cyan-400/20 hover:opacity-90 transition-all"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden mt-2 rounded-2xl glass-panel p-4 border border-white/10 space-y-2 animate-in fade-in duration-150">
          <button
            onClick={() => {
              onNavigate({ type: 'dashboard' });
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/5"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Feed</span>
          </button>
          <button
            onClick={() => {
              onNavigate({ type: 'explore' });
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/5"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Explore</span>
          </button>
          <button
            onClick={() => {
              onNavigate({ type: 'write' });
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30"
          >
            <PenSquare className="w-4 h-4 text-cyan-300" />
            <span>Write Story</span>
          </button>
          <button
            onClick={() => {
              onNavigate({ type: 'profile', userId: user.uid });
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/5"
          >
            <UserIcon className="w-4 h-4 text-cyan-400" />
            <span>My Profile</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate({ type: 'admin' });
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-amber-300 hover:bg-amber-500/10"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>Admin Dashboard</span>
            </button>
          )}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onRequestLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </header>
  );
};

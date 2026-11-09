import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Blog, ContentReport, PageRoute, UserProfile } from '../../types';
import {
  getAllUsers,
  setUserSuspension,
  getAllReports,
  resolveReport,
} from '../../services/socialService';
import {
  subscribeToPublishedBlogs,
  deleteBlog,
} from '../../services/blogService';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { BRANDING } from '../../config/branding';

interface AdminPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'reports' | 'blogs' | 'users' | 'categories'>('stats');
  const [loading, setLoading] = useState(true);

  // Deletion modal state
  const [blogToDelete, setBlogToDelete] = useState<{ id: string; title: string; authorId: string } | null>(null);
  const [isDeletingBlog, setIsDeletingBlog] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await getAllUsers();
      setUsers(u);
      const r = await getAllReports();
      setReports(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToPublishedBlogs((list) => {
      setBlogs(list);
    });
    return () => unsub();
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ambient-mesh flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md border border-rose-500/30">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="font-editorial text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-xs mb-6">
            This administration console is exclusively restricted to verified platform administrators ({BRANDING.adminEmail}).
          </p>
          <button
            onClick={() => onNavigate({ type: 'dashboard' })}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleToggleSuspend = async (targetUser: UserProfile) => {
    const nextState = !targetUser.isSuspended;
    await setUserSuspension(targetUser.id, nextState);
    setUsers(users.map((u) => (u.id === targetUser.id ? { ...u, isSuspended: nextState } : u)));
  };

  const handleOpenDeleteModal = (blog: { id: string; title: string; authorId: string }) => {
    setBlogToDelete(blog);
  };

  const handleConfirmDeleteBlog = async () => {
    if (!blogToDelete) return;
    setIsDeletingBlog(true);
    try {
      await deleteBlog(blogToDelete.id, blogToDelete.authorId);
      setBlogs((prev) => prev.filter((b) => b.id !== blogToDelete.id));
      setBlogToDelete(null);
    } catch (err) {
      console.error('Admin delete blog error:', err);
    } finally {
      setIsDeletingBlog(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    await resolveReport(reportId, status);
    setReports(reports.map((r) => (r.id === reportId ? { ...r, status } : r)));
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const totalViews = blogs.reduce((acc, b) => acc + (b.viewsCount || 0), 0);
  const totalLikes = blogs.reduce((acc, b) => acc + (b.likesCount || 0), 0);

  return (
    <div className="min-h-screen bg-ambient-mesh px-4 sm:px-8 py-8 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-300/20 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono-code mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator Portal • {BRANDING.name}</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold text-white">System Control Panel</h1>
          <p className="text-slate-400 text-xs mt-1">
            Logged in as verified administrator: <strong className="text-cyan-300">{user?.email}</strong>
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'stats', label: 'Overview Metrics', icon: BarChart3 },
          { id: 'reports', label: `Moderation Reports (${pendingReports.length})`, icon: AlertTriangle },
          { id: 'blogs', label: `Published Stories (${blogs.length})`, icon: FileText },
          { id: 'users', label: `Registered Users (${users.length})`, icon: Users },
          { id: 'categories', label: 'Categories', icon: FolderTree },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <span className="text-xs font-mono-code text-slate-400 uppercase">Total Stories</span>
              <div className="font-editorial text-3xl font-bold text-white mt-2">
                {blogs.length}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <span className="text-xs font-mono-code text-slate-400 uppercase">Registered Writers</span>
              <div className="font-editorial text-3xl font-bold text-cyan-300 mt-2">
                {users.length}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <span className="text-xs font-mono-code text-slate-400 uppercase">Total Story Views</span>
              <div className="font-editorial text-3xl font-bold text-amber-300 mt-2">
                {totalViews}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
              <span className="text-xs font-mono-code text-slate-400 uppercase">Pending Reports</span>
              <div className="font-editorial text-3xl font-bold text-rose-400 mt-2">
                {pendingReports.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Moderation Reports */}
      {activeTab === 'reports' && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-editorial text-xl font-bold text-white">Reported Content Inquiries</h3>
            <p className="text-xs text-slate-400">Review flagged user content and take action.</p>
          </div>

          {reports.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No reports have been filed. Community is healthy!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {reports.map((r) => (
                <div key={r.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code uppercase ${
                        r.status === 'pending'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-xs font-semibold text-white">Target: {r.targetTitle}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-light mt-1">
                      <strong>Reason:</strong> {r.reason}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono-code">
                      Reported by {r.reporterName} on {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveReport(r.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30"
                      >
                        Action Taken
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg glass-panel text-slate-400 text-xs hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: All Blogs */}
      {activeTab === 'blogs' && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-xl font-bold text-white">All Published Content</h3>
              <p className="text-xs text-slate-400">Total: {blogs.length} stories across all categories</p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {blogs.map((b) => (
              <div key={b.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {b.coverImage && (
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-900"
                    />
                  )}
                  <div className="min-w-0">
                    <h4
                      onClick={() => onNavigate({ type: 'read', blogId: b.id })}
                      className="text-sm font-bold text-white hover:text-cyan-300 cursor-pointer truncate"
                    >
                      {b.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono-code">
                      by {b.authorName} (@{b.authorUsername}) • {b.category} • {b.likesCount || 0} likes
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigate({ type: 'read', blogId: b.id })}
                    className="p-2 text-cyan-300 hover:text-white glass-panel rounded-lg"
                    title="Read"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal({ id: b.id, title: b.title, authorId: b.authorId })}
                    className="p-2 text-rose-400 hover:text-white glass-panel rounded-lg"
                    title="Remove blog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: All Users */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-editorial text-xl font-bold text-white">Registered User Directory</h3>
            <p className="text-xs text-slate-400">Total: {users.length} members</p>
          </div>

          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div key={u.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`}
                    alt={u.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{u.fullName}</span>
                      {u.role === 'admin' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-amber-400 text-slate-950 font-bold uppercase">
                          Admin
                        </span>
                      )}
                      {u.isSuspended && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code bg-rose-500/20 text-rose-400 font-bold uppercase">
                          Suspended
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono-code">
                      @{u.username} • {u.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate({ type: 'profile', userId: u.id })}
                    className="px-3 py-1.5 rounded-lg glass-panel text-xs text-slate-300 hover:text-white"
                  >
                    View
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleSuspend(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        u.isSuspended
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      }`}
                    >
                      {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10">
          <h3 className="font-editorial text-xl font-bold text-white mb-2">Editorial Categories</h3>
          <p className="text-xs text-slate-400 mb-6">
            The platform's curated storytelling taxonomy configured in centralized branding.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BRANDING.categories.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                <h4 className="font-bold text-sm text-white">{c.name}</h4>
                <span className="text-xs text-cyan-400 font-mono-code">slug: {c.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!blogToDelete}
        title="Admin: Remove Blog?"
        itemTitle={blogToDelete?.title}
        description="As an administrator, permanently remove this article from Soumil's Blog. This will delete the content from Firestore."
        isDeleting={isDeletingBlog}
        onConfirm={handleConfirmDeleteBlog}
        onCancel={() => setBlogToDelete(null)}
      />
    </div>
  );
};

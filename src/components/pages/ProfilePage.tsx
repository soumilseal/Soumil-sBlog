import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Calendar,
  PenSquare,
  Bookmark,
  FileText,
  Settings,
  LogOut,
  Edit3,
  Trash2,
  Heart,
  Eye,
  MessageSquare,
  Check,
  UserPlus,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Blog, PageRoute, UserProfile } from '../../types';
import { getUserProfile, updateUserProfile } from '../../services/authService';
import {
  getUserBlogs,
  deleteBlog,
  getUserBookmarks,
  getBlogById,
} from '../../services/blogService';
import { toggleFollow, isFollowingUser } from '../../services/socialService';
import { BlogCard } from '../blog/BlogCard';
import { ImageUploadDropzone } from '../common/ImageUploadDropzone';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { uploadImageToStorage } from '../../services/storageService';

interface ProfilePageProps {
  userId?: string;
  initialTab?: 'blogs' | 'drafts' | 'bookmarks' | 'settings';
  onNavigate: (route: PageRoute) => void;
  onRequestLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  initialTab = 'blogs',
  onNavigate,
  onRequestLogout,
}) => {
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const targetUserId = userId || user?.uid;
  const isOwner = user?.uid === targetUserId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'blogs' | 'drafts' | 'bookmarks' | 'settings'>(initialTab);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit profile form state
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editCoverURL, setEditCoverURL] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Deletion modal state
  const [blogToDelete, setBlogToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingBlog, setIsDeletingBlog] = useState(false);

  // Load target profile
  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);

    getUserProfile(targetUserId).then((data) => {
      setProfile(data);
      if (data) {
        setEditFullName(data.fullName);
        setEditBio(data.bio || '');
        setEditPhotoURL(data.photoURL || '');
        setEditCoverURL(data.coverURL || '');
      }
      setLoading(false);
    });

    if (user && !isOwner) {
      isFollowingUser(user.uid, targetUserId).then(setIsFollowing);
    }
  }, [targetUserId, user, isOwner]);

  // Load user blogs
  useEffect(() => {
    if (!targetUserId) return;
    getUserBlogs(targetUserId).then((list) => {
      setBlogs(list);
    });
  }, [targetUserId]);

  // Load bookmarks if owner
  useEffect(() => {
    if (isOwner && user) {
      getUserBookmarks(user.uid).then(async (ids) => {
        const loaded: Blog[] = [];
        for (const id of ids) {
          const b = await getBlogById(id);
          if (b) loaded.push(b);
        }
        setBookmarkedBlogs(loaded);
      });
    }
  }, [isOwner, user, activeTab]);

  const handleFollowToggle = async () => {
    if (!user || !currentUserProfile || !targetUserId) {
      onNavigate({ type: 'auth', mode: 'login' });
      return;
    }
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      await toggleFollow(
        { id: user.uid, name: currentUserProfile.fullName, photoURL: currentUserProfile.photoURL },
        targetUserId
      );
      // Refresh count
      const updated = await getUserProfile(targetUserId);
      if (updated) setProfile(updated);
    } catch {
      setIsFollowing(prev);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOwner) return;
    setSavingProfile(true);

    try {
      let finalPhoto = editPhotoURL;
      let finalCover = editCoverURL;

      if (avatarFile) {
        finalPhoto = await uploadImageToStorage(avatarFile, 'profiles');
      }
      if (coverFile) {
        finalCover = await uploadImageToStorage(coverFile, 'covers');
      }

      await updateUserProfile(user.uid, {
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        photoURL: finalPhoto,
        coverURL: finalCover,
      });

      setEditPhotoURL(finalPhoto);
      setEditCoverURL(finalCover);
      setAvatarFile(null);
      setCoverFile(null);

      await refreshProfile();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: editFullName.trim(),
              bio: editBio.trim(),
              photoURL: finalPhoto,
              coverURL: finalCover,
            }
          : null
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenDeleteModal = (blog: { id: string; title: string }) => {
    setBlogToDelete(blog);
  };

  const handleConfirmDeleteBlog = async () => {
    if (!user || !blogToDelete) return;
    setIsDeletingBlog(true);
    try {
      await deleteBlog(blogToDelete.id, user.uid);
      setBlogs((prev) => prev.filter((b) => b.id !== blogToDelete.id));
      setBookmarkedBlogs((prev) => prev.filter((b) => b.id !== blogToDelete.id));
      setBlogToDelete(null);
    } catch (err) {
      console.error('Failed to delete blog:', err);
    } finally {
      setIsDeletingBlog(false);
    }
  };

  const publishedBlogs = blogs.filter((b) => b.status === 'published');
  const draftBlogs = blogs.filter((b) => b.status === 'draft');

  if (loading) {
    return (
      <div className="min-h-screen bg-ambient-mesh flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-ambient-mesh flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md border border-white/10">
          <h2 className="font-editorial text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">This writer account does not exist or has been removed.</p>
          <button
            onClick={() => onNavigate({ type: 'dashboard' })}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ambient-mesh pb-32">
      {/* Profile Header Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
          {/* Banner / Cover Image */}
          <div className="h-48 sm:h-64 w-full relative bg-slate-900 overflow-hidden">
            <img
              src={
                profile.coverURL ||
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
              }
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-transparent to-transparent opacity-90" />
          </div>

          {/* Profile Meta Bar */}
          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
              {/* Profile Avatar */}
              <div className="relative">
                <img
                  src={
                    profile.photoURL ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.id}`
                  }
                  alt={profile.fullName}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-[#060911] shadow-2xl bg-slate-900"
                />
                {profile.role === 'admin' && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-bold tracking-wider font-mono-code uppercase shadow">
                    Admin
                  </span>
                )}
              </div>

              {/* Action Buttons: Edit or Follow or Logout */}
              <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
                {isOwner ? (
                  <>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-4 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={onRequestLogout}
                      className="px-4 py-2 rounded-xl glass-panel text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-6 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-300 border border-white/10 hover:text-rose-400'
                        : 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold shadow-lg shadow-cyan-400/20'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Author</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Author Name & Bio */}
            <div className="max-w-2xl">
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-white">
                {profile.fullName}
              </h1>
              <p className="text-cyan-400 text-xs sm:text-sm font-mono-code mt-0.5">
                @{profile.username}
              </p>
              <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed mt-3">
                {profile.bio || 'Storyteller & thinker exploring ideas on Soumil’s Blog.'}
              </p>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/5 text-xs text-slate-400 font-mono-code">
              <div>
                <strong className="text-white text-base font-bold mr-1.5">
                  {publishedBlogs.length}
                </strong>
                <span>Stories</span>
              </div>
              <div>
                <strong className="text-white text-base font-bold mr-1.5">
                  {profile.followersCount || 0}
                </strong>
                <span>Followers</span>
              </div>
              <div>
                <strong className="text-white text-base font-bold mr-1.5">
                  {profile.followingCount || 0}
                </strong>
                <span>Following</span>
              </div>
              <div className="flex items-center gap-1.5 sm:ml-auto text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Member since{' '}
                  {new Date(profile.createdAt).toLocaleDateString([], {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 mt-8 mb-6 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'blogs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Stories ({publishedBlogs.length})</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'drafts'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PenSquare className="w-4 h-4" />
                <span>Drafts ({draftBlogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'bookmarks'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Bookmarks ({bookmarkedBlogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Profile Settings</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Content: Stories */}
        {activeTab === 'blogs' && (
          <div>
            {publishedBlogs.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl text-center border border-white/5 max-w-md mx-auto">
                <p className="text-slate-400 text-sm mb-4">No stories published yet.</p>
                {isOwner && (
                  <button
                    onClick={() => onNavigate({ type: 'write' })}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
                  >
                    Write First Story
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedBlogs.map((b) => (
                  <div key={b.id} className="relative group">
                    <BlogCard blog={b} onNavigate={onNavigate} />
                    {isOwner && (
                      <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 p-1 rounded-xl backdrop-blur-md border border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate({ type: 'write', editBlogId: b.id });
                          }}
                          className="p-1.5 text-cyan-300 hover:text-white"
                          title="Edit story"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteModal({ id: b.id, title: b.title });
                          }}
                          className="p-1.5 text-rose-400 hover:text-white"
                          title="Delete story"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Drafts (Owner only) */}
        {activeTab === 'drafts' && isOwner && (
          <div>
            {draftBlogs.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl text-center border border-white/5 max-w-md mx-auto">
                <p className="text-slate-400 text-sm">You have no unpublished drafts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {draftBlogs.map((d) => (
                  <div
                    key={d.id}
                    className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Draft
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono-code">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-editorial text-xl font-bold text-white mb-2">{d.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2">{d.excerpt}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                      <button
                        onClick={() => onNavigate({ type: 'write', editBlogId: d.id })}
                        className="px-4 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Resume Writing</span>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal({ id: d.id, title: d.title })}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Bookmarks (Owner only) */}
        {activeTab === 'bookmarks' && isOwner && (
          <div>
            {bookmarkedBlogs.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl text-center border border-white/5 max-w-md mx-auto">
                <Bookmark className="w-10 h-10 text-amber-300 mx-auto mb-3 opacity-60" />
                <h3 className="font-editorial text-lg font-bold text-white mb-1">
                  Your Reading List is Empty
                </h3>
                <p className="text-slate-400 text-xs mb-4">
                  Bookmark stories as you browse the feed to save them for later contemplation.
                </p>
                <button
                  onClick={() => onNavigate({ type: 'dashboard' })}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs"
                >
                  Browse Stories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedBlogs.map((b) => (
                  <BlogCard key={b.id} blog={b} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Settings / Edit Profile (Owner only) */}
        {activeTab === 'settings' && isOwner && (
          <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-white/10">
            <h3 className="font-editorial text-2xl font-bold text-white mb-2">Edit Account Profile</h3>
            <p className="text-xs text-slate-400 mb-6">
              Update your public persona, avatar, and background banner.
            </p>

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Profile saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Biography</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-light"
                />
              </div>

              <div className="pt-1">
                <ImageUploadDropzone
                  label="Profile Picture"
                  sublabel="Choose an avatar from your computer or phone"
                  aspectRatio="avatar"
                  currentImageUrl={editPhotoURL}
                  onFileSelect={(file) => setAvatarFile(file)}
                />
              </div>

              <div className="pt-2">
                <ImageUploadDropzone
                  label="Profile Banner / Cover Image"
                  sublabel="Choose a landscape banner photo from your computer or phone"
                  aspectRatio="banner"
                  currentImageUrl={editCoverURL}
                  onFileSelect={(file) => setCoverFile(file)}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!blogToDelete}
        title="Delete Story?"
        itemTitle={blogToDelete?.title}
        description="Are you sure you want to permanently delete this story? This will remove all associated content and cannot be restored."
        isDeleting={isDeletingBlog}
        onConfirm={handleConfirmDeleteBlog}
        onCancel={() => setBlogToDelete(null)}
      />
    </div>
  );
};

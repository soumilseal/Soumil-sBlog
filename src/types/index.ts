export type UserRole = 'admin' | 'author' | 'member';

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  bio?: string;
  photoURL?: string;
  coverURL?: string;
  role: UserRole;
  isSuspended?: boolean;
  followersCount: number;
  followingCount: number;
  blogsCount: number;
  createdAt: string;
}

export type BlogStatus = 'published' | 'draft' | 'removed';

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  status: BlogStatus;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  blogId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  content: string;
  parentCommentId?: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LikeRecord {
  id: string; // `${blogId}_${userId}`
  blogId: string;
  userId: string;
  createdAt: string;
}

export interface BookmarkRecord {
  id: string; // `${blogId}_${userId}`
  blogId: string;
  userId: string;
  createdAt: string;
}

export interface FollowerRecord {
  id: string; // `${followedId}_${followerId}`
  followerId: string;
  followedId: string;
  createdAt: string;
}

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  type: NotificationType;
  blogId?: string;
  blogTitle?: string;
  read: boolean;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'blog' | 'comment' | 'user';
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export type PageRoute = 
  | { type: 'landing' }
  | { type: 'auth'; mode?: 'login' | 'register' }
  | { type: 'dashboard' }
  | { type: 'explore' }
  | { type: 'write'; editBlogId?: string }
  | { type: 'read'; blogId: string }
  | { type: 'profile'; userId?: string; tab?: 'blogs' | 'drafts' | 'bookmarks' | 'settings' }
  | { type: 'admin' }
  | { type: 'farewell' };

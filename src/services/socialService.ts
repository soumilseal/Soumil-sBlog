import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Comment, FollowerRecord, Notification, ContentReport, UserProfile } from '../types';

const COMMENTS_COLLECTION = 'comments';
const FOLLOWERS_COLLECTION = 'followers';
const NOTIFICATIONS_COLLECTION = 'notifications';
const REPORTS_COLLECTION = 'reports';
const BLOGS_COLLECTION = 'blogs';
const USERS_COLLECTION = 'users';

// --- COMMENTS ---
export function subscribeToBlogComments(
  blogId: string,
  callback: (comments: Comment[]) => void
) {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('blogId', '==', blogId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: Comment[] = [];
      snap.forEach((d) => list.push(d.data() as Comment));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COMMENTS_COLLECTION);
    }
  );
}

export async function addComment(
  blogId: string,
  author: { id: string; name: string; username: string; photoURL?: string },
  content: string,
  parentCommentId: string | null = null,
  onNotification?: () => Promise<void>
): Promise<string> {
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const comment: Comment = {
    id: commentId,
    blogId,
    authorId: author.id,
    authorName: author.name,
    authorUsername: author.username,
    authorPhotoURL: author.photoURL,
    content,
    parentCommentId,
    likesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, COMMENTS_COLLECTION, commentId), comment);
    await updateDoc(doc(db, BLOGS_COLLECTION, blogId), {
      commentsCount: increment(1),
    });
    if (onNotification) {
      onNotification().catch(() => {});
    }
    return commentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COMMENTS_COLLECTION}/${commentId}`);
  }
}

export async function deleteComment(commentId: string, blogId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
    if (blogId) {
      updateDoc(doc(db, BLOGS_COLLECTION, blogId), {
        commentsCount: increment(-1),
      }).catch((err) => {
        console.warn('Background decrement of commentsCount non-critical error:', err);
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COMMENTS_COLLECTION}/${commentId}`);
  }
}

export async function likeComment(commentId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COMMENTS_COLLECTION, commentId), {
      likesCount: increment(1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COMMENTS_COLLECTION}/${commentId}`);
  }
}

// --- FOLLOW SYSTEM ---
export async function toggleFollow(
  followerUser: { id: string; name: string; photoURL?: string },
  followedUserId: string
): Promise<boolean> {
  if (followerUser.id === followedUserId) return false;

  const followId = `${followedUserId}_${followerUser.id}`;
  const followDocRef = doc(db, FOLLOWERS_COLLECTION, followId);

  try {
    const existing = await getDoc(followDocRef);
    if (existing.exists()) {
      // Unfollow
      await deleteDoc(followDocRef);
      await updateDoc(doc(db, USERS_COLLECTION, followedUserId), {
        followersCount: increment(-1),
      });
      await updateDoc(doc(db, USERS_COLLECTION, followerUser.id), {
        followingCount: increment(-1),
      });
      return false;
    } else {
      // Follow
      const record: FollowerRecord = {
        id: followId,
        followerId: followerUser.id,
        followedId: followedUserId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(followDocRef, record);
      await updateDoc(doc(db, USERS_COLLECTION, followedUserId), {
        followersCount: increment(1),
      });
      await updateDoc(doc(db, USERS_COLLECTION, followerUser.id), {
        followingCount: increment(1),
      });

      // Send notification to followed author
      await createNotification({
        recipientId: followedUserId,
        senderId: followerUser.id,
        senderName: followerUser.name,
        senderPhotoURL: followerUser.photoURL,
        type: 'follow',
      });

      return true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${FOLLOWERS_COLLECTION}/${followId}`);
  }
}

export async function isFollowingUser(followerId?: string | null, followedId?: string): Promise<boolean> {
  if (!followerId || !followedId) return false;
  try {
    const snap = await getDoc(doc(db, FOLLOWERS_COLLECTION, `${followedId}_${followerId}`));
    return snap.exists();
  } catch {
    return false;
  }
}

// --- NOTIFICATIONS ---
export async function createNotification(
  payload: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Promise<void> {
  if (payload.recipientId === payload.senderId) return; // Don't notify self

  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const notif: Notification = {
    ...payload,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), notif);
  } catch (error) {
    console.warn('Failed to dispatch notification:', error);
  }
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: Notification[] = [];
      snap.forEach((d) => list.push(d.data() as Notification));
      callback(list);
    },
    (err) => {
      console.warn('Notifications listener err:', err);
    }
  );
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notifId), {
      read: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOTIFICATIONS_COLLECTION}/${notifId}`);
  }
}

export async function markAllNotificationsAsRead(notifications: Notification[]): Promise<void> {
  for (const n of notifications) {
    if (!n.read) {
      try {
        await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, n.id), { read: true });
      } catch {
        // Continue marking others
      }
    }
  }
}

// --- REPORTS (FLAG CONTENT) ---
export async function submitContentReport(
  reporter: { id: string; name: string },
  targetType: 'blog' | 'comment' | 'user',
  targetId: string,
  targetTitle: string,
  reason: string
): Promise<string> {
  const id = `report_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const report: ContentReport = {
    id,
    reporterId: reporter.id,
    reporterName: reporter.name,
    targetType,
    targetId,
    targetTitle,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, REPORTS_COLLECTION, id), report);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REPORTS_COLLECTION}/${id}`);
  }
}

// --- ADMIN DASHBOARD OPERATIONS ---
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
  }
}

export async function setUserSuspension(userId: string, isSuspended: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), { isSuspended });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
  }
}

export async function getAllReports(): Promise<ContentReport[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: ContentReport[] = [];
    snap.forEach((d) => list.push(d.data() as ContentReport));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
  }
}

export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed'): Promise<void> {
  try {
    await updateDoc(doc(db, REPORTS_COLLECTION, reportId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

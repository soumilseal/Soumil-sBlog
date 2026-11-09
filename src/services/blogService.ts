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
import { Blog, LikeRecord, BookmarkRecord } from '../types';
import { INITIAL_BLOGS } from '../data/seedBlogs';

const BLOGS_COLLECTION = 'blogs';
const LIKES_COLLECTION = 'likes';
const BOOKMARKS_COLLECTION = 'bookmarks';
const USERS_COLLECTION = 'users';

export async function seedInitialBlogsIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, BLOGS_COLLECTION), limit(1)));
    if (snap.empty) {
      console.log('Seeding initial curated blogs into Firestore...');
      for (const blog of INITIAL_BLOGS) {
        await setDoc(doc(db, BLOGS_COLLECTION, blog.id), blog);
      }
    }
  } catch (error) {
    console.warn('Initial seeding check skipped or permission handled:', error);
  }
}

export function subscribeToPublishedBlogs(callback: (blogs: Blog[]) => void, onError?: (err: unknown) => void) {
  const blogsQuery = query(
    collection(db, BLOGS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    blogsQuery,
    (snapshot) => {
      const blogs: Blog[] = [];
      snapshot.forEach((d) => blogs.push(d.data() as Blog));
      callback(blogs);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, BLOGS_COLLECTION);
    }
  );
}

export async function getBlogById(blogId: string): Promise<Blog | null> {
  try {
    const docRef = doc(db, BLOGS_COLLECTION, blogId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Blog;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${BLOGS_COLLECTION}/${blogId}`);
  }
}

export async function createBlog(
  blogData: Omit<Blog, 'id' | 'likesCount' | 'commentsCount' | 'bookmarksCount' | 'viewsCount' | 'createdAt'>
): Promise<string> {
  const newBlogId = `blog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const newBlog: Blog = {
    ...blogData,
    id: newBlogId,
    likesCount: 0,
    commentsCount: 0,
    bookmarksCount: 0,
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, BLOGS_COLLECTION, newBlogId), newBlog);

    // Increment user's blog count in background without blocking response
    if (newBlog.status === 'published') {
      updateDoc(doc(db, USERS_COLLECTION, blogData.authorId), {
        blogsCount: increment(1),
      }).catch((err) => {
        console.warn('Could not increment user blogsCount:', err);
      });
    }

    return newBlogId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${BLOGS_COLLECTION}/${newBlogId}`);
  }
}

export async function updateBlog(blogId: string, updates: Partial<Blog>): Promise<void> {
  try {
    const docRef = doc(db, BLOGS_COLLECTION, blogId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BLOGS_COLLECTION}/${blogId}`);
  }
}

export async function deleteBlog(blogId: string, authorId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BLOGS_COLLECTION, blogId));
    // Asynchronously try to decrement user blogs count, but don't fail the deletion if user doc doesn't exist
    if (authorId) {
      updateDoc(doc(db, USERS_COLLECTION, authorId), {
        blogsCount: increment(-1),
      }).catch((err) => {
        console.warn('Background decrement of author blogsCount non-critical error:', err);
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BLOGS_COLLECTION}/${blogId}`);
  }
}

export async function incrementBlogViews(blogId: string): Promise<void> {
  try {
    const docRef = doc(db, BLOGS_COLLECTION, blogId);
    await updateDoc(docRef, {
      viewsCount: increment(1),
    });
  } catch {
    // Non-critical background count
  }
}

// Like functionality
export async function toggleLike(
  blogId: string,
  userId: string,
  onNotification?: () => Promise<void>
): Promise<boolean> {
  const likeId = `${blogId}_${userId}`;
  const likeDocRef = doc(db, LIKES_COLLECTION, likeId);
  const blogDocRef = doc(db, BLOGS_COLLECTION, blogId);

  try {
    const existing = await getDoc(likeDocRef);
    if (existing.exists()) {
      // Unlike
      await deleteDoc(likeDocRef);
      await updateDoc(blogDocRef, { likesCount: increment(-1) });
      return false;
    } else {
      // Like
      const record: LikeRecord = {
        id: likeId,
        blogId,
        userId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(likeDocRef, record);
      await updateDoc(blogDocRef, { likesCount: increment(1) });
      if (onNotification) {
        onNotification().catch(() => {});
      }
      return true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${LIKES_COLLECTION}/${likeId}`);
  }
}

export async function isBlogLikedByUser(blogId: string, userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const likeDoc = await getDoc(doc(db, LIKES_COLLECTION, `${blogId}_${userId}`));
    return likeDoc.exists();
  } catch {
    return false;
  }
}

// Bookmark functionality
export async function toggleBookmark(blogId: string, userId: string): Promise<boolean> {
  const bookmarkId = `${blogId}_${userId}`;
  const docRef = doc(db, BOOKMARKS_COLLECTION, bookmarkId);
  const blogDocRef = doc(db, BLOGS_COLLECTION, blogId);

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      await deleteDoc(docRef);
      await updateDoc(blogDocRef, { bookmarksCount: increment(-1) });
      return false;
    } else {
      const record: BookmarkRecord = {
        id: bookmarkId,
        blogId,
        userId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, record);
      await updateDoc(blogDocRef, { bookmarksCount: increment(1) });
      return true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BOOKMARKS_COLLECTION}/${bookmarkId}`);
  }
}

export async function isBlogBookmarkedByUser(blogId: string, userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const bDoc = await getDoc(doc(db, BOOKMARKS_COLLECTION, `${blogId}_${userId}`));
    return bDoc.exists();
  } catch {
    return false;
  }
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  try {
    const q = query(collection(db, BOOKMARKS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const blogIds: string[] = [];
    snap.forEach((d) => blogIds.push(d.data().blogId));
    return blogIds;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BOOKMARKS_COLLECTION);
  }
}

export async function getUserBlogs(authorId: string): Promise<Blog[]> {
  try {
    const q = query(
      collection(db, BLOGS_COLLECTION),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const blogs: Blog[] = [];
    snap.forEach((d) => blogs.push(d.data() as Blog));
    return blogs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BLOGS_COLLECTION);
  }
}

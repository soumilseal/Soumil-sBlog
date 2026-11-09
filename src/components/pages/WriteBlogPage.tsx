import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  Send,
  Save,
  Tag,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createBlog, getBlogById, updateBlog } from '../../services/blogService';
import { Blog, PageRoute } from '../../types';
import { BRANDING } from '../../config/branding';
import { ImageUploadDropzone } from '../common/ImageUploadDropzone';
import { uploadImageToStorage } from '../../services/storageService';

interface WriteBlogPageProps {
  editBlogId?: string;
  onNavigate: (route: PageRoute) => void;
}

export const WriteBlogPage: React.FC<WriteBlogPageProps> = ({ editBlogId, onNavigate }) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [preUploadedCoverUrl, setPreUploadedCoverUrl] = useState<string>('');
  const [uploadingArticleImages, setUploadingArticleImages] = useState(false);
  const [category, setCategory] = useState('technology');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Writing', 'Essay']);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const articleImagesInputRef = useRef<HTMLInputElement>(null);

  // Background pre-upload cover image as soon as file is chosen
  useEffect(() => {
    if (!coverImageFile) {
      setPreUploadedCoverUrl('');
      return;
    }
    let isCancelled = false;
    uploadImageToStorage(coverImageFile, 'blogs').then((url) => {
      if (!isCancelled && url) {
        setPreUploadedCoverUrl(url);
      }
    }).catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [coverImageFile]);

  // If editing an existing blog, load its data
  useEffect(() => {
    if (editBlogId) {
      getBlogById(editBlogId).then((existing) => {
        if (existing) {
          if (user && existing.authorId !== user.uid && profile?.role !== 'admin') {
            setErrorMsg('You do not have permission to edit this blog.');
            return;
          }
          setTitle(existing.title);
          setExcerpt(existing.excerpt);
          setContent(existing.content);
          setCoverImage(existing.coverImage || '');
          setCategory(existing.category || 'technology');
          setTags(existing.tags || []);
        }
      });
    }
  }, [editBlogId, user, profile]);

  // Estimate reading time (roughly 200 words per minute)
  const readingTime = Math.max(1, Math.ceil((content.split(/\s+/).length || 0) / 200));

  // Tag helper
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Text formatting insertion helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setContent(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 0);
  };

  // Handle native file picker selection for article images
  const handleArticleImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingArticleImages(true);
    try {
      let insertedMarkdown = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const downloadUrl = await uploadImageToStorage(file, 'articles');
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        insertedMarkdown += `\n\n![${cleanName}](${downloadUrl})\n\n`;
      }

      const el = textareaRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const newText = text.substring(0, start) + insertedMarkdown + text.substring(end);
        setContent(newText);
      } else {
        setContent((prev) => prev + insertedMarkdown);
      }
    } catch (err) {
      console.error('Error uploading article image:', err);
      setErrorMsg('Failed to upload article image. Please check file format and size.');
    } finally {
      setUploadingArticleImages(false);
      if (articleImagesInputRef.current) {
        articleImagesInputRef.current.value = '';
      }
    }
  };

  const handleSaveOrPublish = async (status: 'published' | 'draft') => {
    if (!user || !profile) {
      setErrorMsg('Please sign in to publish or save drafts.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please provide a title for your blog.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Please write some content before publishing.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Resolve Cover Image (instantaneous if pre-uploaded in background)
      let finalCoverImage = coverImage.trim();
      if (preUploadedCoverUrl) {
        finalCoverImage = preUploadedCoverUrl;
      } else if (coverImageFile) {
        finalCoverImage = await uploadImageToStorage(coverImageFile, 'blogs');
        setCoverImage(finalCoverImage);
      }

      if (editBlogId) {
        await updateBlog(editBlogId, {
          title: title.trim(),
          excerpt: excerpt.trim() || title.slice(0, 140),
          content: content.trim(),
          coverImage: finalCoverImage,
          category,
          tags,
          status,
          readTimeMinutes: readingTime,
        });
        if (status === 'published') {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
        onNavigate({ type: 'read', blogId: editBlogId });
      } else {
        const newId = await createBlog({
          title: title.trim(),
          excerpt: excerpt.trim() || title.slice(0, 140),
          content: content.trim(),
          coverImage: finalCoverImage,
          category,
          tags,
          status,
          readTimeMinutes: readingTime,
          authorId: user.uid,
          authorName: profile.fullName,
          authorUsername: profile.username,
          authorPhotoURL: profile.photoURL,
        });

        if (status === 'published') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          onNavigate({ type: 'read', blogId: newId });
        } else {
          onNavigate({ type: 'profile', userId: user.uid, tab: 'drafts' });
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ambient-mesh px-4 sm:px-8 py-8 max-w-5xl mx-auto pb-28">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate({ type: 'dashboard' })}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-white transition-all"
            aria-label="Back to feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-editorial text-2xl font-bold text-white">
              {editBlogId ? 'Edit Your Story' : 'Craft a New Story'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>~{readingTime} min read</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Preview, Draft, Publish */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isPreview
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'glass-panel text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPreview ? 'Edit Mode' : 'Live Preview'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSaveOrPublish('draft')}
            className="px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-white/20 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSaveOrPublish('published')}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Publishing...' : 'Publish Story'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor or Preview Mode */}
      {isPreview ? (
        /* LIVE PREVIEW */
        <article className="glass-panel p-6 sm:p-12 rounded-3xl border border-white/10 max-w-4xl mx-auto">
          {(coverImageFile || coverImage) && (
            <div className="rounded-2xl overflow-hidden mb-8 w-full bg-slate-950/80 border border-white/10 shadow-xl flex items-center justify-center p-2">
              <img
                src={coverImageFile ? URL.createObjectURL(coverImageFile) : coverImage}
                alt={title}
                className="w-full h-auto max-h-[600px] object-contain rounded-xl mx-auto"
              />
            </div>
          )}

          <div className="mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-mono-code uppercase bg-cyan-950/70 text-cyan-300 border border-cyan-400/30">
              {category}
            </span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {title || 'Untitled Story'}
          </h1>

          {excerpt && (
            <p className="text-lg text-slate-300 italic mb-8 font-light border-l-2 border-cyan-400 pl-4">
              {excerpt}
            </p>
          )}

          <div className="space-y-4 text-slate-200 text-base sm:text-lg leading-relaxed font-light">
            {content.split('\n\n').map((paragraph, idx) => {
              const imgMatch = paragraph.match(/^!\[(.*?)\]\((.*?)\)$/);
              if (imgMatch) {
                return (
                  <figure
                    key={idx}
                    className="my-6 rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-lg"
                  >
                    <img
                      src={imgMatch[2]}
                      alt={imgMatch[1] || 'Illustration'}
                      className="w-full max-h-[440px] object-cover bg-slate-900"
                    />
                    {imgMatch[1] && (
                      <figcaption className="p-2.5 text-center text-xs text-slate-400 font-mono-code bg-slate-950/60">
                        {imgMatch[1]}
                      </figcaption>
                    )}
                  </figure>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={idx} className="font-editorial text-2xl font-bold text-white mt-6 mb-2">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="font-editorial text-xl font-bold text-cyan-200 mt-4 mb-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote
                    key={idx}
                    className="p-4 rounded-xl glass-panel border-l-4 border-amber-300 italic text-slate-300 font-editorial text-lg"
                  >
                    {paragraph.replace('> ', '')}
                  </blockquote>
                );
              }
              return (
                <p key={idx} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono-code bg-white/5 text-slate-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      ) : (
        /* WRITE FORM */
        <div className="space-y-6">
          {/* Cover Image Upload from Device */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <ImageUploadDropzone
              label="Blog Cover Image"
              sublabel="Upload an editorial header photo directly from your device (JPG, PNG, WEBP)"
              aspectRatio="cover"
              currentImageUrl={coverImage}
              onFileSelect={(file) => setCoverImageFile(file)}
            />
          </div>

          {/* Title & Excerpt */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Story Title
              </label>
              <input
                type="text"
                required
                placeholder="Enter a compelling, magnetic title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-3.5 font-editorial text-xl sm:text-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Short Description / Subtitle
              </label>
              <textarea
                rows={2}
                placeholder="A one or two sentence hook summarizing your story..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {BRANDING.categories
                    .filter((c) => c.id !== 'all')
                    .map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tags <span className="text-slate-500 font-normal">(press Enter or comma)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Neuroscience, Future, DeepTech..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono-code"
                />

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-mono-code bg-white/5 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-400/20"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rich Content Editor */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/80 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-5 bg-white/10 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('\n# ')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-bold text-xs"
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n## ')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-bold text-xs"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n### ')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-bold text-xs"
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-5 bg-white/10 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('\n> ')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n- ')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n1. ')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[Link Title](', ')')}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                title="Hyperlink"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              {/* Hidden native file input for multiple article images */}
              <input
                ref={articleImagesInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleArticleImagesSelected}
              />

              <button
                type="button"
                disabled={uploadingArticleImages}
                onClick={() => articleImagesInputRef.current?.click()}
                className="ml-auto px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/25 flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Select image(s) from device file manager and upload to Firebase Storage"
              >
                {uploadingArticleImages ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Upload Device Image(s)</span>
                  </>
                )}
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={18}
              required
              placeholder="Unfurl your thoughts. Write paragraphs, add headers, quotes, and reflections..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-light leading-relaxed resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
};

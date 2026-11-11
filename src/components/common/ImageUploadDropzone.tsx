import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  X,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  FileImage,
} from 'lucide-react';

interface ImageUploadDropzoneProps {
  label: string;
  sublabel?: string;
  currentImageUrl?: string;
  onFileSelect: (file: File | null) => void;
  aspectRatio?: 'avatar' | 'banner' | 'cover';
  accept?: string;
  maxSizeMB?: number;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  label,
  sublabel = 'Supports JPG, JPEG, PNG, WEBP up to 10MB',
  currentImageUrl,
  onFileSelect,
  aspectRatio = 'cover',
  accept = 'image/jpeg,image/png,image/webp,image/jpg',
  maxSizeMB = 10,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with currentImageUrl changes if no local file has been picked
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(currentImageUrl || null);
    }
  }, [currentImageUrl, selectedFile]);

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please select a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File is too large. Maximum allowed size is ${maxSizeMB}MB.`);
      return;
    }

    // Generate local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleTriggerPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Dimensions based on aspect ratio
  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'avatar':
        return 'w-32 h-32 sm:w-36 sm:h-36 rounded-3xl mx-auto';
      case 'banner':
        return 'w-full h-44 sm:h-52 rounded-2xl';
      case 'cover':
      default:
        return 'w-full h-52 sm:h-64 rounded-2xl';
    }
  };

  return (
    <div className="space-y-2 box-border">
      {/* Hidden native device file picker input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label={label}
      />

      <div className="flex items-center justify-between gap-2 min-w-0">
        <label className="text-xs font-semibold text-slate-300 block truncate">{label}</label>
        {selectedFile && (
          <span className="text-[10px] text-cyan-400 font-mono-code flex items-center gap-1 shrink-0">
            <CheckCircle className="w-3 h-3" />
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
          </span>
        )}
      </div>

      {/* Main Drag & Drop / Preview Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={previewUrl ? undefined : handleTriggerPicker}
        className={`relative transition-all border-2 border-dashed overflow-hidden flex flex-col items-center justify-center text-center box-border ${
          previewUrl ? 'cursor-default' : 'cursor-pointer p-4'
        } ${getAspectClass()} ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : previewUrl
            ? 'border-cyan-500/40 bg-slate-950/80 hover:border-cyan-400'
            : 'border-white/15 bg-slate-900/50 hover:border-cyan-400/50 hover:bg-slate-900/80'
        }`}
      >
        {previewUrl ? (
          /* PREVIEW STATE */
          aspectRatio === 'avatar' ? (
            /* AVATAR PREVIEW: Compact, centered, icon-only buttons, non-wrapping badge */
            <div className="absolute inset-0 group w-full h-full">
              <img
                src={previewUrl}
                alt="Uploaded Avatar Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-2">
                {/* Non-overlapping, truncated label badge */}
                <div
                  className="max-w-[85%] px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 flex items-center gap-1 text-[10px] text-slate-200 min-w-0 shadow"
                  title={selectedFile ? selectedFile.name : 'Current Image'}
                >
                  <FileImage className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate whitespace-nowrap font-medium">
                    {selectedFile ? selectedFile.name : 'Current Image'}
                  </span>
                </div>

                {/* Compact icon buttons side-by-side with sufficient spacing */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerPicker();
                    }}
                    title="Replace Image"
                    aria-label="Replace Image"
                    className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-90 text-slate-950 flex items-center justify-center shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    title="Remove Image"
                    aria-label="Remove Image"
                    className="w-9 h-9 rounded-full bg-rose-500/90 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* COVER & BANNER PREVIEW: Responsive buttons with text, non-wrapping label */
            <div className="absolute inset-0 group w-full h-full">
              <img
                src={previewUrl}
                alt="Uploaded Preview"
                className="w-full h-full object-contain p-2 bg-slate-950/80"
              />
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-3 sm:p-4">
                {/* Readable, non-overlapping label badge */}
                <div
                  className="max-w-[85%] sm:max-w-[75%] px-3 py-1 rounded-full bg-slate-900/85 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs text-slate-200 shadow-sm min-w-0"
                  title={selectedFile ? selectedFile.name : 'Current Image'}
                >
                  <FileImage className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate whitespace-nowrap font-medium text-[11px] sm:text-xs">
                    {selectedFile ? selectedFile.name : 'Current Image'}
                  </span>
                </div>

                {/* Responsive action buttons that wrap gracefully and stay within bounds */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full px-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerPicker();
                    }}
                    title="Replace Image"
                    aria-label="Replace Image"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-[11px] sm:text-xs hover:bg-cyan-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replace Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    title="Remove Image"
                    aria-label="Remove Image"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-rose-500/90 hover:bg-rose-500 active:scale-95 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* EMPTY UPLOAD PROMPT */
          aspectRatio === 'avatar' ? (
            /* Avatar empty state: compact and fitted */
            <div className="p-3 flex flex-col items-center justify-center text-center gap-1.5 w-full h-full">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-white leading-tight">
                Upload Avatar
              </p>
              <p className="text-[10px] text-cyan-400 font-mono-code">
                Tap to browse
              </p>
            </div>
          ) : (
            /* Banner/Cover empty state: generous layout with sublabel and browse button */
            <div className="space-y-2.5 sm:space-y-3 p-4 w-full">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-300">
                <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="px-2">
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Drag and drop image here, or{' '}
                  <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-2">
                    browse files
                  </span>
                </p>
                {sublabel && (
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 font-mono-code line-clamp-1">
                    {sublabel}
                  </p>
                )}
              </div>

              <div className="pt-0.5 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerPicker();
                  }}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-semibold flex items-center gap-2 shadow transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Browse Files</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

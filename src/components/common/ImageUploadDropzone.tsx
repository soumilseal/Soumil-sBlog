import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
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
        return 'w-32 h-32 rounded-3xl mx-auto';
      case 'banner':
        return 'w-full h-44 sm:h-52 rounded-2xl';
      case 'cover':
      default:
        return 'w-full h-52 sm:h-64 rounded-2xl';
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden native device file picker input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label={label}
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 block">{label}</label>
        {selectedFile && (
          <span className="text-[10px] text-cyan-400 font-mono-code flex items-center gap-1">
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
        onClick={handleTriggerPicker}
        className={`relative cursor-pointer transition-all border-2 border-dashed overflow-hidden flex flex-col items-center justify-center p-4 text-center ${getAspectClass()} ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : previewUrl
            ? 'border-cyan-500/40 bg-slate-950/80 hover:border-cyan-400'
            : 'border-white/15 bg-slate-900/50 hover:border-cyan-400/50 hover:bg-slate-900/80'
        }`}
      >
        {previewUrl ? (
          /* PREVIEW STATE */
          <div className="absolute inset-0 group">
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className={`w-full h-full ${
                aspectRatio === 'avatar' ? 'object-cover' : 'object-contain p-2 bg-slate-950/80'
              }`}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-4">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-cyan-400" />
                {selectedFile ? selectedFile.name : 'Current Image'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerPicker();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY UPLOAD PROMPT */
          <div className="space-y-3 p-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-300">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                Drag and drop image here, or{' '}
                <span className="text-cyan-400 underline decoration-cyan-400/50 underline-offset-2">
                  browse files
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono-code">{sublabel}</p>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerPicker();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-semibold flex items-center gap-2 shadow"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Browse Files</span>
              </button>
            </div>
          </div>
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

import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { generateSampleVideo } from '../utils/sampleVideoGenerator';

interface UploadDropzoneProps {
  onVideoSelected: (file: File) => void;
  isLoadingMetadata: boolean;
  error?: string | null;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onVideoSelected,
  isLoadingMetadata,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support paste from clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || isLoadingMetadata || isGeneratingDemo) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('video/')) {
          const file = item.getAsFile();
          if (file) {
            onVideoSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoadingMetadata, isGeneratingDemo, onVideoSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onVideoSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onVideoSelected(file);
    }
  };

  const handleGenerateSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsGeneratingDemo(true);
      const demoFile = await generateSampleVideo(45); // 45s test video
      onVideoSelected(demoFile);
    } catch (err) {
      console.error('Failed to generate demo video:', err);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoadingMetadata && !isGeneratingDemo && fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[220px] sm:min-h-[250px] ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/15 scale-[1.008] shadow-2xl shadow-indigo-500/20'
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80 shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
          onChange={handleFileChange}
          className="hidden"
        />

        {isLoadingMetadata || isGeneratingDemo ? (
          <div className="flex flex-col items-center gap-2.5">
            <Loader2 className="w-9 h-9 text-indigo-400 animate-spin" />
            <p className="text-sm font-semibold text-white">
              {isGeneratingDemo ? 'Preparing sample video...' : 'Reading video in browser memory...'}
            </p>
          </div>
        ) : (
          <>
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3.5">
              <UploadCloud className="w-7 h-7 text-indigo-300" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 tracking-tight">
              Choose a video file
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 mb-4 max-w-md">
              Drag & drop here, or <span className="text-indigo-400 font-semibold underline underline-offset-4 hover:text-indigo-300">browse</span> · MP4, WebM, MOV, MKV up to 2 GB
            </p>

            <button
              type="button"
              onClick={handleGenerateSample}
              disabled={isGeneratingDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 rounded-lg transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Try Sample Video (45s)</span>
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-300">Could not read video file</p>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

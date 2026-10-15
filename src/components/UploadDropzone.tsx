import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, Video, AlertCircle, Sparkles, Loader2, ShieldCheck, Zap, FileVideo } from 'lucide-react';
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
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden p-6 sm:p-12 text-center flex flex-col items-center justify-center min-h-[300px] sm:min-h-[340px] ${
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <p className="text-base font-semibold text-white">
              {isGeneratingDemo
                ? 'Synthesizing 45-second test video (30 FPS, audio tone)...'
                : 'Analyzing video container & keyframe indices...'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Verifying stream parameters and audio tracks locally in browser memory. No data is sent over the network.
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-900/80 to-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-5 shadow-inner">
              <UploadCloud className="w-8 h-8 text-indigo-300" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Drag & drop video here, or <span className="text-indigo-400 underline underline-offset-4 decoration-indigo-400/60 hover:text-indigo-300">browse files</span>
            </h3>

            <p className="text-sm text-slate-400 max-w-lg mb-5 leading-relaxed">
              Drop any video or press <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">Ctrl+V</kbd> to paste from clipboard. Slices at raw stream speed with zero quality loss.
            </p>

            {/* Supported Containers Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {['MP4 (H.264 / H.265)', 'WebM (VP8 / VP9)', 'MOV (QuickTime)', 'MKV (Matroska)'].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <FileVideo className="w-3 h-3 text-indigo-400" />
                  <span>{fmt}</span>
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mb-6">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Client-Side Privacy</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-sky-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Original Bitstream Quality</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">Zero Watermark</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateSample}
                disabled={isGeneratingDemo}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-200 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/60 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Try Sample Demo Video (45s)</span>
              </button>
            </div>
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

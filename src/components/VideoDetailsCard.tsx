import React, { useState } from 'react';
import { VideoMetadata } from '../types/splitter';
import {
  formatBitrate,
  formatDuration,
  formatFileSize,
  getResolutionCategory,
} from '../utils/formatters';
import {
  Trash2,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Monitor,
  Clock,
  HardDrive,
  Film,
  FastForward,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface VideoDetailsCardProps {
  metadata: VideoMetadata;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onReplaceVideo: () => void;
  onRemoveVideo: () => void;
  fileWarning?: string | null;
}

export const VideoDetailsCard: React.FC<VideoDetailsCardProps> = ({
  metadata,
  videoRef,
  currentTime,
  onTimeUpdate,
  onReplaceVideo,
  onRemoveVideo,
  fileWarning,
}) => {
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasPlayerError, setHasPlayerError] = useState(false);

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleSeekOffset = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(metadata.duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
    }
  };

  const resCategory = getResolutionCategory(metadata.width, metadata.height);
  const bitrateStr = formatBitrate(metadata.size, metadata.duration);

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Bar with Filename and Actions */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-slate-950/40">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-md md:max-w-lg">
              {metadata.name}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400">
              <span className="font-mono">{formatFileSize(metadata.size)}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono">{formatDuration(metadata.duration)}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-indigo-300 font-medium">{resCategory}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{metadata.aspectRatio}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReplaceVideo}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xs:inline sm:inline">Replace</span>
          </button>
          <button
            type="button"
            onClick={onRemoveVideo}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-900/80 border border-rose-800/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Remove</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player on left/top, Spec details on right */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Video Player Container */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="bg-black rounded-xl overflow-hidden border border-slate-800 aspect-video relative flex items-center justify-center group shadow-md">
            <video
              ref={videoRef}
              src={metadata.objectUrl}
              controls={!hasPlayerError}
              playsInline
              preload="metadata"
              onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
              onError={() => setHasPlayerError(true)}
              onLoadedData={() => setHasPlayerError(false)}
              className="w-full h-full object-contain"
            />
            {hasPlayerError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-10">
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs font-semibold text-white mb-1">
                  Browser Player Preview Unavailable
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Your browser's built-in media player cannot decode this container or video codec directly, but WebAssembly splitting will process it at 100% quality below!
                </p>
              </div>
            )}
          </div>

          {/* Quick Playback Speed & Seek Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSeekOffset(-5)}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors flex items-center gap-1"
                title="Seek back 5 seconds"
              >
                <RotateCcw className="w-3 h-3 text-indigo-400" />
                <span>-5s</span>
              </button>
              <button
                type="button"
                onClick={() => handleSeekOffset(5)}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors flex items-center gap-1"
                title="Seek forward 5 seconds"
              >
                <FastForward className="w-3 h-3 text-indigo-400" />
                <span>+5s</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 mr-0.5">Speed:</span>
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={`min-h-[30px] min-w-[28px] px-1.5 py-1 text-[11px] font-mono rounded-md transition-colors ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white active:bg-slate-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Specs & Metadata List */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Duration</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {formatDuration(metadata.duration, true)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Playhead: {formatDuration(currentTime)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>Resolution</span>
              </div>
              <div className="text-sm font-bold text-white font-mono truncate">
                {metadata.width} × {metadata.height}
              </div>
              <div className="text-[10px] text-sky-400 font-medium mt-0.5">
                {resCategory}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>File Size</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {formatFileSize(metadata.size)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {bitrateStr}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                {metadata.hasAudio ? (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Audio Stream</span>
              </div>
              <div className="text-sm font-bold text-white">
                {metadata.hasAudio ? 'Detected' : 'No Audio'}
              </div>
              <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                {metadata.hasAudio ? 'Full Fidelity' : 'Silent Track'}
              </div>
            </div>
          </div>

          {fileWarning && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{fileWarning}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="text-slate-300">
              Format: <strong className="text-white font-mono">{metadata.type || 'video/mp4'}</strong>
            </span>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">Space</kbd> Play
              <span className="text-slate-600">·</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">← / →</kbd> Seek 5s
              <span className="text-slate-600">·</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">Ctrl+↵</kbd> Split
            </div>

            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WebAssembly Ready · Zero Upload</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { GeneratedClip } from '../types/splitter';
import { formatDuration, formatFileSize } from '../utils/formatters';
import { createClipsZip, downloadClipsSequentially, triggerBlobDownload } from '../services/zipService';
import { Download, Archive, Play, Pause, Check, Loader2, Sparkles, RefreshCcw, CheckSquare, Square, Edit2, Trash2, FolderDown, Repeat, CheckCheck, Share2 } from 'lucide-react';
import { analytics } from '../services/analyticsService';

interface ClipResultsListProps {
  originalFilename: string;
  clips: GeneratedClip[];
  onReset: () => void;
  onOpenShare?: () => void;
  onUpdateClipFilename?: (clipId: string, newFilename: string) => void;
  onDeleteClip?: (clipId: string) => void;
}

export const ClipResultsList: React.FC<ClipResultsListProps> = ({
  originalFilename,
  clips,
  onReset,
  onOpenShare,
  onUpdateClipFilename,
  onDeleteClip,
}) => {
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [isDownloadingFiles, setIsDownloadingFiles] = useState(false);
  const [fileDownloadProgress, setFileDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [downloadedClipIds, setDownloadedClipIds] = useState<Set<string>>(new Set());

  // Multi-select state
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(
    () => new Set(clips.map((c) => c.id))
  );

  // Rename state
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [tempFilename, setTempFilename] = useState('');

  const toggleSelectClip = (id: string) => {
    setSelectedClipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedClipIds(new Set(clips.map((c) => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedClipIds(new Set());
  };

  const handleStartRename = (clip: GeneratedClip) => {
    setEditingClipId(clip.id);
    setTempFilename(clip.filename);
  };

  const handleSaveRename = (clipId: string) => {
    if (tempFilename && tempFilename.trim()) {
      onUpdateClipFilename?.(clipId, tempFilename.trim());
    }
    setEditingClipId(null);
  };

  const handleDownloadSingle = (clip: GeneratedClip) => {
    triggerBlobDownload(clip.blob, clip.filename);
    setDownloadedClipIds((prev) => new Set(prev).add(clip.id));
    analytics.track('clip_downloaded', {
      downloadType: 'single',
      clipCount: 1,
      format: clip.filename.split('.').pop() || 'mp4',
    });
  };

  const activeSelectedClips = clips.filter((c) => selectedClipIds.has(c.id));
  const selectedBytes = activeSelectedClips.reduce((acc, c) => acc + c.size, 0);

  const handleDownloadSelectedZip = async () => {
    if (isZipping || activeSelectedClips.length === 0) return;

    try {
      setIsZipping(true);
      setZipProgress(0);

      const zipBlob = await createClipsZip(originalFilename, activeSelectedClips, (progress) => {
        setZipProgress(progress.percent);
      });

      const base = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename;
      const zipName = `${base}_${activeSelectedClips.length}_clips.zip`;
      triggerBlobDownload(zipBlob, zipName);

      analytics.track('clip_downloaded', {
        downloadType: 'zip',
        clipCount: activeSelectedClips.length,
        format: 'zip',
      });
    } catch (err) {
      console.error('Failed to create ZIP archive:', err);
      alert('Failed to generate ZIP archive: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSelectedFiles = async () => {
    if (isDownloadingFiles || activeSelectedClips.length === 0) return;

    try {
      setIsDownloadingFiles(true);
      setFileDownloadProgress({ current: 0, total: activeSelectedClips.length });

      await downloadClipsSequentially(activeSelectedClips, (current, total) => {
        setFileDownloadProgress({ current, total });
        const currentClip = activeSelectedClips[current - 1];
        if (currentClip) {
          setDownloadedClipIds((prev) => new Set(prev).add(currentClip.id));
        }
      });

      analytics.track('clip_downloaded', {
        downloadType: 'sequential',
        clipCount: activeSelectedClips.length,
        format: activeSelectedClips[0]?.filename.split('.').pop() || 'mp4',
      });
    } catch (err) {
      console.error('Failed to download individual files:', err);
    } finally {
      setIsDownloadingFiles(false);
      setFileDownloadProgress(null);
    }
  };

  const totalBytes = clips.reduce((acc, c) => acc + c.size, 0);
  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">Generated Video Clips</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              Zero Watermark
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {clips.length} clips generated · Total duration: <strong className="font-mono text-slate-200">{formatDuration(totalDuration)}</strong> · Total size: <strong className="font-mono text-slate-200">{formatFileSize(totalBytes)}</strong>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onReset}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 border border-slate-700 rounded-xl transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Split Again</span>
          </button>

          {onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 active:bg-indigo-900 border border-indigo-800/60 rounded-xl transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share App</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadSelectedFiles}
            disabled={isDownloadingFiles || activeSelectedClips.length === 0}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 disabled:opacity-50 border border-slate-700 rounded-xl transition-colors"
          >
            {isDownloadingFiles && fileDownloadProgress ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving {fileDownloadProgress.current}/{fileDownloadProgress.total}...</span>
              </>
            ) : (
              <>
                <FolderDown className="w-3.5 h-3.5 text-indigo-400" />
                <span>Save Files ({activeSelectedClips.length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadSelectedZip}
            disabled={isZipping || activeSelectedClips.length === 0}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating ZIP ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Download ZIP ({activeSelectedClips.length} clips · {formatFileSize(selectedBytes)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Selection Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={selectedClipIds.size === clips.length ? handleDeselectAll : handleSelectAll}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
          >
            {selectedClipIds.size === clips.length ? (
              <>
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-500" />
                <span>Select All ({clips.length})</span>
              </>
            )}
          </button>
          <span>·</span>
          <span>
            <strong className="text-white font-mono">{activeSelectedClips.length}</strong> selected for download
          </span>
        </div>

        <span className="text-[11px] text-slate-500">
          Click pencil to rename clips before download
        </span>
      </div>

      {/* Grid of clips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clips.map((clip) => {
          const isDownloaded = downloadedClipIds.has(clip.id);
          const isSelected = selectedClipIds.has(clip.id);
          const isEditing = editingClipId === clip.id;

          return (
            <div
              key={clip.id}
              className={`bg-slate-950/80 border rounded-xl overflow-hidden flex flex-col justify-between transition-all group ${
                isSelected ? 'border-slate-800 hover:border-slate-700' : 'border-slate-900 opacity-60'
              }`}
            >
              {/* Video Player */}
              <div className="relative bg-black aspect-video flex items-center justify-center border-b border-slate-800/60">
                <video
                  src={clip.objectUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                  onPlay={() => setActivePlayingId(clip.id)}
                />

                {/* Top Overlay Badge & Selection Checkbox */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => toggleSelectClip(clip.id)}
                    className="p-1 rounded bg-black/70 backdrop-blur-sm text-white hover:text-indigo-400 transition-colors"
                    title={isSelected ? 'Deselect clip' : 'Select clip'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                    Part {clip.index.toString().padStart(2, '0')}
                  </span>
                </div>

                {onDeleteClip && (
                  <button
                    type="button"
                    onClick={() => onDeleteClip(clip.id)}
                    className="absolute top-2 right-2 min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-slate-400 hover:text-rose-400 active:text-rose-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10 flex items-center justify-center"
                    title="Delete this clip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clip Metadata & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  {/* Filename with Inline Editing */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <input
                        type="text"
                        value={tempFilename}
                        onChange={(e) => setTempFilename(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(clip.id);
                          if (e.key === 'Escape') setEditingClipId(null);
                        }}
                        autoFocus
                        className="w-full min-h-[36px] px-2.5 py-1 text-sm sm:text-xs font-mono bg-slate-900 border border-indigo-500 rounded text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(clip.id)}
                        className="min-h-[36px] px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h5
                        className="text-xs font-semibold text-white truncate cursor-pointer hover:text-indigo-300 transition-colors"
                        title={clip.filename}
                        onClick={() => handleStartRename(clip)}
                      >
                        {clip.filename}
                      </h5>
                      <button
                        type="button"
                        onClick={() => handleStartRename(clip)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 active:text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Rename clip"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-400/80" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono">{formatDuration(clip.startTime)} → {formatDuration(clip.endTime)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-semibold text-slate-300">{formatDuration(clip.duration, true)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{formatFileSize(clip.size)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Original Quality</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(clip)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isDownloaded
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isDownloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

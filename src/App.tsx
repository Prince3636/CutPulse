/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  GeneratedClip,
  SplitEngineSettings,
  SplitProgress,
  VideoMetadata,
} from './types/splitter';
import { calculateSplitSegments } from './utils/splitterCalculations';
import { extractVideoMetadata, validateVideoFile } from './services/videoMetadataService';
import { ffmpegService } from './services/ffmpegService';
import { analytics } from './services/analyticsService';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { VideoDetailsCard } from './components/VideoDetailsCard';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { SplitConfigPanel } from './components/SplitConfigPanel';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { ClipResultsList } from './components/ClipResultsList';
import { PrivacyBanner } from './components/PrivacyBanner';
import { FAQSection } from './components/FAQSection';
import { LegalAndInfoModal, InfoModalPage } from './components/LegalAndInfoModal';
import { ShareModal } from './components/ShareModal';
import { AdBanner } from './components/AdBanner';
import { formatDuration } from './utils/formatters';
import { notifyCompletion } from './utils/audioNotification';
import { Scissors } from 'lucide-react';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const [settings, setSettings] = useState<SplitEngineSettings>({
    mode: '30s',
    equalParts: 2,
    customDuration: 30,
    customUnit: 'seconds',
    cutStrategy: 'stream_copy',
    includeAudio: true,
    accurateQuality: 'balanced',
  });

  // Track manual clip selection overrides (e.g. unchecking clip #3)
  const [segmentSelectionMap, setSegmentSelectionMap] = useState<Record<number, boolean>>({});

  const [currentPlayheadTime, setCurrentPlayheadTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<SplitProgress>({
    stage: 'idle',
    currentClipIndex: 0,
    totalClips: 0,
    percent: 0,
    message: '',
  });

  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [activeInfoPage, setActiveInfoPage] = useState<InfoModalPage | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Automatically calculate segments and attach selection flags
  const calculation = useMemo(() => {
    if (!metadata || metadata.duration <= 0) {
      return calculateSplitSegments(0, settings);
    }
    const rawCalc = calculateSplitSegments(metadata.duration, settings, metadata.size);
    const enrichedSegments = rawCalc.segments.map((seg) => ({
      ...seg,
      selected: segmentSelectionMap[seg.index] ?? true,
    }));

    return {
      ...rawCalc,
      segments: enrichedSegments,
    };
  }, [metadata, settings, segmentSelectionMap]);

  // Clean up object URLs when unmounting or replacing
  useEffect(() => {
    return () => {
      if (metadata?.objectUrl) {
        URL.revokeObjectURL(metadata.objectUrl);
      }
      ffmpegService.revokeClipUrls(generatedClips);
    };
  }, []);

  // Prevent accidental mobile navigation/refresh during active video processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  // Support URL hash navigation (#about, #contact, #privacy, #terms)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['about', 'contact', 'privacy', 'terms'].includes(hash)) {
        setActiveInfoPage(hash as InfoModalPage);
        analytics.track('page_view', { page: hash as InfoModalPage });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenInfoPage = (page: InfoModalPage) => {
    setActiveInfoPage(page);
    window.location.hash = page;
    analytics.track('page_view', { page });
  };

  const handleCloseInfoPage = () => {
    setActiveInfoPage(null);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleVideoSelected = async (file: File) => {
    // Reset previous generated clips & errors
    if (generatedClips.length > 0) {
      ffmpegService.revokeClipUrls(generatedClips);
      setGeneratedClips([]);
    }
    if (metadata?.objectUrl) {
      URL.revokeObjectURL(metadata.objectUrl);
    }

    setMetadata(null);
    setMetadataError(null);
    setFileWarning(null);
    setSegmentSelectionMap({});
    setCurrentPlayheadTime(0);
    setIsLoadingMetadata(true);

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setIsLoadingMetadata(false);
      setMetadataError(validation.error || 'Invalid file.');
      return;
    }

    if (validation.warning) {
      setFileWarning(validation.warning);
    }

    try {
      const meta = await extractVideoMetadata(file);
      setVideoFile(file);
      setMetadata(meta);

      analytics.track('video_selected', {
        format: meta.type || file.name.split('.').pop() || 'mp4',
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(1)),
        durationSecs: Math.round(meta.duration),
        hasAudio: meta.hasAudio,
        resolution: `${meta.width}x${meta.height}`,
      });
    } catch (err) {
      console.error('Metadata extraction failed:', err);
      setMetadataError(err instanceof Error ? err.message : 'Could not decode video file.');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<SplitEngineSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    // Reset overrides when switching mode
    if (newSettings.mode && newSettings.mode !== settings.mode) {
      setSegmentSelectionMap({});
      analytics.track('preset_changed', { mode: newSettings.mode });
    }
  };

  const handleToggleSegment = (index: number) => {
    setSegmentSelectionMap((prev) => {
      const current = prev[index] ?? true;
      return {
        ...prev,
        [index]: !current,
      };
    });
  };

  const handleSetAllSegmentsSelected = (selected: boolean) => {
    const next: Record<number, boolean> = {};
    calculation.segments.forEach((s) => {
      next[s.index] = selected;
    });
    setSegmentSelectionMap(next);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentPlayheadTime(time);
  };

  const handleStartSplit = async (overrideSettings?: Partial<SplitEngineSettings>) => {
    if (!videoFile || !metadata || !calculation.isValid || isProcessing) {
      return;
    }

    const currentActiveSettings = overrideSettings
      ? { ...settings, ...overrideSettings }
      : settings;

    const activeToSplit = calculation.segments.filter((s) => s.selected !== false);
    if (activeToSplit.length === 0) {
      alert('Please select at least one clip segment to split.');
      return;
    }

    // Clean up any existing clips
    if (generatedClips.length > 0) {
      ffmpegService.revokeClipUrls(generatedClips);
      setGeneratedClips([]);
    }

    setIsProcessing(true);
    setProgress({
      stage: 'loading_engine',
      currentClipIndex: 0,
      totalClips: activeToSplit.length,
      percent: 5,
      message: 'Preparing browser WebAssembly engine...',
    });

    const splitStartTime = performance.now();
    analytics.track('split_started', {
      mode: currentActiveSettings.mode,
      totalClips: activeToSplit.length,
      strategy: currentActiveSettings.cutStrategy,
      includeAudio: currentActiveSettings.includeAudio !== false,
      durationSecs: Math.round(metadata.duration),
    });

    try {
      const clips = await ffmpegService.splitVideo(
        videoFile,
        calculation.segments,
        currentActiveSettings,
        (prog) => {
          setProgress(prog);
        }
      );

      setGeneratedClips(clips);
      notifyCompletion(clips.length);

      analytics.track('split_completed', {
        mode: currentActiveSettings.mode,
        clipsGenerated: clips.length,
        strategy: currentActiveSettings.cutStrategy,
        elapsedSecs: Math.round((performance.now() - splitStartTime) / 1000),
      });
    } catch (err) {
      console.error('Video splitting failed:', err);
      analytics.track('split_failed', {
        mode: currentActiveSettings.mode,
        strategy: currentActiveSettings.cutStrategy,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryWithAccurateCut = () => {
    handleUpdateSettings({ cutStrategy: 'accurate_cut' });
    handleStartSplit({ cutStrategy: 'accurate_cut' });
  };

  const handleDismissError = () => {
    setIsProcessing(false);
    setProgress({
      stage: 'idle',
      currentClipIndex: 0,
      totalClips: 0,
      percent: 0,
      message: '',
    });
  };

  const handleCancelProcessing = () => {
    ffmpegService.cancelCurrentJob();
    analytics.track('split_cancelled', {
      mode: settings.mode,
      clipsGeneratedSoFar: generatedClips.length,
      totalExpected: calculation.totalClips,
    });
  };

  const handleReset = () => {
    if (isProcessing) {
      ffmpegService.cancelCurrentJob();
    }
    if (metadata?.objectUrl) {
      URL.revokeObjectURL(metadata.objectUrl);
    }
    ffmpegService.revokeClipUrls(generatedClips);
    setVideoFile(null);
    setMetadata(null);
    setGeneratedClips([]);
    setMetadataError(null);
    setFileWarning(null);
    setSegmentSelectionMap({});
    setCurrentPlayheadTime(0);
    setIsProcessing(false);
  };

  // Global Keyboard Shortcuts (Space to play/pause, Left/Right to seek, Escape, Ctrl+Enter to split)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (isShareModalOpen) {
          setIsShareModalOpen(false);
          return;
        }
        if (activeInfoPage) {
          handleCloseInfoPage();
          return;
        }
        return;
      }

      if (isInput) return;

      // Space: Toggle Play/Pause on active video
      if (e.code === 'Space' && videoRef.current && metadata) {
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
        return;
      }

      // Left Arrow: Seek backwards 5 seconds
      if (e.key === 'ArrowLeft' && videoRef.current && metadata) {
        e.preventDefault();
        const newTime = Math.max(0, videoRef.current.currentTime - 5);
        handleSeek(newTime);
        return;
      }

      // Right Arrow: Seek forwards 5 seconds
      if (e.key === 'ArrowRight' && videoRef.current && metadata) {
        e.preventDefault();
        const newTime = Math.min(metadata.duration, videoRef.current.currentTime + 5);
        handleSeek(newTime);
        return;
      }

      // Ctrl+Enter or Cmd+Enter: Trigger Split
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (metadata && !isProcessing && calculation.isValid) {
          e.preventDefault();
          handleStartSplit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [metadata, isProcessing, calculation, isShareModalOpen, activeInfoPage]);

  const handleUpdateClipFilename = (clipId: string, newFilename: string) => {
    setGeneratedClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, filename: newFilename } : c))
    );
  };

  const handleDeleteClip = (clipId: string) => {
    setGeneratedClips((prev) => {
      const clip = prev.find((c) => c.id === clipId);
      if (clip?.objectUrl) {
        URL.revokeObjectURL(clip.objectUrl);
      }
      return prev.filter((c) => c.id !== clipId);
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        onScrollToSection={scrollToSection}
        onOpenPage={handleOpenInfoPage}
        onOpenShare={() => setIsShareModalOpen(true)}
        onReset={metadata ? handleReset : undefined}
        hasVideo={!!metadata}
      />

      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12 ${
        metadata && !isProcessing && generatedClips.length === 0 ? 'pb-28 sm:pb-32 lg:pb-12' : ''
      }`}>
        {/* Hero Introduction */}
        {!metadata && (
          <section className="text-center max-w-2xl mx-auto space-y-3 pt-4 sm:pt-8">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">
              Split Videos Fast.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                Right in Your Browser.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto text-balance">
              Cut long videos into WhatsApp, Reels & Shorts clips. Lossless quality, zero uploads, zero watermarks.
            </p>
          </section>
        )}

        {/* Workspace Container */}
        <section id="split-workspace" ref={workspaceRef} className="space-y-8">
          {/* Step 1: Upload Dropzone (When no video chosen) */}
          {!metadata && (
            <UploadDropzone
              onVideoSelected={handleVideoSelected}
              isLoadingMetadata={isLoadingMetadata}
              error={metadataError}
            />
          )}

          {/* Step 2: Video Loaded View */}
          {metadata && (
            <div className="space-y-8">
              <VideoDetailsCard
                metadata={metadata}
                videoRef={videoRef}
                currentTime={currentPlayheadTime}
                onTimeUpdate={setCurrentPlayheadTime}
                onReplaceVideo={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files.length > 0) {
                      handleVideoSelected(target.files[0]);
                    }
                  };
                  input.click();
                }}
                onRemoveVideo={handleReset}
                fileWarning={fileWarning}
              />

              {/* Splitting Configuration Panel & Timeline */}
              <div id="splitting-modes" className="space-y-6">
                <TimelineVisualizer
                  calculation={calculation}
                  videoDuration={metadata.duration}
                  currentPlayheadTime={currentPlayheadTime}
                  onSeek={handleSeek}
                  onToggleSegment={handleToggleSegment}
                />

                <SplitConfigPanel
                  settings={settings}
                  calculation={calculation}
                  videoDuration={metadata.duration}
                  onUpdateSettings={handleUpdateSettings}
                  onToggleSegment={handleToggleSegment}
                  onSetAllSegmentsSelected={handleSetAllSegmentsSelected}
                  onStartSplit={() => handleStartSplit()}
                  isProcessing={isProcessing}
                />
              </div>

              {/* Processing Progress Overlay */}
              {(isProcessing || progress.stage === 'error' || progress.stage === 'cancelled') && (
                <ProcessingOverlay
                  progress={progress}
                  isStreamCopy={settings.cutStrategy === 'stream_copy'}
                  onCancel={handleCancelProcessing}
                  onRetryWithAccurateCut={handleRetryWithAccurateCut}
                  onDismissError={handleDismissError}
                />
              )}

              {/* Generated Clips Listing */}
              {generatedClips.length > 0 && !isProcessing && progress.stage !== 'error' && (
                <ClipResultsList
                  originalFilename={metadata.name}
                  clips={generatedClips}
                  onReset={() => {
                    setGeneratedClips([]);
                    scrollToSection('split-workspace');
                  }}
                  onOpenShare={() => setIsShareModalOpen(true)}
                  onUpdateClipFilename={handleUpdateClipFilename}
                  onDeleteClip={handleDeleteClip}
                />
              )}
            </div>
          )}
        </section>

        {/* Privacy & Architecture Section */}
        <PrivacyBanner />

        {/* Optional Google AdSense Placement Slot */}
        <AdBanner slotId="auto-banner" />

        {/* Technical FAQ */}
        <FAQSection />
      </main>

      {/* Clean Editorial Footer with Legal & Info Links */}
      <footer className={`border-t border-slate-900 bg-slate-950/80 py-8 sm:py-10 px-4 text-xs text-slate-500 safe-bottom ${
        metadata && !isProcessing && generatedClips.length === 0 ? 'pb-24 lg:pb-10' : ''
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-slate-300">CutPulse</span>
              <span>·</span>
              <span>Browser-Based Video Splitter</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Client-side WebAssembly video demuxing. Zero server storage. Zero watermarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <button
              onClick={() => handleOpenInfoPage('about')}
              className="hover:text-white transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleOpenInfoPage('contact')}
              className="hover:text-white transition-colors"
            >
              Contact & Support
            </button>
            <button
              onClick={() => handleOpenInfoPage('privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleOpenInfoPage('terms')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500">
            <span>© {new Date().getFullYear()} CutPulse. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Quick-Action Bar */}
      {metadata && !isProcessing && generatedClips.length === 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] safe-bottom-bar animate-in slide-in-from-bottom-2 duration-150">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 truncate">
                <span className="font-bold text-white">
                  {calculation.segments.filter((s) => s.selected !== false).length} clips
                </span>
                <span>·</span>
                <span className="text-amber-300">
                  {formatDuration(calculation.segments.filter((s) => s.selected !== false).reduce((a, s) => a + s.duration, 0), true)}
                </span>
              </div>
              <div className="text-[10px] text-indigo-400 font-medium truncate">
                {settings.cutStrategy === 'stream_copy' ? 'Stream-Copy' : 'Accurate Cut'} · Zero Watermark
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartSplit()}
              disabled={isProcessing || !calculation.isValid || calculation.segments.filter((s) => s.selected !== false).length === 0}
              className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Split Video</span>
              <Scissors className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Legal & Informational Modals */}
      <LegalAndInfoModal
        page={activeInfoPage}
        onClose={handleCloseInfoPage}
        onSwitchPage={handleOpenInfoPage}
      />

      {/* Social Viral Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}

import React from 'react';
import { SplitProgress } from '../types/splitter';
import { Loader2, XCircle, AlertCircle, CheckCircle2, Clock, Zap, Cpu, RefreshCw, Sliders } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: SplitProgress;
  isStreamCopy?: boolean;
  onCancel: () => void;
  onRetryWithAccurateCut?: () => void;
  onDismissError?: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  progress,
  isStreamCopy,
  onCancel,
  onRetryWithAccurateCut,
  onDismissError,
}) => {
  const isError = progress.stage === 'error';
  const isCancelled = progress.stage === 'cancelled';
  const isFinished = progress.stage === 'finishing';

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        {/* Status Icon */}
        <div className="mb-4">
          {isError ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : isCancelled ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
          ) : isFinished ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/10">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          )}
        </div>

        {/* Title & Stage */}
        <h4 className="text-xl font-bold text-white mb-1.5">
          {isError
            ? 'Processing Error'
            : isCancelled
            ? 'Processing Cancelled'
            : isFinished
            ? 'Splitting Complete'
            : 'Splitting Video in Browser'}
        </h4>

        <p className="text-sm text-slate-300 mb-6 font-medium max-w-md">
          {progress.message}
        </p>

        {/* Progress Bar & Numerical Counter */}
        {!isError && (
          <div className="w-full space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="font-semibold text-slate-200">
                Clip {progress.currentClipIndex} of {progress.totalClips}
              </span>
              <span className="font-bold text-indigo-300 text-sm">{progress.percent}%</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                style={{ width: `${progress.percent}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300"
              />
            </div>

            {/* Live Telemetry: Elapsed and Remaining Time */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Elapsed: {progress.elapsedSeconds ?? 0}s</span>
              </div>
              {progress.estimatedRemainingSeconds !== undefined && (
                <div className="flex items-center gap-1 text-indigo-300">
                  <Zap className="w-3 h-3 text-indigo-400" />
                  <span>~{progress.estimatedRemainingSeconds}s remaining</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Stages Badges */}
        {!isError && !isFinished && !isCancelled && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-[10px] text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>WebAssembly Sandbox</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300">
              Zero Network Egress
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-300">
              Preserving Keyframes
            </span>
          </div>
        )}

        {/* Error message detail if present */}
        {isError && progress.error && (
          <div className="w-full mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-left text-xs text-rose-300 leading-relaxed space-y-2">
            <p className="font-semibold text-rose-200">Error Details:</p>
            <p className="font-mono break-words">{progress.error}</p>
            {isStreamCopy && (
              <p className="text-[11px] text-amber-300 pt-1">
                💡 <strong>Tip:</strong> This video's container or keyframe alignment might be incompatible with raw stream copying. Accurate Cut mode re-encodes the boundaries and succeeds on 99.9% of problematic files.
              </p>
            )}
          </div>
        )}

        {/* Error Recovery Buttons */}
        {isError && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isStreamCopy && onRetryWithAccurateCut && (
              <button
                type="button"
                onClick={onRetryWithAccurateCut}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry with Accurate Cut Mode</span>
              </button>
            )}

            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Change Settings</span>
              </button>
            )}
          </div>
        )}

        {/* Cancellation Back to Studio Button */}
        {isCancelled && onDismissError && (
          <button
            type="button"
            onClick={onDismissError}
            className="px-5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            Back to Studio
          </button>
        )}

        {/* Action Button: Cancel */}
        {!isFinished && !isError && !isCancelled && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all active:scale-95 shadow-md"
          >
            Cancel Processing
          </button>
        )}
      </div>
    </div>
  );
};

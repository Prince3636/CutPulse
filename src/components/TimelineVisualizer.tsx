import React, { useRef, useState } from 'react';
import { SplitCalculationResult } from '../types/splitter';
import { formatDuration } from '../utils/formatters';
import { Play, CheckSquare, Square, Info } from 'lucide-react';

interface TimelineVisualizerProps {
  calculation: SplitCalculationResult;
  videoDuration: number;
  currentPlayheadTime?: number;
  onSeek?: (time: number) => void;
  onToggleSegment?: (index: number) => void;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  calculation,
  videoDuration,
  currentPlayheadTime = 0,
  onSeek,
  onToggleSegment,
}) => {
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrubTooltip, setScrubTooltip] = useState<{ x: number; time: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  if (!calculation.isValid || calculation.segments.length === 0) {
    return null;
  }

  const hoveredSegment = hoveredSegmentIndex !== null ? calculation.segments[hoveredSegmentIndex] : null;
  const playheadPercent = Math.max(0, Math.min(100, (currentPlayheadTime / videoDuration) * 100));

  const seekFromClientX = (clientX: number) => {
    if (!barRef.current || !onSeek) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = fraction * videoDuration;
    onSeek(targetTime);
    setScrubTooltip({ x: fraction * 100, time: targetTime });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekFromClientX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      seekFromClientX(e.clientX);
    } else if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, clickX / rect.width));
      setScrubTooltip({ x: fraction * 100, time: fraction * videoDuration });
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setScrubTooltip(null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      seekFromClientX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      seekFromClientX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setScrubTooltip(null);
  };

  const selectedCount = calculation.segments.filter((s) => s.selected !== false).length;
  const segCount = calculation.segments.length;
  const gapClass = segCount > 24 ? 'gap-px p-0.5' : segCount > 12 ? 'gap-0.5 p-1' : 'gap-1 p-1';

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Interactive Timeline Map & Cut Boundaries</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/40 text-indigo-300 font-mono">
            {selectedCount} of {calculation.totalClips} clips active
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>00:00</span>
          <span className="w-12 h-px bg-slate-700" />
          <span className="font-mono text-slate-200">{formatDuration(videoDuration)}</span>
        </div>
      </div>

      {/* Segment Bar Container with Playhead and Touch Support */}
      <div className="relative">
        {/* Floating scrub time tooltip */}
        {scrubTooltip && (
          <div
            style={{ left: `${scrubTooltip.x}%` }}
            className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white text-[10px] font-mono shadow-md z-30 pointer-events-none whitespace-nowrap"
          >
            {formatDuration(scrubTooltip.time, true)}
          </div>
        )}

        <div
          ref={barRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full h-11 sm:h-10 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex ${gapClass} cursor-pointer select-none group touch-manipulation`}
        >
          {calculation.segments.map((seg, idx) => {
            const widthPercent = (seg.duration / videoDuration) * 100;
            const isHovered = hoveredSegmentIndex === idx;
            const isSelected = seg.selected !== false;

            let bgClass = '';
            if (!isSelected) {
              bgClass = 'bg-slate-800/50 text-slate-500 line-through opacity-40 hover:opacity-70';
            } else if (seg.isPartial) {
              bgClass = isHovered ? 'bg-amber-400 text-amber-950' : 'bg-amber-500/85 text-amber-950';
            } else if (isHovered) {
              bgClass = 'bg-indigo-400 text-indigo-950';
            } else {
              bgClass = idx % 2 === 0 ? 'bg-indigo-600/90 text-white' : 'bg-indigo-700/80 text-white';
            }

            return (
              <div
                key={seg.index}
                onMouseEnter={() => setHoveredSegmentIndex(idx)}
                onMouseLeave={() => setHoveredSegmentIndex(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredSegmentIndex(idx);
                  onSeek?.(seg.startTime);
                }}
                style={{ width: `${widthPercent}%` }}
                className={`h-full ${bgClass} rounded-md transition-all cursor-pointer relative flex items-center justify-center overflow-hidden border border-white/5 hover:border-white/20`}
                title={`Clip ${seg.index}: ${formatDuration(seg.startTime)} - ${formatDuration(seg.endTime)} (${formatDuration(seg.duration, true)})`}
              >
                {widthPercent > 5 && (
                  <span className="text-[10px] font-bold select-none truncate px-0.5">
                    #{seg.index}
                  </span>
                )}
              </div>
            );
          })}

          {/* Live Playhead Indicator */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)] pointer-events-none transition-all duration-75 z-20"
          >
            <div className="w-2.5 h-2.5 bg-rose-500 -ml-1 rounded-full shadow-sm -mt-0.5" />
          </div>
        </div>
      </div>

      {/* Interactive Tooltip & Actions */}
      <div className="mt-3 min-h-[26px] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        {hoveredSegment ? (
          <div className="flex flex-wrap items-center gap-2.5 text-indigo-200">
            <span className="font-bold text-white">Clip #{hoveredSegment.index}:</span>
            <span className="font-mono">{formatDuration(hoveredSegment.startTime)} → {formatDuration(hoveredSegment.endTime)}</span>
            <span aria-hidden="true">·</span>
            <span>Duration: <strong className="font-mono text-white">{formatDuration(hoveredSegment.duration, true)}</strong></span>
            {hoveredSegment.isPartial && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 font-medium">
                Remainder Outro
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeek?.(hoveredSegment.startTime);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/50 text-[11px] font-semibold transition-colors ml-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview</span>
            </button>
            {onToggleSegment && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSegment(hoveredSegment.index);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
              >
                {hoveredSegment.selected !== false ? (
                  <>
                    <CheckSquare className="w-3 h-3 text-indigo-400" />
                    <span>Included</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3 h-3 text-slate-500" />
                    <span>Excluded</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Click any segment to jump to its start timestamp · Click anywhere on the bar to scrub</span>
          </div>
        )}

        <div className="text-slate-400 text-right text-xs">
          Total Duration: <strong className="text-white font-mono">{formatDuration(videoDuration)}</strong>
        </div>
      </div>
    </div>
  );
};

import {
  PresetSplitMode,
  SplitCalculationResult,
  SplitEngineSettings,
  SplitModeOption,
  SplitSegment,
} from '../types/splitter';
import { parseTimestampToSeconds } from './formatters';

export const SPLIT_MODE_OPTIONS: SplitModeOption[] = [
  // Social Media Presets
  { id: '15s', label: '15s Story', description: 'Instagram Stories & Snapchat', category: 'social', badge: 'Story' },
  { id: '30s', label: '30s Status', description: 'WhatsApp Status & IG Reels', category: 'social', badge: 'WhatsApp' },
  { id: '60s', label: '60s Short', description: 'YouTube Shorts & TikTok', category: 'social', badge: 'Shorts' },
  { id: '90s', label: '90s Reel', description: 'Long Instagram Reels', category: 'social', badge: 'Reels' },
  { id: '180s', label: '3m TikTok', description: '3-minute TikTok / clips', category: 'social', badge: 'TikTok' },

  // Standard Presets
  { id: '120s', label: 'Every 2m', description: '2-minute video chapters', category: 'preset' },
  { id: '300s', label: 'Every 5m', description: '5-minute episodic chunks', category: 'preset' },
  { id: '600s', label: 'Every 10m', description: '10-minute long-form chapters', category: 'preset' },

  // Equal Division
  { id: 'halves', label: 'Two Halves', description: 'Split evenly into 2 parts', category: 'equal' },
  { id: 'equal_parts', label: 'Equal Parts', description: 'Specify exact number of parts', category: 'equal' },

  // Custom & Timestamps
  { id: 'custom', label: 'Custom Time', description: 'Set custom seconds or minutes', category: 'custom' },
  { id: 'timestamps', label: 'Custom Timestamps', description: 'Cut at specific chapter times', category: 'custom' },
];

function buildResult(
  partial: Omit<SplitCalculationResult, 'estimatedAverageClipSize' | 'isWhatsAppSafe'>,
  videoDuration: number,
  sourceFileSize?: number
): SplitCalculationResult {
  if (!sourceFileSize || sourceFileSize <= 0 || !videoDuration || videoDuration <= 0 || partial.segments.length === 0) {
    return partial;
  }

  const enrichedSegments = partial.segments.map((seg) => ({
    ...seg,
    estimatedSize: Math.round((seg.duration / videoDuration) * sourceFileSize),
  }));

  const estimatedAverageClipSize = Math.round(sourceFileSize / enrichedSegments.length);
  const isWhatsAppSafe = enrichedSegments.every((s) => (s.estimatedSize || 0) <= 16 * 1024 * 1024);

  return {
    ...partial,
    segments: enrichedSegments,
    estimatedAverageClipSize,
    isWhatsAppSafe,
  };
}

/**
 * Calculates segments, clip count, and durations based on video duration and split settings.
 */
export function calculateSplitSegments(
  videoDuration: number,
  settings: SplitEngineSettings,
  sourceFileSize?: number
): SplitCalculationResult {
  if (!videoDuration || isNaN(videoDuration) || videoDuration <= 0) {
    return {
      mode: settings.mode,
      segments: [],
      totalClips: 0,
      finalClipDuration: 0,
      originalDuration: 0,
      isValid: false,
      validationError: 'Invalid video duration.',
    };
  }

  const { mode, equalParts, customDuration, customUnit, timestampList } = settings;

  // 1. Equal Halves
  if (mode === 'halves') {
    const halfDuration = videoDuration / 2;
    const segments: SplitSegment[] = [
      {
        index: 1,
        startTime: 0,
        endTime: halfDuration,
        duration: halfDuration,
        isPartial: false,
        selected: true,
      },
      {
        index: 2,
        startTime: halfDuration,
        endTime: videoDuration,
        duration: videoDuration - halfDuration,
        isPartial: false,
        selected: true,
      },
    ];

    return buildResult(
      {
        mode,
        segments,
        totalClips: 2,
        equalPartsCount: 2,
        finalClipDuration: videoDuration - halfDuration,
        originalDuration: videoDuration,
        isValid: true,
      },
      videoDuration,
      sourceFileSize
    );
  }

  // 2. Equal N Parts
  if (mode === 'equal_parts') {
    const partsCount = Math.floor(equalParts);
    if (isNaN(partsCount) || partsCount < 2) {
      return {
        mode,
        segments: [],
        totalClips: 0,
        finalClipDuration: 0,
        originalDuration: videoDuration,
        isValid: false,
        validationError: 'Equal parts must be at least 2.',
      };
    }

    const partDuration = videoDuration / partsCount;
    const segments: SplitSegment[] = [];

    for (let i = 0; i < partsCount; i++) {
      const startTime = i * partDuration;
      // Last clip ends exactly at videoDuration to eliminate floating point rounding
      const endTime = i === partsCount - 1 ? videoDuration : (i + 1) * partDuration;
      segments.push({
        index: i + 1,
        startTime,
        endTime,
        duration: endTime - startTime,
        isPartial: false,
        selected: true,
      });
    }

    return buildResult(
      {
        mode,
        segments,
        totalClips: partsCount,
        equalPartsCount: partsCount,
        finalClipDuration: segments[segments.length - 1].duration,
        originalDuration: videoDuration,
        isValid: true,
      },
      videoDuration,
      sourceFileSize
    );
  }

  // 3. Custom Timestamps / Cue Points Mode
  if (mode === 'timestamps') {
    if (!timestampList || !timestampList.trim()) {
      return {
        mode,
        segments: [],
        totalClips: 0,
        finalClipDuration: 0,
        originalDuration: videoDuration,
        isValid: false,
        validationError: 'Enter split timestamps (e.g. "0:30, 1:15, 2:40").',
      };
    }

    // Split by comma, semicolon, space, or newline
    const rawTokens = timestampList
      .split(/[,;\n\r]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedSeconds: number[] = [];
    for (const token of rawTokens) {
      const parsed = parseTimestampToSeconds(token);
      if (parsed !== null && parsed > 0 && parsed < videoDuration) {
        parsedSeconds.push(parsed);
      }
    }

    // Deduplicate and sort
    const uniqueSortedPoints = Array.from(new Set(parsedSeconds)).sort((a, b) => a - b);

    if (uniqueSortedPoints.length === 0) {
      return {
        mode,
        segments: [],
        totalClips: 0,
        finalClipDuration: 0,
        originalDuration: videoDuration,
        isValid: false,
        validationError: `No valid split timestamps found between 0s and ${videoDuration.toFixed(1)}s.`,
      };
    }

    // Build segments: 0 -> p1, p1 -> p2, ..., pn -> videoDuration
    const allCuts = [0, ...uniqueSortedPoints, videoDuration];
    const segments: SplitSegment[] = [];

    for (let i = 0; i < allCuts.length - 1; i++) {
      const start = allCuts[i];
      const end = allCuts[i + 1];
      const duration = end - start;
      if (duration > 0.05) {
        segments.push({
          index: segments.length + 1,
          startTime: start,
          endTime: end,
          duration,
          isPartial: false,
          selected: true,
        });
      }
    }

    return buildResult(
      {
        mode,
        segments,
        totalClips: segments.length,
        finalClipDuration: segments[segments.length - 1].duration,
        originalDuration: videoDuration,
        isValid: segments.length > 0,
      },
      videoDuration,
      sourceFileSize
    );
  }

  // 4. Interval Modes (Presets or Custom)
  let intervalSeconds = 0;

  switch (mode) {
    case '15s':
      intervalSeconds = 15;
      break;
    case '30s':
      intervalSeconds = 30;
      break;
    case '60s':
      intervalSeconds = 60;
      break;
    case '90s':
      intervalSeconds = 90;
      break;
    case '120s':
      intervalSeconds = 120;
      break;
    case '180s':
      intervalSeconds = 180;
      break;
    case '300s':
      intervalSeconds = 300;
      break;
    case '600s':
      intervalSeconds = 600;
      break;
    case 'custom': {
      if (isNaN(customDuration) || customDuration <= 0) {
        return {
          mode,
          segments: [],
          totalClips: 0,
          finalClipDuration: 0,
          originalDuration: videoDuration,
          isValid: false,
          validationError: 'Custom interval must be greater than zero.',
        };
      }
      intervalSeconds = customUnit === 'minutes' ? customDuration * 60 : customDuration;
      break;
    }
  }

  if (intervalSeconds <= 0) {
    return {
      mode,
      segments: [],
      totalClips: 0,
      finalClipDuration: 0,
      originalDuration: videoDuration,
      isValid: false,
      validationError: 'Invalid interval duration.',
    };
  }

  const expectedCount = Math.ceil(videoDuration / intervalSeconds);
  const segments: SplitSegment[] = [];

  for (let i = 0; i < expectedCount; i++) {
    const startTime = i * intervalSeconds;
    const rawEndTime = (i + 1) * intervalSeconds;
    const endTime = Math.min(rawEndTime, videoDuration);
    const duration = endTime - startTime;

    // Guard against zero-length clip at the very boundary
    if (duration > 0.001) {
      const isPartial = endTime >= videoDuration && duration < intervalSeconds - 0.05;
      segments.push({
        index: segments.length + 1,
        startTime,
        endTime,
        duration,
        isPartial,
        selected: true,
      });
    }
  }

  const finalClipDuration = segments.length > 0 ? segments[segments.length - 1].duration : 0;

  return buildResult(
    {
      mode,
      segments,
      totalClips: segments.length,
      intervalDuration: intervalSeconds,
      finalClipDuration,
      originalDuration: videoDuration,
      isValid: segments.length > 0,
    },
    videoDuration,
    sourceFileSize
  );
}

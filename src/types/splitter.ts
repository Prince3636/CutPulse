export type PresetSplitMode =
  | '15s'
  | '30s'
  | '60s'
  | '90s'
  | '120s'
  | '180s'
  | '300s'
  | '600s'
  | 'halves'
  | 'equal_parts'
  | 'custom'
  | 'timestamps';

export interface SplitModeOption {
  id: PresetSplitMode;
  label: string;
  description: string;
  category: 'social' | 'preset' | 'equal' | 'custom';
  badge?: string;
}

export interface VideoMetadata {
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  hasAudio: boolean;
  objectUrl: string;
  bitrate?: number;
}

export interface SplitSegment {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  isPartial: boolean;
  selected?: boolean;
  estimatedSize?: number;
}

export interface SplitCalculationResult {
  mode: PresetSplitMode;
  segments: SplitSegment[];
  totalClips: number;
  intervalDuration?: number;
  equalPartsCount?: number;
  finalClipDuration: number;
  originalDuration: number;
  isValid: boolean;
  validationError?: string;
  estimatedAverageClipSize?: number;
  isWhatsAppSafe?: boolean;
}

export interface SplitEngineSettings {
  mode: PresetSplitMode;
  equalParts: number;
  customDuration: number;
  customUnit: 'seconds' | 'minutes';
  cutStrategy: 'stream_copy' | 'accurate_cut';
  includeAudio?: boolean;
  customPrefix?: string;
  timestampList?: string;
  accurateQuality?: 'high' | 'balanced' | 'fast';
}

export interface GeneratedClip {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  blob: Blob;
  objectUrl: string;
  filename: string;
  size: number;
}

export interface SplitProgress {
  stage: 'idle' | 'loading_engine' | 'reading_file' | 'processing' | 'finishing' | 'cancelled' | 'error';
  currentClipIndex: number;
  totalClips: number;
  percent: number;
  message: string;
  error?: string;
  elapsedSeconds?: number;
  estimatedRemainingSeconds?: number;
}

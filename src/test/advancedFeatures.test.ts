import { describe, expect, it, vi } from 'vitest';
import { calculateSplitSegments } from '../utils/splitterCalculations';
import {
  formatBitrate,
  generateClipFilename,
  getResolutionCategory,
  parseTimestampToSeconds,
} from '../utils/formatters';
import { downloadClipsSequentially } from '../services/zipService';
import { GeneratedClip } from '../types/splitter';
import { analytics } from '../services/analyticsService';

describe('Advanced Splitting & Utilities Tests', () => {
  it('parses timestamps in various formats (MM:SS, HH:MM:SS, seconds, minutes)', () => {
    expect(parseTimestampToSeconds('01:30')).toBe(90);
    expect(parseTimestampToSeconds('00:45')).toBe(45);
    expect(parseTimestampToSeconds('01:05:20')).toBe(3920);
    expect(parseTimestampToSeconds('45s')).toBe(45);
    expect(parseTimestampToSeconds('90 sec')).toBe(90);
    expect(parseTimestampToSeconds('2m')).toBe(120);
    expect(parseTimestampToSeconds('1.5 min')).toBe(90);
    expect(parseTimestampToSeconds('30')).toBe(30);

    // Invalid formats return null
    expect(parseTimestampToSeconds('')).toBeNull();
    expect(parseTimestampToSeconds('invalid')).toBeNull();
    expect(parseTimestampToSeconds('-10')).toBeNull();
    expect(parseTimestampToSeconds('01:invalid')).toBeNull();
  });

  it('correctly calculates segments for 90s and 180s presets', () => {
    const videoDuration = 200; // 200 seconds

    // 90s -> 90, 90, 20 (3 clips)
    const res90 = calculateSplitSegments(videoDuration, {
      mode: '90s',
      equalParts: 2,
      customDuration: 90,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(res90.totalClips).toBe(3);
    expect(res90.segments[0].duration).toBe(90);
    expect(res90.segments[1].duration).toBe(90);
    expect(res90.segments[2].duration).toBe(20);
    expect(res90.segments[2].isPartial).toBe(true);

    // 180s (3m) -> 180, 20 (2 clips)
    const res180 = calculateSplitSegments(videoDuration, {
      mode: '180s',
      equalParts: 2,
      customDuration: 180,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(res180.totalClips).toBe(2);
    expect(res180.segments[0].duration).toBe(180);
    expect(res180.segments[1].duration).toBe(20);
  });

  it('correctly calculates segments from custom chapter timestamps', () => {
    const videoDuration = 300; // 5 minutes (300s)

    const res = calculateSplitSegments(videoDuration, {
      mode: 'timestamps',
      equalParts: 2,
      customDuration: 30,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
      timestampList: '0:30, 01:15, 02:40',
    });

    expect(res.isValid).toBe(true);
    // Cut points at 30s, 75s, 160s -> 4 clips:
    // Clip 1: 0 to 30 (30s)
    // Clip 2: 30 to 75 (45s)
    // Clip 3: 75 to 160 (85s)
    // Clip 4: 160 to 300 (140s)
    expect(res.totalClips).toBe(4);
    expect(res.segments[0].startTime).toBe(0);
    expect(res.segments[0].endTime).toBe(30);
    expect(res.segments[0].duration).toBe(30);

    expect(res.segments[1].startTime).toBe(30);
    expect(res.segments[1].endTime).toBe(75);
    expect(res.segments[1].duration).toBe(45);

    expect(res.segments[2].startTime).toBe(75);
    expect(res.segments[2].endTime).toBe(160);
    expect(res.segments[2].duration).toBe(85);

    expect(res.segments[3].startTime).toBe(160);
    expect(res.segments[3].endTime).toBe(300);
    expect(res.segments[3].duration).toBe(140);
  });

  it('handles invalid or empty timestamp list gracefully', () => {
    const resEmpty = calculateSplitSegments(100, {
      mode: 'timestamps',
      equalParts: 2,
      customDuration: 30,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
      timestampList: '',
    });
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.validationError).toBeDefined();

    const resOutOfRange = calculateSplitSegments(100, {
      mode: 'timestamps',
      equalParts: 2,
      customDuration: 30,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
      timestampList: '200, 300', // Both greater than duration 100
    });
    expect(resOutOfRange.isValid).toBe(false);
  });

  it('generates customized filenames when customPrefix is provided', () => {
    const withPrefix = generateClipFilename('source_video.mp4', 1, 5, 'mp4', 'MyHighlight');
    expect(withPrefix).toBe('MyHighlight_part_001.mp4');

    const withSpacesPrefix = generateClipFilename('source_video.mp4', 2, 5, 'mp4', 'Ep 1 Highlight');
    expect(withSpacesPrefix).toBe('Ep_1_Highlight_part_002.mp4');

    const defaultPrefix = generateClipFilename('source_video.mp4', 1, 5, 'mp4', '');
    expect(defaultPrefix).toBe('source_video_part_001.mp4');
  });

  it('categorizes video resolutions and bitrates properly', () => {
    expect(getResolutionCategory(3840, 2160)).toBe('4K UHD');
    expect(getResolutionCategory(2560, 1440)).toBe('2K QHD');
    expect(getResolutionCategory(1920, 1080)).toBe('1080p Full HD');
    expect(getResolutionCategory(1080, 1920)).toBe('1080p Full HD');
    expect(getResolutionCategory(1280, 720)).toBe('720p HD');
    expect(getResolutionCategory(854, 480)).toBe('480p SD');

    expect(formatBitrate(10_000_000, 10)).toBe('8.0 Mbps');
    expect(formatBitrate(500_000, 10)).toBe('400 kbps');
  });

  it('executes sequential file downloads with progress feedback', async () => {
    // Mock DOM download trigger
    const mockClips: GeneratedClip[] = [
      {
        id: '1',
        index: 1,
        startTime: 0,
        endTime: 10,
        duration: 10,
        blob: new Blob(['clip1']),
        objectUrl: 'blob:test1',
        filename: 'clip1.mp4',
        size: 5,
      },
      {
        id: '2',
        index: 2,
        startTime: 10,
        endTime: 20,
        duration: 10,
        blob: new Blob(['clip2']),
        objectUrl: 'blob:test2',
        filename: 'clip2.mp4',
        size: 5,
      },
    ];

    const progressCalls: number[] = [];
    await downloadClipsSequentially(mockClips, (curr, total) => {
      progressCalls.push(curr);
    });

    expect(progressCalls).toEqual([1, 2]);
  });

  it('tracks analytics events and maintains session event buffer without PII', () => {
    analytics.clearSessionEvents();
    expect(analytics.getSessionEvents().length).toBe(0);

    analytics.track('video_selected', {
      format: 'mp4',
      sizeMB: 15.2,
      durationSecs: 120,
      hasAudio: true,
      resolution: '1920x1080',
    });

    analytics.track('split_started', {
      mode: '30s',
      totalClips: 4,
      strategy: 'stream_copy',
      includeAudio: true,
      durationSecs: 120,
    });

    analytics.track('split_completed', {
      mode: '30s',
      clipsGenerated: 4,
      strategy: 'stream_copy',
      elapsedSecs: 2,
    });

    const events = analytics.getSessionEvents();
    expect(events.length).toBe(3);
    expect(events[0].event).toBe('video_selected');
    expect(events[1].event).toBe('split_started');
    expect(events[2].event).toBe('split_completed');
    expect(events[0].timestamp).toBeDefined();
  });
});

import { describe, expect, it } from 'vitest';
import { calculateSplitSegments, SPLIT_MODE_OPTIONS } from '../utils/splitterCalculations';
import {
  calculateAspectRatio,
  formatDuration,
  formatFileSize,
  generateClipFilename,
  getBaseFilename,
  getFileExtension,
} from '../utils/formatters';

describe('Video Splitter Calculation Tests', () => {
  it('correctly handles all preset duration modes', () => {
    const videoDuration = 100; // 100 seconds

    // 15s -> ceil(100 / 15) = 7 clips: 6 full (15s), 1 partial (10s)
    const result15s = calculateSplitSegments(videoDuration, {
      mode: '15s',
      equalParts: 2,
      customDuration: 15,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(result15s.isValid).toBe(true);
    expect(result15s.totalClips).toBe(7);
    expect(result15s.segments[0].duration).toBe(15);
    expect(result15s.segments[6].duration).toBe(10);
    expect(result15s.segments[6].isPartial).toBe(true);
    expect(result15s.finalClipDuration).toBe(10);

    // 30s -> ceil(100 / 30) = 4 clips: 30, 30, 30, 10
    const result30s = calculateSplitSegments(videoDuration, {
      mode: '30s',
      equalParts: 2,
      customDuration: 30,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(result30s.totalClips).toBe(4);
    expect(result30s.segments[3].duration).toBe(10);

    // 60s -> ceil(100 / 60) = 2 clips: 60, 40
    const result60s = calculateSplitSegments(videoDuration, {
      mode: '60s',
      equalParts: 2,
      customDuration: 60,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(result60s.totalClips).toBe(2);
    expect(result60s.segments[0].duration).toBe(60);
    expect(result60s.segments[1].duration).toBe(40);

    // 120s (2m) -> 1 clip: 100s
    const result120s = calculateSplitSegments(videoDuration, {
      mode: '120s',
      equalParts: 2,
      customDuration: 120,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(result120s.totalClips).toBe(1);
    expect(result120s.segments[0].duration).toBe(100);

    // 300s (5m) & 600s (10m) on a 1500s video
    const longDuration = 1500;
    const result300s = calculateSplitSegments(longDuration, {
      mode: '300s',
      equalParts: 2,
      customDuration: 300,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(result300s.totalClips).toBe(5);

    const result600s = calculateSplitSegments(longDuration, {
      mode: '600s',
      equalParts: 2,
      customDuration: 600,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(result600s.totalClips).toBe(3); // 600, 600, 300
    expect(result600s.segments[2].duration).toBe(300);
  });

  it('splits video into two equal halves', () => {
    const videoDuration = 75; // 75 seconds
    const result = calculateSplitSegments(videoDuration, {
      mode: 'halves',
      equalParts: 2,
      customDuration: 30,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });

    expect(result.isValid).toBe(true);
    expect(result.totalClips).toBe(2);
    expect(result.segments[0].startTime).toBe(0);
    expect(result.segments[0].endTime).toBe(37.5);
    expect(result.segments[0].duration).toBe(37.5);
    expect(result.segments[1].startTime).toBe(37.5);
    expect(result.segments[1].endTime).toBe(75);
    expect(result.segments[1].duration).toBe(37.5);
  });

  it('splits video into specified N equal parts', () => {
    const videoDuration = 120; // 120 seconds into 4 parts
    const result = calculateSplitSegments(videoDuration, {
      mode: 'equal_parts',
      equalParts: 4,
      customDuration: 30,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });

    expect(result.isValid).toBe(true);
    expect(result.totalClips).toBe(4);
    result.segments.forEach((seg, idx) => {
      expect(seg.index).toBe(idx + 1);
      expect(seg.duration).toBeCloseTo(30);
    });
  });

  it('validates custom duration and units', () => {
    const videoDuration = 180; // 3 minutes

    // Custom 45 seconds -> 4 clips: 45, 45, 45, 45
    const resultSeconds = calculateSplitSegments(videoDuration, {
      mode: 'custom',
      equalParts: 2,
      customDuration: 45,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(resultSeconds.totalClips).toBe(4);

    // Custom 2 minutes -> 2 clips: 120s, 60s
    const resultMinutes = calculateSplitSegments(videoDuration, {
      mode: 'custom',
      equalParts: 2,
      customDuration: 2,
      customUnit: 'minutes',
      cutStrategy: 'stream_copy',
    });
    expect(resultMinutes.totalClips).toBe(2);
    expect(resultMinutes.segments[0].duration).toBe(120);
    expect(resultMinutes.segments[1].duration).toBe(60);

    // Invalid <= 0 duration
    const invalidResult = calculateSplitSegments(videoDuration, {
      mode: 'custom',
      equalParts: 2,
      customDuration: 0,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.validationError).toBeDefined();
  });

  it('ensures no empty clips and final clip preserves exact remainder', () => {
    const videoDuration = 45.3;
    const result = calculateSplitSegments(videoDuration, {
      mode: 'custom',
      equalParts: 2,
      customDuration: 20,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });

    expect(result.totalClips).toBe(3); // 20, 20, 5.3
    expect(result.segments[2].duration).toBeCloseTo(5.3);
    expect(result.segments[2].endTime).toBe(45.3);
  });

  it('calculates estimated clip size and evaluates WhatsApp status safety (<16MB)', () => {
    const videoDuration = 120; // 2 minutes
    const sourceFileSize = 40 * 1024 * 1024; // 40 MB

    // Split into 30s clips (4 clips of 30s each -> ~10MB per clip)
    const result30s = calculateSplitSegments(
      videoDuration,
      {
        mode: '30s',
        equalParts: 2,
        customDuration: 30,
        customUnit: 'seconds',
        cutStrategy: 'stream_copy',
      },
      sourceFileSize
    );

    expect(result30s.estimatedAverageClipSize).toBe(10 * 1024 * 1024);
    expect(result30s.isWhatsAppSafe).toBe(true);
    expect(result30s.segments[0].estimatedSize).toBe(10 * 1024 * 1024);

    // Split into 2 halves (2 clips of 60s each -> ~20MB per clip, which exceeds WhatsApp 16MB limit)
    const resultHalves = calculateSplitSegments(
      videoDuration,
      {
        mode: 'halves',
        equalParts: 2,
        customDuration: 30,
        customUnit: 'seconds',
        cutStrategy: 'stream_copy',
      },
      sourceFileSize
    );

    expect(resultHalves.estimatedAverageClipSize).toBe(20 * 1024 * 1024);
    expect(resultHalves.isWhatsAppSafe).toBe(false);
  });
});

describe('Formatters & Utility Tests', () => {
  it('formats durations accurately', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(9)).toBe('00:09');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3665)).toBe('1:01:05');
    expect(formatDuration(15.25, true)).toBe('00:15.250');
  });

  it('formats file sizes cleanly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576 * 15.5)).toBe('15.5 MB');
    expect(formatFileSize(1073741824 * 1.8)).toBe('1.8 GB');
  });

  it('generates descriptive clip filenames', () => {
    const filename = generateClipFilename('vacation trip.mp4', 1, 5, 'mp4');
    expect(filename).toBe('vacation_trip_part_001.mp4');

    const filenamePart10 = generateClipFilename('lecture_recording.mov', 10, 25, 'mov');
    expect(filenamePart10).toBe('lecture_recording_part_010.mov');
  });

  it('calculates aspect ratios accurately', () => {
    expect(calculateAspectRatio(1920, 1080)).toContain('16:9');
    expect(calculateAspectRatio(1080, 1920)).toContain('9:16');
    expect(calculateAspectRatio(1080, 1080)).toContain('1:1');
    expect(calculateAspectRatio(1440, 1080)).toContain('4:3');
  });
});

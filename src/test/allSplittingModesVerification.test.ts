import { describe, expect, it } from 'vitest';
import { calculateSplitSegments } from '../utils/splitterCalculations';
import { PresetSplitMode } from '../types/splitter';

describe('Exhaustive 9 Splitting Modes Verification', () => {
  const modes: PresetSplitMode[] = [
    '15s',
    '30s',
    '60s',
    '120s',
    '300s',
    '600s',
    'halves',
    'equal_parts',
    'custom',
  ];

  it('verifies all 9 modes calculate contiguous non-overlapping segments without gaps', () => {
    // 30-minute video (1800 seconds)
    const longDuration = 1800;

    modes.forEach((mode) => {
      const result = calculateSplitSegments(longDuration, {
        mode,
        equalParts: 5,
        customDuration: 45,
        customUnit: 'seconds',
        cutStrategy: 'stream_copy',
      });

      expect(result.isValid).toBe(true);
      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.totalClips).toBe(result.segments.length);

      // Verify continuity: segment[i].endTime === segment[i+1].startTime
      for (let i = 0; i < result.segments.length; i++) {
        const seg = result.segments[i];
        expect(seg.duration).toBeGreaterThan(0);
        if (i > 0) {
          expect(seg.startTime).toBeCloseTo(result.segments[i - 1].endTime, 4);
        } else {
          expect(seg.startTime).toBe(0);
        }
      }

      // Verify final clip ends at video duration
      const lastSeg = result.segments[result.segments.length - 1];
      expect(lastSeg.endTime).toBeCloseTo(longDuration, 4);
    });
  });

  it('verifies exact clip counts for all intervals on 65-second video', () => {
    const dur = 65;

    // 15s -> 15, 15, 15, 15, 5 (5 clips)
    const res15 = calculateSplitSegments(dur, { mode: '15s', equalParts: 2, customDuration: 15, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res15.totalClips).toBe(5);
    expect(res15.segments[4].duration).toBe(5);
    expect(res15.segments[4].isPartial).toBe(true);

    // 30s -> 30, 30, 5 (3 clips)
    const res30 = calculateSplitSegments(dur, { mode: '30s', equalParts: 2, customDuration: 30, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res30.totalClips).toBe(3);
    expect(res30.segments[2].duration).toBe(5);
    expect(res30.segments[2].isPartial).toBe(true);

    // 60s -> 60, 5 (2 clips)
    const res60 = calculateSplitSegments(dur, { mode: '60s', equalParts: 2, customDuration: 60, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res60.totalClips).toBe(2);
    expect(res60.segments[0].duration).toBe(60);
    expect(res60.segments[1].duration).toBe(5);

    // 2m (120s) -> 1 clip (65s)
    const res120 = calculateSplitSegments(dur, { mode: '120s', equalParts: 2, customDuration: 120, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res120.totalClips).toBe(1);
    expect(res120.segments[0].duration).toBe(65);

    // 5m (300s) -> 1 clip (65s)
    const res300 = calculateSplitSegments(dur, { mode: '300s', equalParts: 2, customDuration: 300, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res300.totalClips).toBe(1);

    // 10m (600s) -> 1 clip (65s)
    const res600 = calculateSplitSegments(dur, { mode: '600s', equalParts: 2, customDuration: 600, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res600.totalClips).toBe(1);

    // Two Halves -> 32.5s, 32.5s
    const resHalves = calculateSplitSegments(dur, { mode: 'halves', equalParts: 2, customDuration: 30, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resHalves.totalClips).toBe(2);
    expect(resHalves.segments[0].duration).toBe(32.5);
    expect(resHalves.segments[1].duration).toBe(32.5);

    // Equal 5 Parts -> 13s, 13s, 13s, 13s, 13s
    const res5Parts = calculateSplitSegments(dur, { mode: 'equal_parts', equalParts: 5, customDuration: 30, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(res5Parts.totalClips).toBe(5);
    res5Parts.segments.forEach((s) => expect(s.duration).toBeCloseTo(13));

    // Custom 25s -> 25, 25, 15 (3 clips)
    const resCustom = calculateSplitSegments(dur, { mode: 'custom', equalParts: 2, customDuration: 25, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resCustom.totalClips).toBe(3);
    expect(resCustom.segments[2].duration).toBe(15);
  });

  it('correctly handles edge cases: short video, fractional seconds, invalid parameters', () => {
    // Video shorter than interval: 7.2s video with 15s interval -> 1 clip of 7.2s (partial interval)
    const resShort = calculateSplitSegments(7.2, { mode: '15s', equalParts: 2, customDuration: 15, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resShort.totalClips).toBe(1);
    expect(resShort.segments[0].duration).toBe(7.2);
    expect(resShort.segments[0].isPartial).toBe(true);

    // Video exactly equal to interval: 30.0s with 30s preset -> 1 clip of 30.0s, no empty second clip
    const resExact = calculateSplitSegments(30.0, { mode: '30s', equalParts: 2, customDuration: 30, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resExact.totalClips).toBe(1);
    expect(resExact.segments[0].duration).toBe(30.0);

    // Negative duration or zero duration
    const resZero = calculateSplitSegments(0, { mode: '30s', equalParts: 2, customDuration: 30, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resZero.isValid).toBe(false);
    expect(resZero.totalClips).toBe(0);

    // Equal parts < 2
    const resBadParts = calculateSplitSegments(60, { mode: 'equal_parts', equalParts: 1, customDuration: 30, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resBadParts.isValid).toBe(false);
    expect(resBadParts.validationError).toContain('at least 2');

    // Custom duration <= 0
    const resBadCustom = calculateSplitSegments(60, { mode: 'custom', equalParts: 2, customDuration: -5, customUnit: 'seconds', cutStrategy: 'stream_copy' });
    expect(resBadCustom.isValid).toBe(false);
  });
});

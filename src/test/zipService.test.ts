import { describe, expect, it } from 'vitest';
import { createClipsZip } from '../services/zipService';
import { GeneratedClip } from '../types/splitter';
import JSZip from 'jszip';

describe('Zip Service Integration Tests', () => {
  it('packages generated clips into a valid ordered ZIP archive with manifest', async () => {
    const dummyClips: GeneratedClip[] = [
      {
        id: 'c2',
        index: 2,
        startTime: 30,
        endTime: 60,
        duration: 30,
        blob: new Blob(['fake video part 2 content'], { type: 'video/mp4' }),
        objectUrl: 'blob:clip2',
        filename: 'my_video_part_002.mp4',
        size: 25,
      },
      {
        id: 'c1',
        index: 1,
        startTime: 0,
        endTime: 30,
        duration: 30,
        blob: new Blob(['fake video part 1 content'], { type: 'video/mp4' }),
        objectUrl: 'blob:clip1',
        filename: 'my_video_part_001.mp4',
        size: 25,
      },
      {
        id: 'c3',
        index: 3,
        startTime: 60,
        endTime: 75,
        duration: 15,
        blob: new Blob(['fake video part 3 content'], { type: 'video/mp4' }),
        objectUrl: 'blob:clip3',
        filename: 'my_video_part_003.mp4',
        size: 15,
      },
    ];

    let progressCalls = 0;
    const zipBlob = await createClipsZip('my_video.mp4', dummyClips, (p) => {
      progressCalls++;
      expect(p.percent).toBeGreaterThanOrEqual(0);
      expect(p.percent).toBeLessThanOrEqual(100);
    });

    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);

    // Read back zip to verify file entries
    const zip = await JSZip.loadAsync(zipBlob);
    const filenames = Object.keys(zip.files);

    expect(filenames).toContain('my_video_part_001.mp4');
    expect(filenames).toContain('my_video_part_002.mp4');
    expect(filenames).toContain('my_video_part_003.mp4');
    expect(filenames).toContain('README_splits.txt');

    const manifestText = await zip.file('README_splits.txt')?.async('string');
    expect(manifestText).toContain('Source Video: my_video.mp4');
    expect(manifestText).toContain('Total Split Clips: 3');
    expect(manifestText).toContain('Watermark: None');
  });

  it('rejects empty clips gracefully', async () => {
    await expect(createClipsZip('empty.mp4', [])).rejects.toThrow('No clips available');
  });
});

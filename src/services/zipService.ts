import JSZip from 'jszip';
import { GeneratedClip } from '../types/splitter';
import { formatDuration, formatFileSize, getBaseFilename } from '../utils/formatters';

export interface ZipProgress {
  percent: number;
  currentFile?: string;
}

/**
 * Packs all generated clips into a ZIP file with progress feedback.
 */
export async function createClipsZip(
  originalFilename: string,
  clips: GeneratedClip[],
  onProgress?: (progress: ZipProgress) => void
): Promise<Blob> {
  if (!clips || clips.length === 0) {
    throw new Error('No clips available to package into ZIP.');
  }

  const zip = new JSZip();

  // Sort clips strictly by index to ensure proper sequential ordering
  const sortedClips = [...clips].sort((a, b) => a.index - b.index);

  // Add a clean manifest file
  const baseName = getBaseFilename(originalFilename);
  const totalDuration = sortedClips.reduce((acc, c) => acc + c.duration, 0);
  const totalBytes = sortedClips.reduce((acc, c) => acc + c.size, 0);

  let manifestContent = `CutPulse Video Splitter — Export Manifest\n`;
  manifestContent += `===========================================\n`;
  manifestContent += `Source Video: ${originalFilename}\n`;
  manifestContent += `Total Split Clips: ${sortedClips.length}\n`;
  manifestContent += `Cumulative Duration: ${formatDuration(totalDuration)}\n`;
  manifestContent += `Total Size: ${formatFileSize(totalBytes)}\n`;
  manifestContent += `Export Date: ${new Date().toISOString()}\n`;
  manifestContent += `Watermark: None (Original quality stream-copy)\n\n`;
  manifestContent += `Clip Listing:\n`;
  manifestContent += `-------------------------------------------\n`;

  for (const clip of sortedClips) {
    manifestContent += `#${clip.index.toString().padStart(3, '0')} | ${clip.filename} | ${formatDuration(clip.startTime)} - ${formatDuration(clip.endTime)} (${formatDuration(clip.duration)}) | ${formatFileSize(clip.size)}\n`;
    // Add clip blob to zip
    zip.file(clip.filename, clip.blob, { binary: true });
  }

  manifestContent += `\nProcessed 100% locally on your device with CutPulse.\n`;
  zip.file('README_splits.txt', manifestContent);

  // Generate ZIP blob with progress callback
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE', // Store without re-compressing already compressed video streams (much faster and avoids CPU memory spikes)
    },
    (metadata) => {
      onProgress?.({
        percent: Math.round(metadata.percent),
        currentFile: metadata.currentFile || undefined,
      });
    }
  );

  return zipBlob;
}

/**
 * Triggers a native browser file download for a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Downloads multiple clips individually with a staggered delay to prevent browser download throttles.
 */
export async function downloadClipsSequentially(
  clips: GeneratedClip[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const total = clips.length;
  for (let i = 0; i < total; i++) {
    const clip = clips[i];
    onProgress?.(i + 1, total);
    triggerBlobDownload(clip.blob, clip.filename);
    // 350ms delay between download triggers so modern browsers don't block them as popup spam
    await new Promise((res) => setTimeout(res, 350));
  }
}

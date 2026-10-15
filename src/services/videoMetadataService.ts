import { VideoMetadata } from '../types/splitter';
import { calculateAspectRatio } from '../utils/formatters';

const MAX_WARN_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB warning threshold
const MAX_RECOMMENDED_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export function validateVideoFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Basic size check
  if (file.size === 0) {
    return { valid: false, error: 'Selected file is empty (0 bytes).' };
  }

  let warning: string | undefined;
  if (file.size > MAX_RECOMMENDED_SIZE_BYTES) {
    warning = 'File is over 2 GB. Browser memory may become constrained during heavy processing.';
  } else if (file.size > MAX_WARN_SIZE_BYTES) {
    warning = 'File is large (over 500 MB). Processing may take slightly longer depending on your device.';
  }

  return { valid: true, warning };
}

/**
 * Probes the video file using browser video element and Web Audio API
 * to extract duration, dimensions, aspect ratio, and audio presence.
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid video file.');
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise<VideoMetadata>((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let cleanupDone = false;
    const cleanup = () => {
      if (!cleanupDone) {
        cleanupDone = true;
        video.src = '';
        video.load();
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Video metadata loading timed out. The file may be corrupt or encoded in an unsupported format.'));
    }, 25000);

    const finalizeMetadata = async (duration: number, width: number, height: number) => {
      clearTimeout(timeout);

      if (isNaN(duration) || duration <= 0) {
        cleanup();
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to determine video duration. The container header might be corrupt or incomplete.'));
        return;
      }

      // Check audio track presence
      let hasAudio = false;
      try {
        const anyVideo = video as unknown as {
          webkitAudioDecodedByteCount?: number;
          audioTracks?: { length: number };
          mozHasAudio?: boolean;
        };

        if (anyVideo.audioTracks && anyVideo.audioTracks.length > 0) {
          hasAudio = true;
        } else if (typeof anyVideo.mozHasAudio !== 'undefined') {
          hasAudio = anyVideo.mozHasAudio;
        } else if (typeof anyVideo.webkitAudioDecodedByteCount !== 'undefined') {
          hasAudio = true;
        } else {
          // Probe first chunk with AudioContext
          hasAudio = await probeAudioWithAudioContext(file);
        }
      } catch {
        hasAudio = true;
      }

      cleanup();

      resolve({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'video/mp4',
        duration,
        width,
        height,
        aspectRatio: calculateAspectRatio(width, height),
        hasAudio,
        objectUrl,
        bitrate: duration > 0 ? (file.size * 8) / duration : undefined,
      });
    };

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      let duration = video.duration;

      if (duration === Infinity) {
        video.currentTime = 1e101;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          const realDuration = isNaN(video.duration) || video.duration === Infinity ? 0 : video.duration;
          video.currentTime = 0;
          finalizeMetadata(realDuration, width, height);
        };
        return;
      }

      finalizeMetadata(duration, width, height);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      URL.revokeObjectURL(objectUrl);
      const mediaError = video.error;
      let errorMsg = 'Failed to load video file in browser.';
      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = 'Video loading was aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = 'Network or disk error while reading video.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = 'Video decoding failed. The codec may not be supported by your browser.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Unsupported video format or codec.';
            break;
        }
      }
      reject(new Error(errorMsg));
    };

    video.src = objectUrl;
    video.load();
  });
}

/**
 * Lightweight check of audio stream using AudioContext by decoding a small initial slice.
 */
async function probeAudioWithAudioContext(file: File): Promise<boolean> {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return true;

    const ctx = new AudioContextClass();
    const slice = file.slice(0, Math.min(file.size, 512 * 1024));
    const arrayBuffer = await slice.arrayBuffer();

    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        try { ctx.close(); } catch {}
        resolve(true); // Fallback true safely
      }, 1500);

      const handleDone = (hasAudio: boolean) => {
        clearTimeout(timer);
        try { ctx.close(); } catch {}
        resolve(hasAudio);
      };

      ctx.decodeAudioData(
        arrayBuffer,
        (buffer) => {
          handleDone(buffer.numberOfChannels > 0);
        },
        () => {
          handleDone(true);
        }
      ).catch(() => {
        handleDone(true);
      });
    });
  } catch {
    return true;
  }
}

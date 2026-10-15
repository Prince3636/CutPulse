/**
 * Formats seconds into human-readable MM:SS or HH:MM:SS format.
 * If showMillis is true, appends .mmm (e.g. 00:15.500).
 */
export function formatDuration(seconds: number, showMillis = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const totalSeconds = Math.floor(seconds);
  const millis = Math.floor((seconds - totalSeconds) * 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSecs = totalSeconds % 60;

  const pad = (n: number, width = 2) => n.toString().padStart(width, '0');

  let timeStr = '';
  if (hours > 0) {
    timeStr = `${hours}:${pad(minutes)}:${pad(remainingSecs)}`;
  } else {
    timeStr = `${pad(minutes)}:${pad(remainingSecs)}`;
  }

  if (showMillis) {
    timeStr += `.${pad(millis, 3)}`;
  }

  return timeStr;
}

/**
 * Parses user timestamp strings like "01:30", "1:05:20", "45", "45s", "1.5m"
 * into total seconds. Returns null if invalid or NaN.
 */
export function parseTimestampToSeconds(input: string): number | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // e.g. "2m", "1.5 min", "3 minutes"
  if (/(min(utes?)?|m)$/i.test(clean)) {
    const val = parseFloat(clean.replace(/(min(utes?)?|m)$/i, '').trim());
    return isNaN(val) || val < 0 ? null : val * 60;
  }

  // e.g. "45s", "30 sec", "15 seconds"
  if (/(sec(onds?)?|s)$/i.test(clean)) {
    const val = parseFloat(clean.replace(/(sec(onds?)?|s)$/i, '').trim());
    return isNaN(val) || val < 0 ? null : val;
  }

  // e.g. "01:30" or "01:15:30"
  if (clean.includes(':')) {
    const parts = clean.split(':').map((p) => parseFloat(p.trim()));
    if (parts.some((p) => isNaN(p) || p < 0)) return null;

    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  }

  // Plain number e.g. "45"
  const num = parseFloat(clean);
  return isNaN(num) || num < 0 ? null : num;
}

/**
 * Formats bytes into standard B, KB, MB, GB strings.
 */
export function formatFileSize(bytes: number): string {
  if (isNaN(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Calculates and formats video bitrate into Mbps or kbps.
 */
export function formatBitrate(bytes: number, durationSeconds: number): string {
  if (!bytes || !durationSeconds || durationSeconds <= 0) return 'Unknown';
  const bitsPerSecond = (bytes * 8) / durationSeconds;
  if (bitsPerSecond >= 1_000_000) {
    return `${(bitsPerSecond / 1_000_000).toFixed(1)} Mbps`;
  }
  return `${Math.round(bitsPerSecond / 1_000)} kbps`;
}

/**
 * Strips file extension and returns a clean, filesystem-safe base name.
 */
export function getBaseFilename(originalFilename: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const rawBase = lastDot > 0 ? originalFilename.substring(0, lastDot) : originalFilename;
  // Replace spaces and special characters with hyphens/underscores
  const clean = rawBase.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_+/g, '_');
  return clean || 'video';
}

/**
 * Extracts the file extension (defaulting to 'mp4').
 */
export function getFileExtension(filename: string, mimeType?: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0 && lastDot < filename.length - 1) {
    const ext = filename.substring(lastDot + 1).toLowerCase();
    // Validate common video extensions
    if (['mp4', 'webm', 'mov', 'mkv', 'm4v', 'avi'].includes(ext)) {
      return ext;
    }
  }

  if (mimeType?.includes('webm')) return 'webm';
  if (mimeType?.includes('quicktime')) return 'mov';
  return 'mp4';
}

/**
 * Generates descriptive filenames for output clips:
 * Example: my-video_part_001.mp4 or customPrefix_part_001.mp4
 */
export function generateClipFilename(
  originalFilename: string,
  partIndex: number,
  totalParts: number,
  extension: string,
  customPrefix?: string
): string {
  const base = customPrefix && customPrefix.trim()
    ? customPrefix.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    : getBaseFilename(originalFilename);

  const padWidth = totalParts >= 1000 ? 4 : 3;
  const partNumber = partIndex.toString().padStart(padWidth, '0');
  return `${base}_part_${partNumber}.${extension}`;
}

/**
 * Calculates simplified aspect ratio (e.g. 16:9, 4:3, 9:16).
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return '16:9';

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Approximate standard ratios for common video resolutions
  const decimal = width / height;
  if (Math.abs(decimal - 16 / 9) < 0.05) return '16:9 (Landscape)';
  if (Math.abs(decimal - 9 / 16) < 0.05) return '9:16 (Vertical)';
  if (Math.abs(decimal - 4 / 3) < 0.05) return '4:3 (Classic)';
  if (Math.abs(decimal - 1) < 0.05) return '1:1 (Square)';
  if (Math.abs(decimal - 21 / 9) < 0.08) return '21:9 (Ultrawide)';

  return `${ratioW}:${ratioH}`;
}

/**
 * Returns human-readable resolution category (4K UHD, 1080p, 720p, etc.)
 */
export function getResolutionCategory(width: number, height: number): string {
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  if (maxDim >= 3800 || minDim >= 2100) return '4K UHD';
  if (maxDim >= 2500 || minDim >= 1400) return '2K QHD';
  if (maxDim >= 1900 || minDim >= 1000) return '1080p Full HD';
  if (maxDim >= 1200 || minDim >= 700) return '720p HD';
  if (maxDim >= 800 || minDim >= 450) return '480p SD';
  return `${width}×${height}`;
}

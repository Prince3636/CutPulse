import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { GeneratedClip, SplitEngineSettings, SplitProgress, SplitSegment } from '../types/splitter';
import { generateClipFilename, getBaseFilename, getFileExtension } from '../utils/formatters';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private isLoading = false;
  private isCancelled = false;

  public async getFFmpeg(onStatusUpdate?: (status: string) => void): Promise<FFmpeg> {
    if (this.ffmpeg && this.isLoaded) {
      return this.ffmpeg;
    }

    if (this.isLoading) {
      // Wait until loaded
      while (this.isLoading) {
        await new Promise((res) => setTimeout(res, 100));
      }
      if (this.ffmpeg && this.isLoaded) return this.ffmpeg;
    }

    this.isLoading = true;
    onStatusUpdate?.('Initializing WebAssembly video processing core...');

    const ffmpegInstance = new FFmpeg();

    ffmpegInstance.on('log', ({ message }) => {
      // Keep FFmpeg logs clean in console for debugging
      if (import.meta.env.DEV && (message.includes('error') || message.includes('Input') || message.includes('Output'))) {
        console.debug('[FFmpeg]', message);
      }
    });

    const baseHref = import.meta.env.BASE_URL || '/';
    const cleanBase = baseHref.endsWith('/') ? baseHref.slice(0, -1) : baseHref;
    const localBaseURL = `${window.location.origin}${cleanBase}/ffmpeg`;

    try {
      // 1. Try local self-hosted assets via Blob URL
      try {
        onStatusUpdate?.('Loading local WebAssembly core assets...');
        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${localBaseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${localBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        this.ffmpeg = ffmpegInstance;
        this.isLoaded = true;
        this.isLoading = false;
        return this.ffmpeg;
      } catch (localBlobErr) {
        console.warn('Local FFmpeg Blob URL load failed, trying direct local paths:', localBlobErr);
      }

      // 1b. Try direct local URL without Blob URL wrapping
      try {
        await ffmpegInstance.load({
          coreURL: `${localBaseURL}/ffmpeg-core.js`,
          wasmURL: `${localBaseURL}/ffmpeg-core.wasm`,
        });
        this.ffmpeg = ffmpegInstance;
        this.isLoaded = true;
        this.isLoading = false;
        return this.ffmpeg;
      } catch (localDirectErr) {
        console.warn('Local direct FFmpeg load failed, trying pinned CDN fallback:', localDirectErr);
      }

      // 2. Fallback to pinned trusted CDN
      onStatusUpdate?.('Connecting to pinned WebAssembly core assets...');
      const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.ffmpeg = ffmpegInstance;
      this.isLoaded = true;
      this.isLoading = false;
      return this.ffmpeg;
    } catch (err) {
      this.isLoading = false;
      this.isLoaded = false;
      this.ffmpeg = null;
      throw new Error(
        `Failed to initialize WebAssembly video core. ${
          err instanceof Error ? err.message : String(err)
        }. Please ensure WebAssembly is enabled in your browser.`
      );
    }
  }

  public cancelCurrentJob(): void {
    this.isCancelled = true;
    if (this.ffmpeg) {
      try {
        this.ffmpeg.terminate();
      } catch (e) {
        console.warn('Error terminating FFmpeg worker:', e);
      }
      this.ffmpeg = null;
      this.isLoaded = false;
      this.isLoading = false;
    }
  }

  public isJobCancelled(): boolean {
    return this.isCancelled;
  }

  /**
   * Splits a video file into multiple clips based on calculated segments.
   */
  public async splitVideo(
    file: File,
    segments: SplitSegment[],
    settings: SplitEngineSettings,
    onProgress: (progress: SplitProgress) => void
  ): Promise<GeneratedClip[]> {
    this.isCancelled = false;
    const generatedClips: GeneratedClip[] = [];

    // Filter to only selected segments (default is true)
    const activeSegments = segments.filter((s) => s.selected !== false);
    const total = activeSegments.length;

    if (total === 0) {
      throw new Error('No segments selected for splitting. Please select at least one clip segment.');
    }

    onProgress({
      stage: 'loading_engine',
      currentClipIndex: 0,
      totalClips: total,
      percent: 5,
      message: 'Starting local video processing engine...',
    });

    const ffmpeg = await this.getFFmpeg((status) => {
      onProgress({
        stage: 'loading_engine',
        currentClipIndex: 0,
        totalClips: total,
        percent: 10,
        message: status,
      });
    });

    if (this.isCancelled) {
      onProgress({
        stage: 'cancelled',
        currentClipIndex: 0,
        totalClips: total,
        percent: 0,
        message: 'Processing cancelled by user.',
      });
      return [];
    }

    onProgress({
      stage: 'reading_file',
      currentClipIndex: 0,
      totalClips: total,
      percent: 15,
      message: `Loading ${file.name} into browser memory (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`,
    });

    const extension = getFileExtension(file.name, file.type);
    const inputName = `input_${Date.now()}.${extension}`;

    try {
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile(inputName, fileData);
    } catch (fsErr) {
      throw new Error(`Failed to load file into memory: ${fsErr instanceof Error ? fsErr.message : String(fsErr)}`);
    }

    const mimeType = file.type || (extension === 'webm' ? 'video/webm' : 'video/mp4');
    const startTimeMs = performance.now();

    try {
      for (let i = 0; i < total; i++) {
        if (this.isCancelled) {
          break;
        }

        const segment = activeSegments[i];
        const clipNum = i + 1;
        const outputName = `part_${clipNum}_${Date.now()}.${extension}`;
        const outputFilename = generateClipFilename(
          file.name,
          clipNum,
          total,
          extension,
          settings.customPrefix
        );

        const startSeconds = segment.startTime.toFixed(3);
        const durationSeconds = segment.duration.toFixed(3);

        const basePercent = 15 + Math.round(((i) / total) * 80);
        const elapsedSecs = Math.round((performance.now() - startTimeMs) / 1000);
        const estimatedRemaining = i > 0 ? Math.round(((total - i) / i) * elapsedSecs) : undefined;

        onProgress({
          stage: 'processing',
          currentClipIndex: clipNum,
          totalClips: total,
          percent: basePercent,
          message: `Splitting clip ${clipNum} of ${total} (${segment.startTime.toFixed(1)}s to ${segment.endTime.toFixed(1)}s)...`,
          elapsedSeconds: elapsedSecs,
          estimatedRemainingSeconds: estimatedRemaining,
        });

        // Construct FFmpeg arguments based on chosen cut strategy
        let ffmpegArgs: string[];

        if (settings.cutStrategy === 'stream_copy') {
          // Stream-copy: ultra fast, zero quality loss, no watermark
          const args = [
            '-ss',
            startSeconds,
            '-i',
            inputName,
            '-t',
            durationSeconds,
          ];

          if (settings.includeAudio === false) {
            args.push('-an', '-c:v', 'copy');
          } else {
            // Map primary video and audio if present, gracefully ignoring subtitles/data
            args.push('-map', '0:v:0', '-map', '0:a?', '-c', 'copy');
          }

          args.push('-avoid_negative_ts', 'make_zero');

          if (extension === 'mp4' || extension === 'mov') {
            args.push('-movflags', '+faststart');
          }

          args.push(outputName);
          ffmpegArgs = args;
        } else {
          // Accurate cut: re-encode around keyframes for frame-exact cuts
          const crf = settings.accurateQuality === 'high' ? '18' : settings.accurateQuality === 'fast' ? '28' : '22';

          if (extension === 'webm') {
            const args = [
              '-ss',
              startSeconds,
              '-i',
              inputName,
              '-t',
              durationSeconds,
              '-c:v',
              'libvpx',
              '-b:v',
              settings.accurateQuality === 'high' ? '3M' : '1.5M',
            ];

            if (settings.includeAudio === false) {
              args.push('-an');
            } else {
              args.push('-c:a', 'libvorbis');
            }

            args.push('-avoid_negative_ts', 'make_zero', outputName);
            ffmpegArgs = args;
          } else {
            const args = [
              '-ss',
              startSeconds,
              '-i',
              inputName,
              '-t',
              durationSeconds,
              '-c:v',
              'libx264',
              '-preset',
              'ultrafast',
              '-crf',
              crf,
            ];

            if (settings.includeAudio === false) {
              args.push('-an');
            } else {
              args.push('-c:a', 'aac', '-b:a', '192k');
            }

            args.push('-avoid_negative_ts', 'make_zero');

            if (extension === 'mp4' || extension === 'mov') {
              args.push('-movflags', '+faststart');
            }

            args.push(outputName);
            ffmpegArgs = args;
          }
        }

        // Execute cut command
        try {
          const exitCode = await ffmpeg.exec(ffmpegArgs);
          if (exitCode !== 0) {
            // If stream-copy failed, attempt fallback for this clip if stream copy had container muxing conflict
            if (settings.cutStrategy === 'stream_copy') {
              console.warn(`Stream-copy exited with code ${exitCode}. Attempting keyframe-safe fallback.`);
              const fallbackArgs = [
                '-i',
                inputName,
                '-ss',
                startSeconds,
                '-t',
                durationSeconds,
              ];
              if (settings.includeAudio === false) {
                fallbackArgs.push('-an', '-c:v', 'copy');
              } else {
                fallbackArgs.push('-c', 'copy');
              }
              if (extension === 'mp4' || extension === 'mov') {
                fallbackArgs.push('-movflags', '+faststart');
              }
              fallbackArgs.push(outputName);

              const fallbackCode = await ffmpeg.exec(fallbackArgs);
              if (fallbackCode !== 0) {
                throw new Error(`FFmpeg cut failed with code ${fallbackCode}. Stream-copy incompatible with this video container.`);
              }
            } else {
              throw new Error(`FFmpeg cut command failed with exit code ${exitCode}.`);
            }
          }

          // Read output file from virtual filesystem
          const outputData = await ffmpeg.readFile(outputName);
          const rawBuffer = outputData instanceof Uint8Array ? outputData : new Uint8Array(outputData as unknown as ArrayBuffer);
          const standardBuffer = rawBuffer.buffer.slice(rawBuffer.byteOffset, rawBuffer.byteOffset + rawBuffer.byteLength) as ArrayBuffer;
          const clipBlob = new Blob([standardBuffer], { type: mimeType });
          const objectUrl = URL.createObjectURL(clipBlob);

          generatedClips.push({
            id: `clip-${clipNum}-${Date.now()}`,
            index: clipNum,
            startTime: segment.startTime,
            endTime: segment.endTime,
            duration: segment.duration,
            blob: clipBlob,
            objectUrl,
            filename: outputFilename,
            size: clipBlob.size,
          });

          // Free virtual filesystem memory for this clip
          try {
            await ffmpeg.deleteFile(outputName);
          } catch {
            // Ignore delete error
          }
        } catch (clipErr) {
          // Clean up if output file was created
          try {
            await ffmpeg.deleteFile(outputName);
          } catch {
            // Ignore
          }
          throw clipErr;
        }
      }

      if (this.isCancelled) {
        onProgress({
          stage: 'cancelled',
          currentClipIndex: generatedClips.length,
          totalClips: total,
          percent: Math.round((generatedClips.length / total) * 100),
          message: `Splitting cancelled. ${generatedClips.length} clips generated before cancellation.`,
        });
        return generatedClips;
      }

      const totalElapsed = Math.round((performance.now() - startTimeMs) / 1000);
      onProgress({
        stage: 'finishing',
        currentClipIndex: total,
        totalClips: total,
        percent: 100,
        message: `All ${generatedClips.length} clips successfully created in ${totalElapsed}s!`,
        elapsedSeconds: totalElapsed,
      });

      return generatedClips;
    } catch (err) {
      if (this.isCancelled) {
        onProgress({
          stage: 'cancelled',
          currentClipIndex: generatedClips.length,
          totalClips: total,
          percent: Math.round((generatedClips.length / total) * 100),
          message: `Splitting cancelled. ${generatedClips.length} clips preserved.`,
        });
        return generatedClips;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during browser-based video splitting.';

      onProgress({
        stage: 'error',
        currentClipIndex: generatedClips.length,
        totalClips: total,
        percent: 0,
        message: 'Processing failed.',
        error: errorMessage,
      });

      throw new Error(errorMessage);
    } finally {
      // Ensure input file is always cleaned up from virtual memory
      try {
        await ffmpeg.deleteFile(inputName);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Cleans up temporary object URLs for generated clips.
   */
  public revokeClipUrls(clips: GeneratedClip[]): void {
    for (const clip of clips) {
      if (clip.objectUrl) {
        URL.revokeObjectURL(clip.objectUrl);
      }
    }
  }
}

export const ffmpegService = new FFmpegService();

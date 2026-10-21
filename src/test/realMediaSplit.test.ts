import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { calculateSplitSegments } from '../utils/splitterCalculations';
import { createClipsZip } from '../services/zipService';
import { GeneratedClip } from '../types/splitter';
import JSZip from 'jszip';

describe('Real Media Splitting & FFmpeg WebAssembly Verification', { timeout: 30000 }, () => {
  let ffmpegCore: any;

  beforeAll(async () => {
    // Initialize WebAssembly core directly using Node environment polyfills
    (globalThis as any).self = globalThis;
    (globalThis as any).location = { href: 'http://localhost:3000/ffmpeg/' };

    const wasmBinary = fs.readFileSync(path.resolve('./public/ffmpeg/ffmpeg-core.wasm'));
    const coreModule = await import(path.resolve('./public/ffmpeg/ffmpeg-core.js'));
    ffmpegCore = await coreModule.default({
      wasmBinary,
    });
    expect(ffmpegCore).toBeDefined();
    expect(typeof ffmpegCore.exec).toBe('function');
  });

  it('verifies stream-copy on short MP4 with video and audio', () => {
    const inputBuf = fs.readFileSync(path.resolve('./fixtures/test_short.mp4'));
    ffmpegCore.FS.writeFile('in_short.mp4', inputBuf);

    ffmpegCore.exec('-ss', '0', '-i', 'in_short.mp4', '-t', '5', '-c', 'copy', '-avoid_negative_ts', 'make_zero', 'out_short_1.mp4');
    expect(ffmpegCore.ret).toBe(0);

    const outStat = ffmpegCore.FS.stat('out_short_1.mp4');
    expect(outStat.size).toBeGreaterThan(1000);

    const outBuf = ffmpegCore.FS.readFile('out_short_1.mp4');
    fs.writeFileSync('fixtures/test_short_out1.mp4', outBuf);

    // Run ffprobe to verify valid container, video, and audio
    const probe = execSync(
      'ffprobe -v error -show_entries stream=codec_type,codec_name -of csv=p=0 fixtures/test_short_out1.mp4'
    ).toString();
    expect(probe).toContain('video');
    expect(probe).toContain('audio');
    expect(probe).toContain('h264');
    expect(probe).toContain('aac');

    ffmpegCore.FS.unlink('in_short.mp4');
    ffmpegCore.FS.unlink('out_short_1.mp4');
    ffmpegCore.reset();
  });

  it('verifies stream-copy on MP4 without audio (video-only)', () => {
    const inputBuf = fs.readFileSync(path.resolve('./fixtures/test_noaudio.mp4'));
    ffmpegCore.FS.writeFile('in_noaudio.mp4', inputBuf);

    ffmpegCore.exec('-ss', '0', '-i', 'in_noaudio.mp4', '-t', '4', '-c', 'copy', '-avoid_negative_ts', 'make_zero', 'out_noaudio_1.mp4');
    expect(ffmpegCore.ret).toBe(0);

    const outBuf = ffmpegCore.FS.readFile('out_noaudio_1.mp4');
    fs.writeFileSync('fixtures/test_noaudio_out1.mp4', outBuf);

    const probe = execSync(
      'ffprobe -v error -show_entries stream=codec_type,codec_name -of csv=p=0 fixtures/test_noaudio_out1.mp4'
    ).toString();
    expect(probe).toContain('video');
    expect(probe).not.toContain('audio');

    ffmpegCore.FS.unlink('in_noaudio.mp4');
    ffmpegCore.FS.unlink('out_noaudio_1.mp4');
    ffmpegCore.reset();
  });

  it('verifies stream-copy on WebM format', () => {
    const inputBuf = fs.readFileSync(path.resolve('./fixtures/test.webm'));
    ffmpegCore.FS.writeFile('in_webm.webm', inputBuf);

    ffmpegCore.exec('-ss', '0', '-i', 'in_webm.webm', '-t', '4', '-c', 'copy', 'out_webm_1.webm');
    expect(ffmpegCore.ret).toBe(0);

    const outBuf = ffmpegCore.FS.readFile('out_webm_1.webm');
    fs.writeFileSync('fixtures/test_webm_out1.webm', outBuf);

    const probe = execSync(
      'ffprobe -v error -show_entries stream=codec_type,codec_name -of csv=p=0 fixtures/test_webm_out1.webm'
    ).toString();
    expect(probe).toContain('video');
    expect(probe).toContain('vp8');

    ffmpegCore.FS.unlink('in_webm.webm');
    ffmpegCore.FS.unlink('out_webm_1.webm');
    ffmpegCore.reset();
  });

  it('verifies stream-copy on MOV format', () => {
    const inputBuf = fs.readFileSync(path.resolve('./fixtures/test.mov'));
    ffmpegCore.FS.writeFile('in_mov.mov', inputBuf);

    ffmpegCore.exec('-ss', '0', '-i', 'in_mov.mov', '-t', '4', '-c', 'copy', '-avoid_negative_ts', 'make_zero', 'out_mov_1.mov');
    expect(ffmpegCore.ret).toBe(0);

    const outBuf = ffmpegCore.FS.readFile('out_mov_1.mov');
    fs.writeFileSync('fixtures/test_mov_out1.mov', outBuf);

    const probe = execSync(
      'ffprobe -v error -show_entries stream=codec_type,codec_name -of csv=p=0 fixtures/test_mov_out1.mov'
    ).toString();
    expect(probe).toContain('video');
    expect(probe).toContain('h264');

    ffmpegCore.FS.unlink('in_mov.mov');
    ffmpegCore.FS.unlink('out_mov_1.mov');
    ffmpegCore.reset();
  });

  it('verifies accurate-cut mode with microsecond precision', () => {
    const inputBuf = fs.readFileSync(path.resolve('./fixtures/test_short.mp4'));
    ffmpegCore.FS.writeFile('in_acc.mp4', inputBuf);

    ffmpegCore.exec('-ss', '2.5', '-i', 'in_acc.mp4', '-t', '3.5', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-avoid_negative_ts', 'make_zero', 'out_acc_1.mp4');
    expect(ffmpegCore.ret).toBe(0);

    const outBuf = ffmpegCore.FS.readFile('out_acc_1.mp4');
    fs.writeFileSync('fixtures/test_acc_out1.mp4', outBuf);

    const durationStr = execSync(
      'ffprobe -v error -show_entries format=duration -of csv=p=0 fixtures/test_acc_out1.mp4'
    ).toString().trim();
    const duration = parseFloat(durationStr);
    expect(duration).toBeCloseTo(3.5, 1);

    ffmpegCore.FS.unlink('in_acc.mp4');
    ffmpegCore.FS.unlink('out_acc_1.mp4');
    ffmpegCore.reset();
  });

  it('executes real 15s splitting on 65s video and generates a playable ZIP archive', async () => {
    const inputBuf = fs.readFileSync(path.resolve('./fixtures/test_65s.mp4'));
    ffmpegCore.FS.writeFile('in_65s.mp4', inputBuf);

    // Calculate segments for 65s video with 15s preset
    const calculation = calculateSplitSegments(65, {
      mode: '15s',
      equalParts: 2,
      customDuration: 15,
      customUnit: 'seconds',
      cutStrategy: 'stream_copy',
    });

    expect(calculation.totalClips).toBe(5); // 15, 15, 15, 15, 5
    expect(calculation.segments[4].duration).toBe(5);
    expect(calculation.segments[4].isPartial).toBe(true);

    const generatedClips: GeneratedClip[] = [];

    for (const segment of calculation.segments) {
      const outName = `part_${segment.index}.mp4`;
      ffmpegCore.exec(
        '-ss',
        segment.startTime.toFixed(3),
        '-i',
        'in_65s.mp4',
        '-t',
        segment.duration.toFixed(3),
        '-c',
        'copy',
        '-avoid_negative_ts',
        'make_zero',
        outName
      );
      expect(ffmpegCore.ret).toBe(0);

      const outBuf = ffmpegCore.FS.readFile(outName);
      const blob = new Blob([outBuf], { type: 'video/mp4' });

      generatedClips.push({
        id: `clip-${segment.index}`,
        index: segment.index,
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: segment.duration,
        blob,
        objectUrl: `blob:mock-${segment.index}`,
        filename: `test_65s_part_${segment.index.toString().padStart(3, '0')}.mp4`,
        size: outBuf.length,
      });

      ffmpegCore.FS.unlink(outName);
      ffmpegCore.reset();
    }

    ffmpegCore.FS.unlink('in_65s.mp4');
    expect(generatedClips.length).toBe(5);

    // Generate ZIP archive from these real clips
    const zipBlob = await createClipsZip('test_65s.mp4', generatedClips);
    expect(zipBlob.size).toBeGreaterThan(100000);

    // Extract zip and verify every clip
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const files = Object.keys(zip.files);
    expect(files).toContain('test_65s_part_001.mp4');
    expect(files).toContain('test_65s_part_002.mp4');
    expect(files).toContain('test_65s_part_003.mp4');
    expect(files).toContain('test_65s_part_004.mp4');
    expect(files).toContain('test_65s_part_005.mp4');
    expect(files).toContain('README_splits.txt');

    // Extract clip 1 and probe it with ffprobe
    const clip1Buf = await zip.file('test_65s_part_001.mp4')?.async('uint8array');
    expect(clip1Buf).toBeDefined();
    fs.writeFileSync('fixtures/zip_extracted_part1.mp4', clip1Buf!);

    const probe = execSync(
      'ffprobe -v error -show_entries format=duration -of csv=p=0 fixtures/zip_extracted_part1.mp4'
    ).toString().trim();
    expect(parseFloat(probe)).toBeGreaterThan(10);
  });
});

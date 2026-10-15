import React from 'react';
import { Shield, Cpu, Lock, FileCheck, HardDrive, Smartphone, Monitor, Info } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div id="privacy-security" className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Browser-Local Processing & Zero-Upload Privacy Guarantee</span>
          </h3>
          <p className="text-xs text-slate-400">
            CutPulse executes all container demuxing, stream segmentation, and slicing using WebAssembly directly inside your device memory.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>100% Offline Capable</span>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>0 Bytes Sent to Cloud</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Your video files never touch an external server, API, or cloud storage. Everything stays local in sandboxed memory on your device.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Stream-Copy Preservation</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            By avoiding re-compression, your original video resolution, bitrate, frame rate, and audio fidelity remain completely identical.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Watermark-Free</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            We never add watermarks, branding overlays, intro bumpers, or forced credits to any of your generated video clips.
          </p>
        </div>
      </div>

      {/* Explicit Supported Limits & File Handling Section */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <HardDrive className="w-4 h-4 text-indigo-400" />
          <span>Supported File Formats, Codecs & Device Limits</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-300 font-semibold block flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-sky-400" />
              <span>Desktop Limits (PC / Mac)</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Files up to <strong>2 GB</strong> run smoothly in 64-bit Chrome, Edge, Brave, Safari, and Firefox using browser virtual memory.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-300 font-semibold block flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile Limits (iOS / Android)</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Files up to <strong>500 MB</strong> are recommended on mobile devices to prevent OS mobile browser tab RAM eviction.
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-slate-300 font-semibold block flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Supported Video Containers</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong>MP4, WebM, MOV, MKV</strong> (codecs: H.264, H.265/HEVC, VP8, VP9, AAC, MP3, Opus).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

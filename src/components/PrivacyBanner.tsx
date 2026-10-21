import React from 'react';
import { Shield, Zap, Sparkles } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div id="privacy-security" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% In-Browser</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Videos never leave your device. Demuxed and sliced locally in WebAssembly memory with zero cloud uploads.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Zap className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Lossless Stream-Copy</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Direct bitstream copying cuts in seconds without re-encoding, preserving exact original video and audio quality.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Zero Watermarks</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Clean, unbranded video clips with no logos, watermarks, or forced overlays. Free for personal and commercial use.
          </p>
        </div>
      </div>
    </div>
  );
};

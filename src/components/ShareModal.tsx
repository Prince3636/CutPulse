import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Send, Twitter, Sparkles, Heart } from 'lucide-react';
import { analytics } from '../services/analyticsService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cutpulse.com';
  const shareText = 'CutPulse — Free online video splitter without watermark! Split WhatsApp status (30s), Reels, and Shorts locally in browser:';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      analytics.track('share_clicked', { platform: 'copy_link' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSharePlatform = (platform: 'whatsapp' | 'telegram' | 'twitter') => {
    analytics.track('share_clicked', { platform });
    let url = '';

    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <span>Share CutPulse With Friends</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          CutPulse is 100% free with zero watermarks. Help friends, creators, and colleagues split videos quickly right inside their browser!
        </p>

        {/* Social Platforms Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleSharePlatform('whatsapp')}
            className="min-h-[50px] p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-xs font-semibold"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleSharePlatform('telegram')}
            className="min-h-[50px] p-3 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 text-sky-300 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-xs font-semibold"
          >
            <Send className="w-5 h-5 text-sky-400" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => handleSharePlatform('twitter')}
            className="min-h-[50px] p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-xs font-semibold"
          >
            <Twitter className="w-5 h-5 text-indigo-400" />
            <span>X / Twitter</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">Direct Website Link</label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center pt-1 text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-current" />
          <span>Made for creators · Zero ads · Zero tracking</span>
        </div>
      </div>
    </div>
  );
};

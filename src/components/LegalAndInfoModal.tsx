import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Mail,
  Info,
  CheckCircle2,
  Sparkles,
  Send,
  Lock,
  Cpu,
  Globe,
  Heart,
} from 'lucide-react';
import { analytics } from '../services/analyticsService';

export type InfoModalPage = 'about' | 'contact' | 'privacy' | 'terms';

interface LegalAndInfoModalProps {
  page: InfoModalPage | null;
  onClose: () => void;
  onSwitchPage: (page: InfoModalPage) => void;
}

export const LegalAndInfoModal: React.FC<LegalAndInfoModalProps> = ({
  page,
  onClose,
  onSwitchPage,
}) => {
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState<'feedback' | 'bug' | 'feature' | 'general'>('feedback');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!page) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, onClose]);

  if (!page) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    analytics.track('feedback_submitted', {
      category: contactCategory,
      hasEmail: !!contactEmail.trim(),
    });

    setIsSubmitted(true);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-4 bg-slate-950/70 shrink-0">
          {/* Navigation Tabs inside modal */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-48px)]">
            <button
              type="button"
              onClick={() => onSwitchPage('about')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                page === 'about'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPage('contact')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                page === 'contact'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPage('privacy')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                page === 'privacy'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchPage('terms')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                page === 'terms'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors shrink-0 flex items-center justify-center"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 md:p-8 overscroll-contain overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed safe-bottom">
          {/* ================= PAGE: ABOUT ================= */}
          {page === 'about' && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-xs font-semibold text-indigo-300 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>The Story Behind CutPulse</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Next-Generation Browser-Local Video Engineering
                </h2>
              </div>

              <p>
                CutPulse was born out of frustration with online video tools that require users to upload gigabytes of sensitive family videos, lecture recordings, and content footage to distant third-party cloud servers just to perform simple cuts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Privacy First</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Your video never leaves your browser sandbox. 0 bytes uploaded to external servers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>Stream Copying</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Direct bitstream packet slicing with no generation loss or re-compression degradation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Zero Watermarks</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    100% free and unrestricted for creators, educators, students, and professionals.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-base font-bold text-white">How It Works Technically</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  CutPulse runs an optimized build of FFmpeg compiled directly to WebAssembly (`ffmpeg-core.wasm`). By executing inside an isolated in-memory virtual filesystem (`MEMFS`), CutPulse reads video container packets, aligns keyframe indices, and extracts segments at raw storage I/O speed. Fast-start MOOV atom relocation (`-movflags +faststart`) ensures all generated MP4 clips are immediately scrubbable and streamable.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Heart className="w-4 h-4 text-rose-400 fill-current" />
                  <span>Crafted for creators, social media managers, and everyday video users.</span>
                </div>
                <span className="font-mono text-slate-400">v1.0.0 Stable</span>
              </div>
            </div>
          )}

          {/* ================= PAGE: CONTACT ================= */}
          {page === 'contact' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                  Contact & Support
                </h2>
                <p className="text-xs text-slate-400">
                  Have a suggestion, question, or need assistance? Send us a message below or email us directly at{' '}
                  <a href="mailto:support@cutpulse.com" className="text-indigo-400 hover:underline">
                    support@cutpulse.com
                  </a>.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Thank You for Your Message!</h4>
                  <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
                    Your feedback has been logged. If you provided an email address, our team will review and reply within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setContactMessage('');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Sharma"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 text-sm sm:text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="you@example.com (for reply)"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 text-sm sm:text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Topic</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'feedback', label: 'General Feedback' },
                        { id: 'bug', label: 'Report a Bug' },
                        { id: 'feature', label: 'Feature Request' },
                        { id: 'general', label: 'Support Inquiry' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setContactCategory(cat.id as any)}
                          className={`min-h-[40px] px-3 py-2 rounded-xl border text-center transition-all ${
                            contactCategory === cat.id
                              ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold ring-1 ring-indigo-500'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tell us what you love, what broke, or what features you'd like to see next..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full p-3.5 text-sm sm:text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-500 text-center sm:text-left">
                      We respect your privacy. No emails are ever shared or spammed.
                    </span>

                    <button
                      type="submit"
                      disabled={!contactMessage.trim()}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Message</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= PAGE: PRIVACY POLICY ================= */}
          {page === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                  Privacy Policy
                </h2>
                <p className="text-xs text-slate-400">
                  Last Updated: October 2026 · Effective Date: January 1, 2026
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
                <p className="font-bold text-emerald-200">The Zero-Upload Commitment:</p>
                <p>
                  CutPulse does not operate cloud video encoding servers. Your video files are processed strictly inside your device’s WebAssembly browser memory. We never receive, inspect, store, or transmit your video files.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">1. Information We Do Not Collect</h4>
                  <p>
                    Because all video processing occurs locally, CutPulse does NOT collect:
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
                    <li>Your video, audio, or image files.</li>
                    <li>Audio streams, voice recordings, or transcripts.</li>
                    <li>Personal biometric data or facial recordings.</li>
                    <li>Account passwords or financial information.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">2. Local Browser Memory Usage</h4>
                  <p>
                    When you select a video, it is loaded into the browser’s sandboxed virtual filesystem (`MEMFS`). When you close the browser tab, refresh the page, or click "Remove Video", all temporary memory buffers and object URLs are immediately revoked and garbage-collected by the browser engine.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">3. Analytics & Telemetry</h4>
                  <p>
                    CutPulse may collect aggregate, anonymous technical performance signals (e.g. video container extension, split mode selected, error codes, and completion duration) to monitor WebAssembly stability and improve browser compatibility. No personally identifiable information (PII) is attached to these telemetry events.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">4. Cookies & Trackers</h4>
                  <p>
                    CutPulse does not use third-party advertising cookies or cross-site behavioral tracking cookies.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">5. GDPR & CCPA Compliance</h4>
                  <p>
                    Under European Union GDPR and California CCPA regulations, CutPulse is neither a Data Controller nor a Data Processor of your media files because user files are never ingested into our technical infrastructure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: TERMS OF SERVICE ================= */}
          {page === 'terms' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                  Terms of Service
                </h2>
                <p className="text-xs text-slate-400">
                  Last Updated: October 2026
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">1. Acceptance of Terms</h4>
                  <p>
                    By accessing or using CutPulse ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may discontinue use of the Service.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">2. Intellectual Property & Video Ownership</h4>
                  <p>
                    <strong>You retain 100% full and unencumbered ownership of all videos, audio files, and clips you process using CutPulse.</strong> CutPulse claims no copyright, ownership, license, or distribution rights over any content you split.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">3. Zero Watermark Guarantee</h4>
                  <p>
                    CutPulse will never append watermarks, brand overlays, introductory bumpers, or metadata stamps to your generated clips. All clips remain your exclusive creation.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">4. Acceptable Use</h4>
                  <p>
                    You agree to use CutPulse only for lawful purposes and in compliance with all applicable local, national, and international laws. You agree not to process material that infringes third-party intellectual property or privacy rights.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">5. Disclaimer of Warranties</h4>
                  <p>
                    The service is provided on an "AS IS" and "AS AVAILABLE" basis. While CutPulse is designed for high reliability and stream preservation, processing performance depends on your local hardware, operating system, and browser WebAssembly memory limits.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">6. Contact Information</h4>
                  <p>
                    For legal or terms questions, please email <a href="mailto:legal@cutpulse.com" className="text-indigo-400 hover:underline">legal@cutpulse.com</a>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CutPulse</span>
            <span>·</span>
            <span>Client-Side WebAssembly Studio</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Back to Studio
          </button>
        </div>
      </div>
    </div>
  );
};

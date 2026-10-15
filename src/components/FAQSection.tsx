import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How do I split videos for WhatsApp Status without losing order?',
    answer:
      'Select the "30s Status (WhatsApp)" preset under Social Media Presets. CutPulse will calculate continuous 30-second segments (Part 01, Part 02, etc.). When you download the ZIP or individual files, they are numbered sequentially. You can upload them consecutively to your WhatsApp status so the entire video plays seamlessly without missing words or cuts.',
  },
  {
    question: 'How does CutPulse split videos with zero re-encoding and original quality?',
    answer:
      'CutPulse leverages FFmpeg compiled to WebAssembly. By executing with stream-copy mode (-c copy), it extracts the raw H.264/H.265/VP9 video packets and AAC/Opus audio streams directly into new container segments without decoding and re-compressing them. This runs in seconds instead of minutes, creates zero loss in visual resolution, and produces identical bitstream quality.',
  },
  {
    question: 'Why are keyframe boundaries important when using Stream-Copy?',
    answer:
      'In modern compressed video, video frames rely on periodic keyframes (I-frames) to define complete pictures, while intermediate frames only store differences. Stream copying extracts data at keyframes to avoid playback glitches. If you need cuts down to exact microsecond frames, select the "Accurate Cut" mode in settings, which re-encodes around the cut boundary frames.',
  },
  {
    question: 'Can I split by custom chapters or timestamps (e.g. from a podcast or YouTube)?',
    answer:
      'Yes! Under the "Custom & Chapters" tab, select "Custom Split Timestamps". You can enter or paste timestamps separated by commas or lines (for example: "0:30, 1:15, 2:40"). CutPulse will automatically divide the video at those exact points.',
  },
  {
    question: 'Can I exclude unwanted sections or mute audio?',
    answer:
      'Absolutely. In the "Inspect & Filter Upcoming Clips" section, you can uncheck any segment (like a 2-second residual outro or a blooper) so it won\'t be split. In "Advanced Settings", you can also toggle "Audio Track Output" to Mute mode to generate silent video clips.',
  },
  {
    question: 'What video formats and containers are supported?',
    answer:
      'CutPulse supports MP4, WebM, MOV, and MKV video files. Common codecs like H.264 (AVC), H.265 (HEVC), VP8, VP9, AAC, MP3, and Opus are supported right out of the box in the browser with faststart metadata headers.',
  },
  {
    question: 'What is the maximum file size I can split?',
    answer:
      'Because all processing takes place locally inside your browser memory (WebAssembly virtual RAM), files up to 2 GB are supported on modern desktop browsers (Chrome, Edge, Safari, Firefox). For phones and mobile devices with lower RAM, files up to 500 MB run smoothly.',
  },
  {
    question: 'Is my video content uploaded anywhere?',
    answer:
      'No. Your video never leaves your browser. CutPulse does not use cloud encoding servers or third-party storage. All demuxing and slicing happens inside your device’s browser sandbox, making it safe for confidential and personal footage.',
  },
  {
    question: 'How do ZIP and sequential file downloads work?',
    answer:
      'The "Download ZIP" button bundles all selected clips sequentially into a clean ZIP archive with a detailed export manifest (README_splits.txt) without re-compressing the video. You can also use "Save Files" to download individual clips with automated delay to prevent browser popup blockers.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div id="faq-section" className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-4 h-4 text-indigo-400" />
        <h3 className="text-base font-bold text-white">Frequently Asked Questions</h3>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Technical details on browser-local stream copying, WhatsApp status splitting, chapters, and privacy.
      </p>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-850 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

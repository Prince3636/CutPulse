import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How do I split videos for WhatsApp Status?',
    answer:
      'Select the 30s Status preset. CutPulse divides your video into consecutive 30-second clips numbered sequentially (Part 1, Part 2, etc.) for seamless story posting.',
  },
  {
    question: 'How does lossless stream-copy work?',
    answer:
      'Using WebAssembly FFmpeg, CutPulse extracts video packets without re-encoding (-c copy). It processes in seconds with 100% original quality and zero watermark.',
  },
  {
    question: 'Is my video uploaded to any server?',
    answer:
      'Never. 100% of the demuxing and slicing runs locally inside your browser memory. Your footage never touches any external server or cloud API.',
  },
  {
    question: 'Can I split by custom chapters or timestamps?',
    answer:
      'Yes. In the Chapters tab, enter timestamps separated by commas (e.g. 0:30, 1:15, 2:40) to divide the video at your exact cut points.',
  },
  {
    question: 'What video formats and file sizes are supported?',
    answer:
      'CutPulse supports MP4, WebM, MOV, and MKV files up to 2 GB on desktop browsers and up to 500 MB on mobile devices.',
  },
  {
    question: 'How do downloads work?',
    answer:
      'Click "Download ZIP" to export all clips at once, or use "Save Files" to download individual video files directly to your device.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div id="faq-section" className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-4 h-4 text-indigo-400" />
        <h3 className="text-base font-bold text-white">Frequently Asked Questions</h3>
      </div>

      <div className="space-y-2.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-800/80 rounded-xl bg-slate-950/60 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-4 sm:px-5 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2.5">
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

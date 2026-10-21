import React, { useState } from 'react';
import { Scissors, ShieldCheck, Menu, X, Info, Mail, FileText, Lock, Share2 } from 'lucide-react';
import { InfoModalPage } from './LegalAndInfoModal';

interface NavbarProps {
  onScrollToSection: (sectionId: string) => void;
  onOpenPage: (page: InfoModalPage) => void;
  onOpenShare?: () => void;
  onReset?: () => void;
  hasVideo?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onScrollToSection,
  onOpenPage,
  onOpenShare,
  onReset,
  hasVideo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Scissors className="w-5 h-5" />
          </div>
          <button
            onClick={onReset}
            className="text-lg font-bold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap text-left"
          >
            CutPulse
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onScrollToSection('split-workspace')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Splitter Studio
          </button>
          <button
            onClick={() => onScrollToSection('splitting-modes')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Social Presets
          </button>
          <button
            onClick={() => onScrollToSection('privacy-security')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Local Privacy
          </button>
          <button
            onClick={() => onScrollToSection('faq-section')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            FAQ
          </button>
          <span className="w-px h-4 bg-slate-800" />
          <button
            onClick={() => onOpenPage('about')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            About
          </button>
          <button
            onClick={() => onOpenPage('contact')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Actions & Mobile Hamburger */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% In-Browser</span>
          </div>

          {onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              className="min-h-[34px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
              title="Share CutPulse with friends"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {hasVideo ? (
            <button
              onClick={onReset}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
            >
              New Video
            </button>
          ) : (
            <button
              onClick={() => onScrollToSection('split-workspace')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Upload Video
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/98 px-4 pt-3 pb-6 max-h-[calc(100dvh-4.5rem)] overflow-y-auto space-y-4 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150 shadow-2xl safe-bottom">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => handleMobileNavClick(() => onScrollToSection('split-workspace'))}
              className="min-h-[44px] p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-slate-300 hover:text-white active:bg-slate-800 flex items-center transition-colors"
            >
              Splitter Studio
            </button>
            <button
              onClick={() => handleMobileNavClick(() => onScrollToSection('splitting-modes'))}
              className="min-h-[44px] p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-slate-300 hover:text-white active:bg-slate-800 flex items-center transition-colors"
            >
              Social Presets
            </button>
            <button
              onClick={() => handleMobileNavClick(() => onScrollToSection('privacy-security'))}
              className="min-h-[44px] p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-slate-300 hover:text-white active:bg-slate-800 flex items-center transition-colors"
            >
              Local Privacy
            </button>
            <button
              onClick={() => handleMobileNavClick(() => onScrollToSection('faq-section'))}
              className="min-h-[44px] p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-slate-300 hover:text-white active:bg-slate-800 flex items-center transition-colors"
            >
              FAQ
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <button
              onClick={() => handleMobileNavClick(() => onOpenPage('about'))}
              className="min-h-[44px] flex items-center gap-2 p-2 rounded-lg hover:text-white hover:bg-slate-900/60 transition-colors"
            >
              <Info className="w-4 h-4 text-indigo-400" />
              <span>About Us</span>
            </button>
            <button
              onClick={() => handleMobileNavClick(() => onOpenPage('contact'))}
              className="min-h-[44px] flex items-center gap-2 p-2 rounded-lg hover:text-white hover:bg-slate-900/60 transition-colors"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => handleMobileNavClick(() => onOpenPage('privacy'))}
              className="min-h-[44px] flex items-center gap-2 p-2 rounded-lg hover:text-white hover:bg-slate-900/60 transition-colors"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => handleMobileNavClick(() => onOpenPage('terms'))}
              className="min-h-[44px] flex items-center gap-2 p-2 rounded-lg hover:text-white hover:bg-slate-900/60 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Terms</span>
            </button>
          </div>

          {onOpenShare && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleMobileNavClick(onOpenShare)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-800/60 text-indigo-200 hover:text-white font-semibold text-xs transition-colors active:bg-indigo-900"
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Share CutPulse With Friends</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

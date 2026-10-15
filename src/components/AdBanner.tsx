import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
  showDevPlaceholder?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId,
  format = 'auto',
  className = '',
  showDevPlaceholder = false,
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
  const isConfigured = !!adsenseClientId && !!slotId;

  useEffect(() => {
    if (!isConfigured) return;

    // Load Google AdSense script once if not already present
    const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push new ad request
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.debug('[AdSense] Ad push error:', e);
    }
  }, [isConfigured, adsenseClientId]);

  // If not configured and not in dev placeholder mode, render nothing
  if (!isConfigured) {
    if (showDevPlaceholder && import.meta.env.DEV) {
      return (
        <aside
          aria-label="Advertisement Placeholder"
          className={`w-full p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center my-4 ${className}`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">
            Google AdSense Placement Slot
          </span>
          <p className="text-xs text-slate-400">
            Set <code className="text-indigo-300 font-mono">VITE_ADSENSE_CLIENT_ID</code> and <code className="text-indigo-300 font-mono">slotId</code> to activate live ads.
          </p>
        </aside>
      );
    }
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`w-full overflow-hidden text-center my-6 ${className}`}
    >
      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block mb-1 select-none">
        Advertisement
      </span>
      <div className="w-full flex justify-center items-center min-h-[90px] bg-slate-950/30 rounded-xl border border-slate-900 overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
};

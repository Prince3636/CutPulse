/**
 * Privacy-preserving, client-side event telemetry and analytics service.
 * Dispatches events to window.dataLayer (GA4 / GTM compatible), custom listeners,
 * and maintains an in-memory session log without collecting any PII or file data.
 */

export type AnalyticsEventType =
  | 'video_selected'
  | 'split_started'
  | 'split_completed'
  | 'split_failed'
  | 'split_cancelled'
  | 'clip_downloaded'
  | 'page_view'
  | 'feedback_submitted'
  | 'preset_changed';

export interface AnalyticsEventPayload {
  video_selected: {
    format: string;
    sizeMB: number;
    durationSecs: number;
    hasAudio: boolean;
    resolution: string;
  };
  split_started: {
    mode: string;
    totalClips: number;
    strategy: 'stream_copy' | 'accurate_cut';
    includeAudio: boolean;
    durationSecs: number;
  };
  split_completed: {
    mode: string;
    clipsGenerated: number;
    strategy: 'stream_copy' | 'accurate_cut';
    elapsedSecs: number;
  };
  split_failed: {
    mode: string;
    strategy: 'stream_copy' | 'accurate_cut';
    error: string;
  };
  split_cancelled: {
    mode: string;
    clipsGeneratedSoFar: number;
    totalExpected: number;
  };
  clip_downloaded: {
    downloadType: 'single' | 'zip' | 'sequential';
    clipCount: number;
    format: string;
  };
  page_view: {
    page: 'studio' | 'about' | 'contact' | 'privacy' | 'terms';
  };
  feedback_submitted: {
    category: string;
    hasEmail: boolean;
  };
  preset_changed: {
    mode: string;
  };
}

export interface StoredAnalyticsEvent {
  id: string;
  event: AnalyticsEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

const MAX_STORED_EVENTS = 50;
const SESSION_STORAGE_KEY = 'cutpulse_analytics_events';

class AnalyticsService {
  private inMemoryEvents: StoredAnalyticsEvent[] = [];

  constructor() {
    this.loadPersistedEvents();
  }

  private loadPersistedEvents(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.inMemoryEvents = JSON.parse(stored);
      }
    } catch {
      this.inMemoryEvents = [];
    }
  }

  private saveEvents(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(this.inMemoryEvents.slice(-MAX_STORED_EVENTS))
      );
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  /**
   * Tracks an event across all configured sinks (dataLayer, debug log, in-memory buffer).
   */
  public track<K extends AnalyticsEventType>(event: K, data: AnalyticsEventPayload[K]): void {
    const timestamp = new Date().toISOString();
    const eventRecord: StoredAnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      event,
      data: data as unknown as Record<string, unknown>,
      timestamp,
    };

    // 1. Maintain in-memory session buffer
    this.inMemoryEvents.push(eventRecord);
    if (this.inMemoryEvents.length > MAX_STORED_EVENTS) {
      this.inMemoryEvents.shift();
    }
    this.saveEvents();

    // 2. Dispatch to window.dataLayer for Google Tag Manager / GA4 integration
    if (typeof window !== 'undefined') {
      const anyWin = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
      if (!anyWin.dataLayer) {
        anyWin.dataLayer = [];
      }
      anyWin.dataLayer.push({
        event: `cutpulse_${event}`,
        ...data,
        timestamp,
      });

      // 3. Dispatch standard CustomEvent on window for embedders
      try {
        window.dispatchEvent(
          new CustomEvent('cutpulse_analytics', {
            detail: eventRecord,
          })
        );
      } catch {
        // Ignore custom event error
      }
    }

    // 4. Debug output in development
    if (import.meta.env.DEV) {
      console.debug(`[Analytics] ${event}:`, data);
    }
  }

  /**
   * Retrieves recent session events for diagnostic inspection.
   */
  public getSessionEvents(): StoredAnalyticsEvent[] {
    return [...this.inMemoryEvents];
  }

  /**
   * Clears the telemetry log.
   */
  public clearSessionEvents(): void {
    this.inMemoryEvents = [];
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
}

export const analytics = new AnalyticsService();

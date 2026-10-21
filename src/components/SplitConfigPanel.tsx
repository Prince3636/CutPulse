import React, { useState } from 'react';
import {
  PresetSplitMode,
  SplitCalculationResult,
  SplitEngineSettings,
  SplitSegment,
} from '../types/splitter';
import { SPLIT_MODE_OPTIONS } from '../utils/splitterCalculations';
import { formatDuration, formatFileSize } from '../utils/formatters';
import {
  Zap,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Bookmark,
  Share2,
  Clock,
  Layers,
  Settings2,
  Scissors,
} from 'lucide-react';

interface SplitConfigPanelProps {
  settings: SplitEngineSettings;
  calculation: SplitCalculationResult;
  videoDuration: number;
  onUpdateSettings: (newSettings: Partial<SplitEngineSettings>) => void;
  onToggleSegment?: (index: number) => void;
  onSetAllSegmentsSelected?: (selected: boolean) => void;
  onStartSplit: () => void;
  isProcessing: boolean;
}

export const SplitConfigPanel: React.FC<SplitConfigPanelProps> = ({
  settings,
  calculation,
  videoDuration,
  onUpdateSettings,
  onToggleSegment,
  onSetAllSegmentsSelected,
  onStartSplit,
  isProcessing,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<'social' | 'preset' | 'equal' | 'custom'>('social');
  const [showSegmentTable, setShowSegmentTable] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const socialPresets = SPLIT_MODE_OPTIONS.filter((o) => o.category === 'social');
  const standardPresets = SPLIT_MODE_OPTIONS.filter((o) => o.category === 'preset');

  const getSocialStyle = (id: string, isSelected: boolean) => {
    switch (id) {
      case '30s': // WhatsApp
        return {
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
          dotClass: 'bg-emerald-400',
          selectedCard: 'border-emerald-500 bg-emerald-950/30 text-white ring-1 ring-emerald-500 shadow-sm shadow-emerald-500/10',
        };
      case '60s': // Shorts
        return {
          badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
          dotClass: 'bg-rose-400',
          selectedCard: 'border-rose-500 bg-rose-950/30 text-white ring-1 ring-rose-500 shadow-sm shadow-rose-500/10',
        };
      case '90s': // Reels
        return {
          badgeClass: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/60',
          dotClass: 'bg-fuchsia-400',
          selectedCard: 'border-fuchsia-500 bg-fuchsia-950/30 text-white ring-1 ring-fuchsia-500 shadow-sm shadow-fuchsia-500/10',
        };
      case '15s': // Stories
        return {
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
          dotClass: 'bg-amber-400',
          selectedCard: 'border-amber-500 bg-amber-950/30 text-white ring-1 ring-amber-500 shadow-sm shadow-amber-500/10',
        };
      case '180s': // TikTok
        return {
          badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
          dotClass: 'bg-cyan-400',
          selectedCard: 'border-cyan-500 bg-cyan-950/30 text-white ring-1 ring-cyan-500 shadow-sm shadow-cyan-500/10',
        };
      default:
        return {
          badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-800/40',
          dotClass: 'bg-indigo-400',
          selectedCard: 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-sm',
        };
    }
  };

  const selectedSegments = calculation.segments.filter((s) => s.selected !== false);
  const selectedCount = selectedSegments.length;
  const selectedTotalDuration = selectedSegments.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl">
      {/* Header with Title and Mode Tabs */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Configure Video Splitting</span>
          </h3>
          <span className="text-xs text-slate-400">
            Source Length: <strong className="font-mono text-slate-200">{formatDuration(videoDuration)}</strong>
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Choose a social preset, uniform interval, equal division, or custom chapter timestamps.
        </p>
      </div>

      {/* Category Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveCategoryTab('social')}
          className={`min-h-[44px] py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
            activeCategoryTab === 'social'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Social Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategoryTab('preset')}
          className={`min-h-[44px] py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
            activeCategoryTab === 'preset'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Intervals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategoryTab('equal')}
          className={`min-h-[44px] py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
            activeCategoryTab === 'equal'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Equal Parts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategoryTab('custom')}
          className={`min-h-[44px] py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
            activeCategoryTab === 'custom'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Chapters</span>
        </button>
      </div>

      {/* Mode Buttons Grid according to active tab */}
      <div className="space-y-6">
        {/* Tab 1: Social Media Presets */}
        {activeCategoryTab === 'social' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {socialPresets.map((mode) => {
                const isSelected = settings.mode === mode.id;
                const style = getSocialStyle(mode.id, isSelected);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onUpdateSettings({ mode: mode.id })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? style.selectedCard
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold tracking-tight">{mode.label}</span>
                      {mode.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-medium flex items-center gap-1 ${style.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
                          <span>{mode.badge}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{mode.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Standard Presets */}
        {activeCategoryTab === 'preset' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {standardPresets.map((mode) => {
                const isSelected = settings.mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onUpdateSettings({ mode: mode.id })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="text-sm font-bold mb-1">{mode.label}</div>
                    <div className="text-xs text-slate-400">{mode.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Equal Divisions */}
        {activeCategoryTab === 'equal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onUpdateSettings({ mode: 'halves' })}
              className={`p-4 rounded-xl border text-left transition-all ${
                settings.mode === 'halves'
                  ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="text-sm font-bold mb-1">Two Equal Halves (50% / 50%)</div>
              <div className="text-xs text-slate-400">
                Divides exactly into 2 parts of <strong className="text-slate-200">{formatDuration(videoDuration / 2)}</strong> each
              </div>
            </button>

            <div
              onClick={() => onUpdateSettings({ mode: 'equal_parts' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.mode === 'equal_parts'
                  ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Split into N Equal Parts</span>
                <span className="text-xs text-slate-400 font-mono">
                  ~{formatDuration(videoDuration / (settings.equalParts || 2))} per clip
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={settings.equalParts}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onUpdateSettings({ mode: 'equal_parts', equalParts: isNaN(val) ? 2 : Math.max(2, val) });
                  }}
                  className="w-24 min-h-[40px] px-3 py-2 text-sm sm:text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">Total clips to create</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Custom Time or Chapter Timestamps */}
        {activeCategoryTab === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Interval */}
            <div
              onClick={() => onUpdateSettings({ mode: 'custom' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.mode === 'custom'
                  ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="text-sm font-bold mb-1">Fixed Custom Interval</div>
              <p className="text-xs text-slate-400 mb-3">Split every X seconds or minutes uniformly.</p>

              <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={settings.customDuration}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdateSettings({ mode: 'custom', customDuration: isNaN(val) ? 10 : val });
                  }}
                  className="w-24 min-h-[40px] px-3 py-2 text-sm sm:text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex rounded-lg overflow-hidden border border-slate-700 p-0.5 bg-slate-900">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ mode: 'custom', customUnit: 'seconds' })}
                    className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded ${
                      settings.customUnit === 'seconds' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Seconds
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ mode: 'custom', customUnit: 'minutes' })}
                    className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded ${
                      settings.customUnit === 'minutes' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Minutes
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Timestamps Mode */}
            <div
              onClick={() => onUpdateSettings({ mode: 'timestamps' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.mode === 'timestamps'
                  ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="text-sm font-bold mb-1">Custom Split Timestamps / Cue Points</div>
              <p className="text-xs text-slate-400 mb-2">
                Enter comma or newline separated timestamps (e.g. <code>0:30, 1:15, 2:40</code>).
              </p>

              <div onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="0:30, 1:15, 2:45"
                  value={settings.timestampList || ''}
                  onChange={(e) => onUpdateSettings({ mode: 'timestamps', timestampList: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 text-sm sm:text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings Accordion (Audio, Quality, Prefix) */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <span>Output Audio, Quality & Custom Naming Options</span>
          </div>
          {showAdvancedSettings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvancedSettings && (
          <div className="p-5 border-t border-slate-800 space-y-5 text-xs">
            {/* 1. Strategy Selector */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Processing Engine Strategy</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ cutStrategy: 'stream_copy' })}
                  className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all ${
                    settings.cutStrategy === 'stream_copy'
                      ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Stream-Copy (Ultra Fast, Zero Quality Loss, Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ cutStrategy: 'accurate_cut' })}
                  className={`px-3.5 py-1.5 rounded-lg border font-semibold transition-all ${
                    settings.cutStrategy === 'accurate_cut'
                      ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Accurate Cut (Frame-Exact Re-encode)
                </button>
              </div>

              {settings.cutStrategy === 'accurate_cut' && (
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-slate-400">Re-encode Quality:</span>
                  {(['high', 'balanced', 'fast'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onUpdateSettings({ accurateQuality: q })}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border capitalize ${
                        (settings.accurateQuality || 'balanced') === q
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {q} {q === 'high' ? '(CRF 18)' : q === 'balanced' ? '(CRF 22)' : '(CRF 28)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Audio Track Toggle */}
            <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-200 block mb-0.5">Audio Track Output</span>
                <span className="text-slate-400 text-[11px]">
                  {settings.includeAudio === false
                    ? 'Audio will be stripped from all split clips (Mute mode).'
                    : 'Original audio track is preserved at 100% fidelity.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateSettings({ includeAudio: settings.includeAudio === false ? true : false })}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                  settings.includeAudio !== false
                    ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
                    : 'border-amber-700/60 bg-amber-950/40 text-amber-300'
                }`}
              >
                {settings.includeAudio !== false ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audio Preserved</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Audio Muted</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Custom Output Filename Prefix */}
            <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div>
                <span className="font-semibold text-slate-200 block mb-0.5">Custom Filename Prefix</span>
                <span className="text-slate-400 text-[11px]">Leave empty to default to original video filename.</span>
              </div>
              <input
                type="text"
                placeholder="e.g. MyVlog_Clip"
                value={settings.customPrefix || ''}
                onChange={(e) => onUpdateSettings({ customPrefix: e.target.value })}
                className="w-full sm:w-48 min-h-[40px] px-3 py-2 text-sm sm:text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Segments Breakdown & Selective Exclusion Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSegmentTable(!showSegmentTable)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>
              Inspect & Filter Upcoming Clips ({selectedCount} of {calculation.totalClips} selected)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Total Duration: <strong className="font-mono text-slate-200">{formatDuration(selectedTotalDuration)}</strong>
            </span>
            {showSegmentTable ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {showSegmentTable && (
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-850">
              <span className="text-slate-400">
                Uncheck any unwanted clip (e.g. short outro or silent section) to exclude it before splitting.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSetAllSegmentsSelected?.(true)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => onSetAllSegmentsSelected?.(false)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-850/60 pr-1">
              {calculation.segments.map((seg) => {
                const isSelected = seg.selected !== false;
                return (
                  <div
                    key={seg.index}
                    onClick={() => onToggleSegment?.(seg.index)}
                    className="py-2 px-3 rounded-lg flex items-center justify-between gap-3 text-xs hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                      <span className={`font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-500 line-through'}`}>
                        Part #{seg.index.toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>{formatDuration(seg.startTime)} → {formatDuration(seg.endTime)}</span>
                      <span aria-hidden="true">·</span>
                      <span className={isSelected ? 'text-slate-200' : 'text-slate-500'}>
                        {formatDuration(seg.duration, true)}
                      </span>
                      {seg.estimatedSize && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-300">~{formatFileSize(seg.estimatedSize)}</span>
                        </>
                      )}
                      {seg.isPartial && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                          Remainder
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Calculation Overview & Action */}
      <div className="p-4 sm:p-5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 sm:gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Clips to Generate</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {selectedCount} <span className="text-xs text-slate-400 font-normal">/ {calculation.totalClips}</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Interval / Mode</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono truncate">
              {calculation.intervalDuration
                ? formatDuration(calculation.intervalDuration)
                : calculation.equalPartsCount
                ? `${calculation.equalPartsCount} parts`
                : calculation.mode}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Active Duration</span>
            <span className="text-sm sm:text-base font-bold text-amber-300 font-mono">
              {formatDuration(selectedTotalDuration, true)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Est. Clip Size</span>
            <span className="text-sm sm:text-base font-bold text-slate-200 font-mono">
              {calculation.estimatedAverageClipSize ? `~${formatFileSize(calculation.estimatedAverageClipSize)}` : 'Auto'}
            </span>
            {calculation.isWhatsAppSafe === true && (
              <span className="text-[10px] text-emerald-400 font-medium block truncate">
                WhatsApp Safe (&lt;16MB)
              </span>
            )}
            {calculation.isWhatsAppSafe === false && (
              <span className="text-[10px] text-amber-400 font-medium block truncate">
                &gt;16MB WhatsApp Limit
              </span>
            )}
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Watermark</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400">Zero (100% Free)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartSplit}
          disabled={isProcessing || !calculation.isValid || selectedCount === 0}
          className="w-full xl:w-auto min-h-[48px] px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-2.5"
        >
          <Scissors className="w-4 h-4" />
          <span>{isProcessing ? 'Processing Video...' : `Split Into ${selectedCount} Clips`}</span>
        </button>
      </div>

      {calculation.validationError && (
        <p className="text-xs text-rose-400 font-medium">
          {calculation.validationError}
        </p>
      )}
    </div>
  );
};

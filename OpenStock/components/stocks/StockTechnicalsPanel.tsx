'use client';

import React, { useState } from 'react';
import { 
    Sparkles, 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    AlertCircle, 
    Activity, 
    ShieldCheck, 
    Newspaper,
    SlidersHorizontal,
    Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Panel from '@/components/Panel';
import TradingViewWidget from '@/components/TradingViewWidget';
import { TECHNICAL_ANALYSIS_WIDGET_CONFIG } from '@/lib/constants';
import type { BrainAnalysisResult } from '@/lib/actions/brain.actions';

interface StockTechnicalsPanelProps {
    symbol: string;
    tvSymbol: string;
    analysis: BrainAnalysisResult['analysis'] | null;
}

const SCRIPT_URL = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';

export default function StockTechnicalsPanel({ symbol, tvSymbol, analysis }: StockTechnicalsPanelProps) {
    const [view, setView] = useState<'ai' | 'tradingview'>('ai');
    const [showDetails, setShowDetails] = useState(false);

    // Score & needle math (0 = Strong Sell, 50 = Neutral, 100 = Strong Buy)
    const score = Math.min(100, Math.max(0, analysis?.overall_score ?? analysis?.technical_score ?? 50));
    const technicalScore = Math.round(analysis?.technical_score ?? 50);
    const fundamentalScore = Math.round(analysis?.fundamental_score ?? 50);
    const newsScore = Math.round(analysis?.news_score ?? 50);

    const classification = (analysis?.classification || (score >= 70 ? 'Strong Buy' : score >= 55 ? 'Buy' : score >= 45 ? 'Neutral' : score >= 30 ? 'Sell' : 'Strong Sell'));
    const isBullish = classification.toLowerCase().includes('buy') || classification.toLowerCase().includes('bull');
    const isBearish = classification.toLowerCase().includes('sell') || classification.toLowerCase().includes('bear');

    // Gauge needle coordinates: 180° (left) to 0° (right)
    const cx = 100;
    const cy = 90;
    const needleLen = 52;
    const angleDeg = 180 - (score / 100) * 180;
    const angleRad = (angleDeg * Math.PI) / 180;
    const nx = cx + needleLen * Math.cos(angleRad);
    const ny = cy - needleLen * Math.sin(angleRad);

    const actionTabs = (
        <div className="flex items-center gap-1 rounded-lg bg-surface/80 p-0.5 border border-line text-[11px] font-semibold">
            <button
                type="button"
                onClick={() => setView('ai')}
                className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                    view === 'ai' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-faint hover:text-foreground'
                )}
            >
                <Bot className="size-3 text-brand" />
                <span>AI Meter</span>
            </button>
            <button
                type="button"
                onClick={() => setView('tradingview')}
                className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                    view === 'tradingview' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-faint hover:text-foreground'
                )}
            >
                <SlidersHorizontal className="size-3" />
                <span>TradingView</span>
            </button>
        </div>
    );

    return (
        <Panel 
            title="Technicals & AI Summary" 
            sub="Oscillators, momentum & synthesized insight" 
            action={actionTabs}
            className="overflow-hidden"
        >
            {view === 'tradingview' ? (
                <div className="relative">
                    <TradingViewWidget
                        scriptUrl={SCRIPT_URL}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(tvSymbol)}
                        height={400}
                    />
                    {analysis?.summary && (
                        <div className="border-t border-line p-3 bg-surface/40 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-brand mb-1">
                                <Sparkles className="size-3.5" />
                                <span>AI Synthesis</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[11.5px]">
                                {analysis.summary}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col text-sm">
                    {/* Compact Speedometer Arc Meter */}
                    <div className="flex flex-col items-center pt-3 pb-1 px-4 relative">
                        <svg viewBox="0 0 200 110" className="w-48 h-28 overflow-visible">
                            {/* 5 Distinct Gauge Segments */}
                            {/* 1. Strong Sell */}
                            <path d="M 30.0 90.0 A 70 70 0 0 1 42.7 49.8" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                            {/* 2. Sell */}
                            <path d="M 44.1 47.9 A 70 70 0 0 1 77.2 23.8" fill="none" stroke="#f87171" strokeWidth="8" strokeLinecap="round" />
                            {/* 3. Neutral */}
                            <path d="M 79.5 23.1 A 70 70 0 0 1 120.5 23.1" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                            {/* 4. Buy */}
                            <path d="M 122.8 23.8 A 70 70 0 0 1 155.9 47.9" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
                            {/* 5. Strong Buy */}
                            <path d="M 157.3 49.8 A 70 70 0 0 1 170.0 90.0" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />

                            {/* Needle */}
                            <line 
                                x1={cx} 
                                y1={cy} 
                                x2={nx} 
                                y2={ny} 
                                stroke="#f8fafc" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                className="transition-all duration-700 ease-out drop-shadow-md"
                            />
                            {/* Needle Pivot Cap */}
                            <circle cx={cx} cy={cy} r="4.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
                        </svg>

                        {/* Verdict & Score directly on the meter */}
                        <div className="text-center -mt-3 mb-2">
                            <p className={cn('text-xl font-black tracking-tight leading-none',
                                isBullish ? 'text-sky-400' : isBearish ? 'text-rose-400' : 'text-slate-300'
                            )}>
                                {classification}
                            </p>
                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                <span className="text-[11px] font-bold text-faint uppercase tracking-wider">Conviction</span>
                                <span className="text-xs font-black text-foreground">{score}/100</span>
                            </div>
                        </div>

                        {/* 3 Compact Pillars */}
                        <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-1 px-1">
                            <div className="flex flex-col items-center py-1.5 px-2 rounded-md bg-surface border border-line">
                                <div className="flex items-center gap-1 text-[10px] text-faint">
                                    <Activity className="size-2.5 text-brand" />
                                    <span>Tech</span>
                                </div>
                                <span className={cn('text-xs font-bold mt-0.5', 
                                    technicalScore >= 60 ? 'text-sky-400' : technicalScore <= 40 ? 'text-rose-400' : 'text-slate-300'
                                )}>
                                    {technicalScore}
                                </span>
                            </div>

                            <div className="flex flex-col items-center py-1.5 px-2 rounded-md bg-surface border border-line">
                                <div className="flex items-center gap-1 text-[10px] text-faint">
                                    <ShieldCheck className="size-2.5 text-blue-400" />
                                    <span>Fund</span>
                                </div>
                                <span className={cn('text-xs font-bold mt-0.5', 
                                    fundamentalScore >= 60 ? 'text-sky-400' : fundamentalScore <= 40 ? 'text-rose-400' : 'text-slate-300'
                                )}>
                                    {fundamentalScore}
                                </span>
                            </div>

                            <div className="flex flex-col items-center py-1.5 px-2 rounded-md bg-surface border border-line">
                                <div className="flex items-center gap-1 text-[10px] text-faint">
                                    <Newspaper className="size-2.5 text-purple-400" />
                                    <span>News</span>
                                </div>
                                <span className={cn('text-xs font-bold mt-0.5', 
                                    newsScore >= 60 ? 'text-emerald-400' : newsScore <= 40 ? 'text-rose-400' : 'text-slate-300'
                                )}>
                                    {newsScore}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Integrated AI Summary on the meter */}
                    <div className="border-t border-line p-3.5 bg-surface/30">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-brand font-bold text-[11px] uppercase tracking-wider">
                                <Sparkles className="size-3" />
                                <span>AI Analyst Summary</span>
                            </div>
                            {((analysis?.catalysts && analysis.catalysts.length > 0) || (analysis?.risks && analysis.risks.length > 0)) && (
                                <button
                                    type="button"
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center gap-1 text-[11px] text-faint hover:text-foreground font-medium transition-colors"
                                >
                                    <span>{showDetails ? 'Hide catalysts' : 'View catalysts'}</span>
                                    {showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {analysis?.summary || `${symbol} technical indicators indicate a ${classification.toLowerCase()} stance. Start Stock Assistant backend for deep AI narrative synthesis.`}
                        </p>

                        {/* Collapsible Catalysts & Risks Drawer */}
                        {showDetails && analysis && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-line/60 text-[11.5px] animate-in fade-in-50 duration-200">
                                {analysis.catalysts && analysis.catalysts.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                                            <CheckCircle2 className="size-3" /> Catalysts
                                        </p>
                                        <ul className="space-y-1 text-faint">
                                            {analysis.catalysts.slice(0, 2).map((item, i) => (
                                                <li key={i} className="flex items-start gap-1">
                                                    <span className="text-emerald-400">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {analysis.risks && analysis.risks.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="font-semibold text-rose-400 flex items-center gap-1 text-[11px]">
                                            <AlertCircle className="size-3" /> Risks
                                        </p>
                                        <ul className="space-y-1 text-faint">
                                            {analysis.risks.slice(0, 2).map((item, i) => (
                                                <li key={i} className="flex items-start gap-1">
                                                    <span className="text-rose-400">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Panel>
    );
}


import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Newspaper, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrainAnalysisResult } from '@/lib/actions/brain.actions';

interface StockAIAnalysisCardProps {
    analysis: BrainAnalysisResult['analysis'];
    company?: string;
    ticker: string;
}

export default function StockAIAnalysisCard({ analysis, company, ticker }: StockAIAnalysisCardProps) {
    if (!analysis) return null;

    const classification = (analysis.classification || 'Neutral').toLowerCase();
    const isBullish = classification.includes('bull') || classification.includes('buy');
    const isBearish = classification.includes('bear') || classification.includes('sell');

    const verdictLabel = analysis.classification || (isBullish ? 'Strong Buy' : isBearish ? 'Strong Sell' : 'Neutral');

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (score <= 39) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    };

    const getProgressColor = (score: number) => {
        if (score >= 70) return 'bg-emerald-500';
        if (score <= 39) return 'bg-rose-500';
        return 'bg-amber-500';
    };

    return (
        <div className="flex flex-col divide-y divide-line text-sm">
            {/* Top Score Banner */}
            <div className="p-4 flex items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-xl border flex items-center justify-center', 
                        isBullish ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                        isBearish ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                        'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    )}>
                        {isBullish ? <TrendingUp className="size-5" /> : isBearish ? <TrendingDown className="size-5" /> : <Minus className="size-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-faint">AI Verdict</span>
                            <Sparkles className="size-3 text-brand" />
                        </div>
                        <p className={cn('text-lg font-bold leading-tight', 
                            isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
                        )}>
                            {verdictLabel}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Conviction Score</p>
                    <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-black text-foreground">{Math.round(analysis.overall_score || 0)}</span>
                        <span className="text-xs text-faint font-semibold">/100</span>
                    </div>
                </div>
            </div>

            {/* 3 Pillars: Fundamental, Technical, News */}
            <div className="grid grid-cols-3 gap-2 p-3 text-xs">
                <div className="p-2.5 rounded-lg bg-surface border border-line flex flex-col justify-between">
                    <div className="flex items-center justify-between text-faint mb-1.5">
                        <span className="flex items-center gap-1">
                            <Activity className="size-3 text-brand" />
                            <span>Technicals</span>
                        </span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', getScoreColor(analysis.technical_score))}>
                            {Math.round(analysis.technical_score || 0)}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                        <div 
                            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(analysis.technical_score))} 
                            style={{ width: `${Math.min(100, Math.max(0, analysis.technical_score || 0))}%` }} 
                        />
                    </div>
                </div>

                <div className="p-2.5 rounded-lg bg-surface border border-line flex flex-col justify-between">
                    <div className="flex items-center justify-between text-faint mb-1.5">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="size-3 text-blue-400" />
                            <span>Fundamentals</span>
                        </span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', getScoreColor(analysis.fundamental_score))}>
                            {Math.round(analysis.fundamental_score || 0)}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                        <div 
                            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(analysis.fundamental_score))} 
                            style={{ width: `${Math.min(100, Math.max(0, analysis.fundamental_score || 0))}%` }} 
                        />
                    </div>
                </div>

                <div className="p-2.5 rounded-lg bg-surface border border-line flex flex-col justify-between">
                    <div className="flex items-center justify-between text-faint mb-1.5">
                        <span className="flex items-center gap-1">
                            <Newspaper className="size-3 text-purple-400" />
                            <span>News</span>
                        </span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', getScoreColor(analysis.news_score))}>
                            {Math.round(analysis.news_score || 0)}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                        <div 
                            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(analysis.news_score))} 
                            style={{ width: `${Math.min(100, Math.max(0, analysis.news_score || 0))}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* AI Analyst Narrative Summary */}
            {analysis.summary && (
                <div className="p-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Analyst Narrative</p>
                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                        {analysis.summary}
                    </p>
                </div>
            )}

            {/* Catalysts & Risks */}
            {((analysis.catalysts && analysis.catalysts.length > 0) || (analysis.risks && analysis.risks.length > 0)) && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/10 text-xs">
                    {analysis.catalysts && analysis.catalysts.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="size-3.5" /> Key Catalysts
                            </span>
                            <ul className="space-y-1 text-faint">
                                {analysis.catalysts.slice(0, 3).map((item, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-emerald-400 mt-0.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.risks && analysis.risks.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="font-semibold text-rose-400 flex items-center gap-1 text-[11px]">
                                <AlertCircle className="size-3.5" /> Risk Factors
                            </span>
                            <ul className="space-y-1 text-faint">
                                {analysis.risks.slice(0, 3).map((item, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-rose-400 mt-0.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Footer Attribution */}
            <div className="px-4 py-2 flex items-center justify-between text-[11px] text-faint bg-surface/50">
                <span>Confidence: {Math.round((analysis.confidence || 0.85) * 100)}%</span>
                <span className="text-[10px] text-muted-foreground/60">Powered by Stock Assistant Brain</span>
            </div>
        </div>
    );
}


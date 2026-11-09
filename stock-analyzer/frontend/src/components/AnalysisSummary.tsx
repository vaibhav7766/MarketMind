import React from "react";
import { NewsAnalysis } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Activity, Target, Newspaper, ShieldCheck, Zap, AlertTriangle, Lightbulb } from "lucide-react";

interface AnalysisSummaryProps {
  analysis: NewsAnalysis;
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis }) => {
  const getSentimentIcon = () => {
    switch (analysis.classification.toLowerCase()) {
      case "bullish": return <TrendingUp className="w-6 h-6 text-emerald-400" />;
      case "bearish": return <TrendingDown className="w-6 h-6 text-rose-400" />;
      default: return <Minus className="w-6 h-6 text-slate-400" />;
    }
  };

  const getSentimentColor = () => {
    switch (analysis.classification.toLowerCase()) {
      case "bullish": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "bearish": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 bg-emerald-400/10";
    if (score <= 39) return "text-rose-400 bg-rose-400/10";
    return "text-slate-300 bg-slate-800";
  };

  const ScoreBar = ({ label, score, icon: Icon }: { label: string, score: number, icon: any }) => (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-slate-400">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getScoreColor(score)}`}>
          {score.toFixed(0)}/100
        </span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            score >= 70 ? "bg-emerald-500" : score <= 39 ? "bg-rose-500" : "bg-slate-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl shadow-blue-900/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck className="w-32 h-32 text-blue-400" />
        </div>
        
        <div className="flex items-center space-x-5 z-10">
          <div className={`p-4 rounded-3xl border ${getSentimentColor()}`}>
            {getSentimentIcon()}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Explainable AI Verdict</p>
            <h2 className="text-3xl font-black uppercase tracking-tight">{analysis.classification}</h2>
          </div>
        </div>
        
        <div className="mt-6 md:mt-0 text-left md:text-right z-10 flex flex-col md:items-end">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Overall Composite Score</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-blue-400">{analysis.overall_score.toFixed(0)}</span>
            <span className="text-lg text-slate-500 font-bold">/ 100</span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreBar label="Fundamental" score={analysis.fundamental_score} icon={Target} />
        <ScoreBar label="Technical" score={analysis.technical_score} icon={Activity} />
        <ScoreBar label="News & Events" score={analysis.news_score} icon={Newspaper} />
      </div>

      {/* AI Insights Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
        <div>
          <div className="flex items-center space-x-2 mb-4 text-blue-400">
            <Lightbulb className="w-5 h-5" />
            <h3 className="text-lg font-black tracking-tight text-slate-200">Analyst Summary</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {analysis.summary || "No summary generated."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4 text-emerald-400">
              <Zap className="w-5 h-5" />
              <h3 className="text-sm font-black tracking-widest uppercase">Key Catalysts</h3>
            </div>
            <ul className="space-y-3">
              {analysis.catalysts && analysis.catalysts.length > 0 ? (
                analysis.catalysts.map((catalyst, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm text-slate-400">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{catalyst}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-600">None identified</li>
              )}
            </ul>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-4 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black tracking-widest uppercase">Risk Factors</h3>
            </div>
            <ul className="space-y-3">
              {analysis.risks && analysis.risks.length > 0 ? (
                analysis.risks.map((risk, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm text-slate-400">
                    <span className="text-rose-500 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-600">None identified</li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default AnalysisSummary;

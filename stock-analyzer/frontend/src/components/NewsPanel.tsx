import React from "react";
import { NewsArticle, ExtractedEvent } from "@/lib/types";
import { ExternalLink, Calendar } from "lucide-react";

interface NewsPanelProps {
  articles: NewsArticle[];
  events?: ExtractedEvent[];
}

const NewsPanel: React.FC<NewsPanelProps> = ({ articles, events = [] }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-black">Market Intelligence</h2>
        <p className="text-sm text-slate-500">{articles.length} recent reports aggregated</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {[...articles].sort((a, b) => {
          // Simple title overlap match
          const aEvent = events.find(n => n.title && a.title && (n.title.includes(a.title.substring(0, 20)) || a.title.includes(n.title.substring(0, 20))));
          const bEvent = events.find(n => n.title && b.title && (n.title.includes(b.title.substring(0, 20)) || b.title.includes(n.title.substring(0, 20))));
          if (aEvent && !bEvent) return -1;
          if (!aEvent && bEvent) return 1;
          return 0;
        }).map((article, idx) => {
          const event = events.find(n => n.title && article.title && (n.title.includes(article.title.substring(0, 20)) || article.title.includes(n.title.substring(0, 20))));
          
          return (
            <a 
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-5 rounded-2xl border transition-all hover:translate-x-1 ${
                event 
                  ? "bg-blue-600/5 border-blue-500/30 hover:border-blue-500/50" 
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  event ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {article.source}
                </span>
                <ExternalLink className="w-4 h-4 text-slate-600" />
              </div>
              
              <h4 className="font-bold text-slate-100 leading-tight mb-3 group-hover:text-blue-400">
                {article.title}
              </h4>
              
              {event && (
                <div className="mb-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{event.event}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${event.impact > 0 ? "bg-emerald-500/20 text-emerald-400" : event.impact < 0 ? "bg-rose-500/20 text-rose-400" : "bg-slate-500/20 text-slate-400"}`}>
                      Impact: {event.impact > 0 ? "+" : ""}{event.impact}
                    </span>
                  </div>
                  <p className="text-xs text-blue-300 font-medium italic">
                    {event.reason}
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-4 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {article.published_at || "Recent"}
                  </span>
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default NewsPanel;

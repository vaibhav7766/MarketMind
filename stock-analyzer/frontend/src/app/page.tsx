import StockSearch from "@/components/StockSearch";
import { TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">
            Antigravity Stock
          </h1>
        </div>
        
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Advanced real-time market data combined with state-of-the-art AI analysis. 
          Get instant insights on any ticker.
        </p>

        <div className="pt-8">
          <StockSearch />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <FeatureCard 
            title="Real-time Charts" 
            description="Dynamic OHLCV visualizations with interactive timeframes."
          />
          <FeatureCard 
            title="AI Analysis" 
            description="Summarized sentiment, risks, and catalysts powered by Claude & Gemini."
          />
          <FeatureCard 
            title="Deep News" 
            description="Aggregated market intelligence from thousands of sources."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition-colors text-left group">
      <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

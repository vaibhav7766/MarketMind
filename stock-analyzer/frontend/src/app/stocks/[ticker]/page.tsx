"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useStockData } from "@/hooks/useStockData";
import { useNews } from "@/hooks/useNews";
import PriceChart from "@/components/PriceChart";
import AnalysisSummary from "@/components/AnalysisSummary";
import NewsPanel from "@/components/NewsPanel";
import ChatWidget from "@/components/ChatWidget";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

const PERIODS = ["1mo", "3mo", "6mo", "1y", "5y"];

export default function StockPage() {
  const params = useParams();
  const ticker = params.ticker as string;
  const searchParams = useSearchParams();
  const initialModel = searchParams.get("model") || "gemini";
  const initialProvider = searchParams.get("provider") || "yfinance";
  const initialArticles = parseInt(searchParams.get("articles") || "30", 10);
  
  const [period, setPeriod] = useState("6mo");
  const [model, setModel] = useState(initialModel);
  const [provider, setProvider] = useState(initialProvider);
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  
  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`/stocks/${ticker}?${params.toString()}`);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProvider(val);
    updateUrlParams("provider", val);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setModel(val);
    updateUrlParams("model", val);
  };

  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [availableProviders, setAvailableProviders] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    import("@/lib/api").then(({ fetchConfig }) => {
      fetchConfig().then((data) => {
        setAvailableModels(data.models);
        setAvailableProviders(data.providers);
        // If the current default model isn't available, pick the first one
        if (data.models.length > 0 && !data.models.find(m => m.id === "gemini")) {
          setModel(data.models[0].id);
        }
      }).catch(console.error);
    });
  }, []);
  
  const { info, timeSeries } = useStockData(ticker, period, "1d", provider);
  const news = useNews(ticker, initialArticles, model);

  const isLoading = info.isLoading || timeSeries.isLoading || news.isLoading;
  const isError = info.isError || timeSeries.isError || news.isError;

  const handleExportPdf = async () => {
    if (!info.data || !news.data) return;
    setIsExporting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/export/${ticker}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          info: info.data,
          analysis: news.data.analysis,
          articles: news.data.articles,
        }),
      });

      if (!response.ok) throw new Error("Failed to export PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${info.data.ticker}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <Link 
            href="/" 
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-black tracking-tight uppercase">{ticker}</h1>
              {info.data?.name && (
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {info.data.sector || "Equity"}
                </span>
              )}
            </div>
            {info.data && (
              <p className="text-slate-500 font-medium">{info.data.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <select
              value={provider}
              onChange={handleProviderChange}
              className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl outline-none border-none hover:text-white transition-colors cursor-pointer appearance-none"
              style={{ textAlignLast: "center" }}
            >
              {availableProviders.length > 0 ? (
                availableProviders.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              ) : (
                <option value="yfinance">Yahoo Finance</option>
              )}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <select
              value={model}
              onChange={handleModelChange}
              className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl outline-none border-none hover:text-white transition-colors cursor-pointer appearance-none"
              style={{ textAlignLast: "center" }}
            >
              {availableModels.length > 0 ? (
                availableModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              ) : (
                <option value="" disabled>No models</option>
              )}
            </select>
          </div>
          
          <button
            onClick={handleExportPdf}
            disabled={isExporting || !info.data || !news.data}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isExporting ? "Exporting..." : "Export PDF"}</span>
          </button>
          <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {isError && (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 border border-rose-500/20 rounded-3xl mb-8">
          <p className="text-rose-400 font-bold mb-4 text-xl">Unable to fetch market data</p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors font-bold text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Chart & Analysis */}
        <div className="lg:col-span-8 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10" />
            {timeSeries.data ? (
              <PriceChart data={timeSeries.data.data} />
            ) : (
              <div className="h-96 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
              </div>
            )}
          </div>

          {news.data?.analysis ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <AnalysisSummary analysis={news.data.analysis} />
            </div>
          ) : news.isLoading ? (
            <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Generating AI Insights...</p>
            </div>
          ) : null}
        </div>

        {/* Right Column: News */}
        <div className="lg:col-span-4 sticky top-8">
          {news.data ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <NewsPanel 
                articles={news.data.articles} 
                events={news.data.analysis.events} 
              />
            </div>
          ) : (
            <div className="h-[600px] bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
          )}
        </div>
      </div>
      <ChatWidget ticker={ticker} model={model} />
    </div>
  );
}

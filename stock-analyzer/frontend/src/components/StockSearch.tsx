"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const StockSearch = () => {
  const [ticker, setTicker] = useState("");
  const [model, setModel] = useState("gemini");
  const [provider, setProvider] = useState("yfinance");
  const [articleCount, setArticleCount] = useState("30");
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [availableProviders, setAvailableProviders] = useState<{id: string, name: string}[]>([]);
  const router = useRouter();

  useEffect(() => {
    import("@/lib/api").then(({ fetchConfig }) => {
      fetchConfig().then((data) => {
        setAvailableModels(data.models);
        setAvailableProviders(data.providers);
        if (data.models.length > 0 && !data.models.find(m => m.id === "gemini")) {
          setModel(data.models[0].id);
        }
      }).catch(console.error);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      router.push(`/stocks/${ticker.toUpperCase()}?model=${model}&provider=${provider}&articles=${articleCount}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search for a ticker (e.g. AAPL, TSLA)..."
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xl shadow-blue-900/10"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>
      
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 self-stretch flex-wrap justify-center sm:flex-nowrap">
        <select
          value={articleCount}
          onChange={(e) => setArticleCount(e.target.value)}
          className="px-4 bg-slate-900 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl outline-none border-none hover:text-white transition-colors cursor-pointer appearance-none h-full"
          style={{ textAlignLast: "center" }}
        >
          <option value="10">10 Articles</option>
          <option value="20">20 Articles</option>
          <option value="30">30 Articles</option>
          <option value="40">40 Articles</option>
        </select>
        <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="px-4 bg-slate-900 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl outline-none border-none hover:text-white transition-colors cursor-pointer appearance-none h-full"
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
        <div className="w-px h-6 bg-slate-800"></div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="px-4 bg-slate-900 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl outline-none border-none hover:text-white transition-colors cursor-pointer appearance-none h-full"
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
    </form>
  );
};

export default StockSearch;

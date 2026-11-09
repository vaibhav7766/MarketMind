// TypeScript interfaces for the Stock Analyzer app

export interface OHLCVPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockInfo {
  ticker: string;
  name: string;
  sector?: string;
  market_cap?: number;
  pe_ratio?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  published_at: string;
  url: string;
  description: string;
  content: string;
}

export interface ExtractedEvent {
  title: string;
  event: string;
  impact: number;
  importance: number;
  confidence: number;
  reason: string;
}

export interface NewsAnalysis {
  fundamental_score: number;
  technical_score: number;
  news_score: number;
  overall_score: number;
  classification: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  events: ExtractedEvent[];
  summary: string;
  catalysts: string[];
  risks: string[];
}
export interface NewsResponse {
  ticker: string;
  company: string;
  article_count: number;
  analysis: NewsAnalysis;
  articles: NewsArticle[];
}

export interface TimeSeriesResponse {
  ticker: string;
  period: string;
  interval: string;
  data: OHLCVPoint[];
}

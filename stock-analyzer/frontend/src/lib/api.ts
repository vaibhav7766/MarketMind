import axios from "axios";
import type { TimeSeriesResponse, NewsResponse, StockInfo } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api",
});

export const fetchTimeSeries = (
  ticker: string,
  period = "6mo",
  interval = "1d",
  provider = "yfinance"
): Promise<TimeSeriesResponse> =>
  api
    .get(`/stocks/${ticker}/timeseries`, { params: { period, interval, provider } })
    .then((r) => r.data);

export const fetchStockInfo = (ticker: string, provider = "yfinance"): Promise<StockInfo> =>
  api.get(`/stocks/${ticker}/info`, { params: { provider } }).then((r) => r.data);

export const fetchNews = (
  ticker: string,
  pageSize = 30,
  model = "gemini"
): Promise<NewsResponse> =>
  api.get(`/news/${ticker}`, { params: { page_size: pageSize, model } }).then((r) => r.data);

export const fetchConfig = (): Promise<{ 
  models: { id: string; name: string }[],
  providers: { id: string; name: string }[] 
}> => api.get(`/config`).then((r) => r.data);

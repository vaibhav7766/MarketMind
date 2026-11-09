import { useQuery } from "@tanstack/react-query";
import { fetchTimeSeries, fetchStockInfo } from "@/lib/api";

export function useStockData(ticker: string, period = "6mo", interval = "1d", provider = "yfinance") {
  const info = useQuery({
    queryKey: ["stock-info", ticker, provider],
    queryFn: () => fetchStockInfo(ticker, provider),
    enabled: !!ticker,
  });

  const timeSeries = useQuery({
    queryKey: ["timeseries", ticker, period, interval, provider],
    queryFn: () => fetchTimeSeries(ticker, period, interval, provider),
    enabled: !!ticker,
  });

  return { info, timeSeries };
}

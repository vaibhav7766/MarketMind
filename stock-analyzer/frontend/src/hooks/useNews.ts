import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";

export function useNews(ticker: string, pageSize = 30, model = "gemini") {
  return useQuery({
    queryKey: ["news", ticker, pageSize, model],
    queryFn: () => fetchNews(ticker, pageSize, model),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

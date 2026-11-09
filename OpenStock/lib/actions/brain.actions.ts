'use server';

export interface BrainStockInfo {
    ticker: string;
    name: string;
    sector?: string | null;
    market_cap?: number | null;
    pe_ratio?: number | null;
    fifty_two_week_high?: number | null;
    fifty_two_week_low?: number | null;
    dividend_yield?: number | null;
    currency?: string | null;
    current_price?: number | null;
}

export interface BrainAnalysisResult {
    ticker: string;
    company: string;
    article_count: number;
    analysis: {
        fundamental_score: number;
        technical_score: number;
        news_score: number;
        overall_score: number;
        classification: string;
        confidence: number;
        events: Array<{
            title: string;
            event: string;
            impact: number;
            importance: number;
            confidence: number;
            reason: string;
        }>;
        summary: string;
        catalysts: string[];
        risks: string[];
    };
    articles: Array<{
        title: string;
        url: string;
        source: string;
        published_at?: string;
    }>;
}

export interface BrainChatResponse {
    response: string;
    citations: Array<{
        id: number;
        title: string;
        source: string;
        url: string;
        date?: string;
    }>;
}

const FETCH_TIMEOUT_MS = 5000;

function getBrainBaseUrl(): string {
    return (process.env.STOCK_BRAIN_URL || 'http://localhost:8000/api').replace(/\/$/, '');
}

/**
 * Fetch stock metrics & fundamental info from the Stock Assistant Brain (FastAPI).
 * Works for global equities (NSE, BSE, US, etc.) without API paywalls.
 */
export async function getBrainStockInfo(symbol: string): Promise<BrainStockInfo | null> {
    try {
        const url = `${getBrainBaseUrl()}/stocks/${encodeURIComponent(symbol)}/info`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let res: Response;
        try {
            res = await fetch(url, {
                signal: controller.signal,
                next: { revalidate: 3600 }, // Cache metrics for 1 hour
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!res.ok) {
            return null;
        }

        return (await res.json()) as BrainStockInfo;
    } catch {
        // Brain is offline or unreachable; fail silently and gracefully
        return null;
    }
}

/**
 * Fetch deep AI analysis & hybrid conviction scoring (Fundamental, Technical, News)
 * from the Stock Assistant Brain.
 */
export async function getBrainAnalysis(symbol: string): Promise<BrainAnalysisResult | null> {
    try {
        const url = `${getBrainBaseUrl()}/news/${encodeURIComponent(symbol)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for complete RAG and LLM synthesis

        let res: Response;
        try {
            res = await fetch(url, {
                signal: controller.signal,
                next: { revalidate: 1800 }, // Cache analysis for 30 minutes
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!res.ok) {
            return null;
        }

        return (await res.json()) as BrainAnalysisResult;
    } catch {
        return null;
    }
}

/**
 * Ask a question to the Stock Assistant Brain Copilot with RAG & citations.
 */
export async function chatWithBrain(symbol: string, message: string): Promise<BrainChatResponse | null> {
    try {
        const url = `${getBrainBaseUrl()}/chat/${encodeURIComponent(symbol)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        let res: Response;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, model: 'gemini' }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!res.ok) {
            return null;
        }

        return (await res.json()) as BrainChatResponse;
    } catch {
        return null;
    }
}


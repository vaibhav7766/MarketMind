(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchConfig",
    ()=>fetchConfig,
    "fetchNews",
    ()=>fetchNews,
    "fetchStockInfo",
    ()=>fetchStockInfo,
    "fetchTimeSeries",
    ()=>fetchTimeSeries
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
const api = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"
});
const fetchTimeSeries = (ticker, period = "6mo", interval = "1d", provider = "yfinance")=>api.get(`/stocks/${ticker}/timeseries`, {
        params: {
            period,
            interval,
            provider
        }
    }).then((r)=>r.data);
const fetchStockInfo = (ticker, provider = "yfinance")=>api.get(`/stocks/${ticker}/info`, {
        params: {
            provider
        }
    }).then((r)=>r.data);
const fetchNews = (ticker, pageSize = 30, model = "gemini")=>api.get(`/news/${ticker}`, {
        params: {
            page_size: pageSize,
            model
        }
    }).then((r)=>r.data);
const fetchConfig = ()=>api.get(`/config`).then((r)=>r.data);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_api_ts_0diyuau._.js.map
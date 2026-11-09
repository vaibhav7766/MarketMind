"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Citation {
  id: number;
  title: string;
  source: string;
  url: string;
  date: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function ChatWidget({ ticker, model }: { ticker: string, model: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/chat/${ticker}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, model }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, citations: data.citations },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I encountered an error trying to answer that. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentWithCitations = (content: string, citations?: Citation[]) => {
    // Pre-process content to replace [1] with markdown links [1](url)
    const processedContent = content.replace(/\[(\d+)\]/g, (match, id) => {
      const citId = parseInt(id, 10);
      const citation = citations?.find(c => c.id === citId);
      if (citation) {
        return `[${citId}](${citation.url})`;
      }
      return match;
    });

    return (
      <div className="space-y-2">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold text-slate-100" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
            a: ({ node, ...props }) => {
              const isCitation = /^\d+$/.test(props.children as string);
              if (isCitation) {
                const citId = parseInt(props.children as string, 10);
                const citation = citations?.find(c => c.id === citId);
                return (
                  <a
                    {...props}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors no-underline align-middle"
                    title={citation ? `${citation.title} - ${citation.source}` : undefined}
                  >
                    {props.children}
                  </a>
                );
              }
              return (
                <a {...props} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                  {props.children}
                </a>
              );
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-500 transition-all hover:scale-105 z-50 flex items-center justify-center group border border-blue-400/30"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-sm group-hover:ml-3">
            Ask AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Historical AI Chat</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Powered by VectorDB</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <MessageSquare className="w-12 h-12 text-slate-600" />
                <p className="text-sm font-medium text-slate-400 px-6">
                  Ask me anything about {ticker}'s history. I search through stored past news to give you verifiable answers.
                </p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                  }`}
                >
                  {m.role === "assistant" ? renderContentWithCitations(m.content, m.citations) : m.content}
                </div>
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sources Referenced</p>
                    {m.citations.map(c => (
                      <a 
                        key={c.id} 
                        href={c.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-start space-x-2 text-xs text-slate-400 hover:text-blue-400 transition-colors group"
                      >
                        <span className="px-1.5 py-0.5 bg-slate-800 text-[9px] font-bold rounded group-hover:bg-blue-900/30 group-hover:text-blue-400 shrink-0">
                          [{c.id}]
                        </span>
                        <span className="line-clamp-1">{c.title} <span className="text-slate-600">— {c.source}</span></span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Searching Archives...</span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about past events..."
                className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-2xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

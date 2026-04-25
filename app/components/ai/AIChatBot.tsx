/**
 * AI 聊天机器人组件
 * 包含：
 *   - AIDisclosureModal  ：首次使用前的告知书弹窗
 *   - 悬浮入口按钮（右上角）
 *   - 聊天窗口
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, RotateCcw, Zap, AlertTriangle } from "lucide-react";
import type { AIMessage } from "~/services/ai.server";

const AI_DISCLOSURE_KEY = "ai_disclosure_agreed";

const disclosureContent = {
  title: "AI 服务使用告知书",
  points: [
    "AI 助手由 DeepSeek 驱动，回答仅供参考，不构成任何建议或承诺。",
    "AI 生成的内容可能存在偏差或错误，请自行判断其准确性。",
    "请勿向 AI 透露您的密码、身份证号、银行卡号等敏感信息。",
    "您的对话内容将用于改善服务质量，我们不会用于其他目的。",
  ] as string[],
};

interface ChatConfig {
  enabled: boolean;
  chatbot: {
    name: string;
    personality: string;
    welcomeMessage: string;
  };
  remaining: number;
  limit: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/* ============================================================
   告知书弹窗
   ============================================================ */
function AIDisclosureModal({ onAgree, onCancel }: { onAgree: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(30, 33, 48, 0.96)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 8px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)",
        }}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.7), rgba(139,92,246,0.7))" }} />
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <AlertTriangle className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white/90">{disclosureContent.title}</h2>
          </div>
          <p className="text-xs text-white/40 ml-12">使用前请仔细阅读以下条款</p>
        </div>
        <div className="mx-5 rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <ul className="space-y-3">
            {disclosureContent.points.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "rgba(99,102,241,0.7)" }} />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            暂不使用
          </button>
          <button onClick={onAgree} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))", boxShadow: "0 2px 16px rgba(99,102,241,0.35)" }}>
            已知悉，继续使用
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   AI 聊天机器人完整组件
   ============================================================ */
export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/ai/chat");
        if (res.ok) {
          const data = await res.json() as ChatConfig;
          setConfig(data);
          setRemaining(data.remaining);
          if (data.enabled && data.chatbot?.welcomeMessage) {
            setMessages([{ id: "welcome", role: "assistant", content: data.chatbot.welcomeMessage, timestamp: new Date() }]);
          }
        }
      } catch (error) {
        console.error("Failed to load AI chat config:", error);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const openChat = useCallback(() => {
    const agreed = typeof window !== "undefined" ? localStorage.getItem(AI_DISCLOSURE_KEY) === "true" : false;
    if (agreed) { setIsOpen(true); } else { setShowDisclosure(true); }
  }, []);

  const handleAgree = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(AI_DISCLOSURE_KEY, "true");
    setShowDisclosure(false);
    setIsOpen(true);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: inputValue.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    try {
      const history: AIMessage[] = messages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history }),
      });
      const data = await res.json() as { success: boolean; reply?: string; error?: string; remaining?: number };
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", content: data.reply!, timestamp: new Date() }]);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      } else {
        setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: data.error || "抱歉，我暂时无法回复，请稍后再试～", timestamp: new Date() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: "网络好像出了点问题，等会再试试？(｡•́︿•̀｡)", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const clearChat = useCallback(() => {
    if (config?.chatbot?.welcomeMessage) {
      setMessages([{ id: "welcome", role: "assistant", content: config.chatbot.welcomeMessage, timestamp: new Date() }]);
    } else {
      setMessages([]);
    }
  }, [config]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!config?.enabled) return null;

  const botName = config.chatbot?.name || "AI 助手";

  const TypingDots = () => (
    <div className="flex gap-1.5 px-1">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.2, delay }} />
      ))}
    </div>
  );

  return (
    <>
      {/* 告知书弹窗 */}
      <AnimatePresence>
        {showDisclosure && <AIDisclosureModal onAgree={handleAgree} onCancel={() => setShowDisclosure(false)} />}
      </AnimatePresence>

      {/* ============================================================
          悬浮入口按钮
          ============================================================ */}
      <motion.button
        onClick={openChat}
        className="hidden md:flex fixed top-6 right-6 z-[100010] w-14 h-14 rounded-2xl items-center justify-center cursor-pointer group"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3))",
          boxShadow: isOpen ? "0 0 0 2px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3)" : "0 0 0 1px rgba(99, 102, 241, 0.2), 0 0 20px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        aria-label={isOpen ? "关闭 AI 助手" : "打开 AI 助手"}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
          style={{ background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.4) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0, 0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.25, type: "spring", stiffness: 300 }}>
              <X className="w-6 h-6 text-indigo-300 relative z-10" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.25, type: "spring", stiffness: 300 }} className="relative z-10">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ============================================================
          聊天窗口
          ============================================================ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.92 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-6 right-6 z-[100010] w-[360px] max-w-[calc(100vw-2rem)] flex flex-col overflow-hidden"
            style={{ maxHeight: "calc(100vh - 3rem)", height: "580px" }}
          >
            <div className="flex flex-col h-full rounded-3xl overflow-hidden"
              style={{
                background: "rgba(10, 10, 20, 0.65)",
                backdropFilter: "blur(30px) saturate(160%)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(99,102,241,0.6) 30%, rgba(139,92,246,0.6) 70%, transparent 95%)" }} />

              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(99,102,241,0.8)" }} />
                    <motion.div className="absolute inset-0 rounded-full" style={{ background: "rgba(99,102,241,0.5)" }} animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 2 }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" aria-hidden />
                      <span className="font-bold text-sm text-white/90">{botName}</span>
                    </div>
                    <p className="text-[11px] text-indigo-300/60 mt-0.5">AI 智能助手 · 随时为您效劳</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {remaining !== null && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-indigo-300/80" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <Zap className="w-3 h-3" aria-hidden />
                      <span>{remaining} 次</span>
                    </div>
                  )}
                  <button onClick={clearChat} className="p-2 rounded-xl cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    title="清空对话" aria-label="清空对话">
                    <RotateCcw className="w-3.5 h-3.5 text-white/40" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    aria-label="关闭 AI 助手">
                    <X className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.3) transparent" }}>
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.22 }}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl mr-2 shrink-0 flex items-center justify-center self-end" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))", border: "1px solid rgba(99,102,241,0.3)" }}>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" aria-hidden />
                        </div>
                      )}
                      <div className="max-w-[75%] px-4 py-3 text-sm leading-relaxed" style={{
                        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        ...(isUser ? { background: "linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))", color: "rgba(255,255,255,0.95)", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.08)" }),
                      }}>
                        {msg.content}
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-xl ml-2 shrink-0 flex items-center justify-center self-end" style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.2)" }}>
                          <svg className="w-3.5 h-3.5 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center mb-0.5" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))", border: "1px solid rgba(99,102,241,0.3)" }}>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" aria-hidden />
                    </div>
                    <div className="px-4 py-3" style={{ borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-2 shrink-0" style={{ borderTop: "1px solid rgba(139,92,246,0.12)", background: "rgba(0,0,0,0.2)" }}>
                <div className="flex items-end gap-2 px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}
                  onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"; }}
                  onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)"; }}>
                  <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="问点什么吧…" rows={1}
                    className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/30 resize-none outline-none leading-relaxed"
                    style={{ minHeight: "24px", maxHeight: "80px" }}
                    onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px"; }}
                    aria-label="输入消息" />
                  <button onClick={sendMessage} disabled={!inputValue.trim() || isLoading}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: inputValue.trim() && !isLoading ? "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))" : "rgba(255,255,255,0.05)",
                      boxShadow: inputValue.trim() && !isLoading ? "0 2px 12px rgba(99,102,241,0.4)" : "none",
                    }}
                    aria-label="发送消息">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-white/20 mt-2">AI 助手由 DeepSeek 驱动 · 支持多轮对话</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

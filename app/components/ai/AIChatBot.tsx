/**
 * AI 聊天机器人组件
 * 悬浮在页面右下角的 Glassmorphism 风格聊天界面
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, RefreshCw } from "lucide-react";
import type { AIMessage } from "~/services/ai.server";

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

export function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<ChatConfig | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [remaining, setRemaining] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 加载配置
    useEffect(() => {
        async function loadConfig() {
            try {
                const res = await fetch("/api/ai/chat");
                if (res.ok) {
                    const data = await res.json() as ChatConfig;
                    setConfig(data);
                    setRemaining(data.remaining);

                    // 添加欢迎消息
                    if (data.enabled && data.chatbot?.welcomeMessage) {
                        setMessages([
                            {
                                id: "welcome",
                                role: "assistant",
                                content: data.chatbot.welcomeMessage,
                                timestamp: new Date(),
                            },
                        ]);
                    }
                }
            } catch (error) {
                console.error("Failed to load AI chat config:", error);
            }
        }
        loadConfig();
    }, []);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 打开时聚焦输入框
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // 发送消息
    const sendMessage = useCallback(async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            // 构建历史消息（排除欢迎消息）
            const history: AIMessage[] = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    history,
                }),
            });

            const data = await res.json() as { success: boolean; reply?: string; error?: string; remaining?: number };

            if (data.success && data.reply) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `ai-${Date.now()}`,
                        role: "assistant" as const,
                        content: data.reply!,
                        timestamp: new Date(),
                    },
                ]);
                if (typeof data.remaining === "number") {
                    setRemaining(data.remaining);
                }
            } else {
                // 显示错误消息
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        role: "assistant",
                        content: data.error || "抱歉，我暂时无法回复，请稍后再试～",
                        timestamp: new Date(),
                    },
                ]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content: "网络好像出了点问题，等会再试试？(｡•́︿•̀｡)",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, messages]);

    // 清空对话
    const clearChat = useCallback(() => {
        if (config?.chatbot?.welcomeMessage) {
            setMessages([
                {
                    id: "welcome",
                    role: "assistant",
                    content: config.chatbot.welcomeMessage,
                    timestamp: new Date(),
                },
            ]);
        } else {
            setMessages([]);
        }
    }, [config]);

    // 键盘事件
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // 如果未启用，不渲染
    if (!config?.enabled) return null;

    const botName = config.chatbot?.name || "小绫";

    return (
        <>
            {/* 悬浮按钮 - 放在右侧中间偏下，避开 Live2D */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-[280px] right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl"
                style={{
                    background: "linear-gradient(135deg, #FF9F43, #FF6B6B)",
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-5 h-5 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MessageCircle className="w-5 h-5 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* 聊天窗口 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-[340px] right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            background: "var(--card-bg)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid var(--glass-border)",
                        }}
                    >
                        {/* 头部 */}
                        <div
                            className="px-4 py-3 flex items-center justify-between"
                            style={{
                                background: "linear-gradient(135deg, rgba(255, 159, 67, 0.9), rgba(255, 107, 107, 0.9))",
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-white" />
                                <span className="font-bold text-white">{botName}</span>
                                <span className="text-xs text-white/70">AI 助手</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {remaining !== null && (
                                    <span className="text-xs text-white/70">
                                        剩余 {remaining} 次
                                    </span>
                                )}
                                <button
                                    onClick={clearChat}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                    title="清空对话"
                                >
                                    <RefreshCw className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* 消息列表 */}
                        <div className="h-80 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.role === "user"
                                            ? "bg-gradient-to-r from-primary-start to-primary-end text-white rounded-br-sm"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {/* 加载中指示器 */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-sm">
                                        <div className="flex gap-1">
                                            <motion.span
                                                className="w-2 h-2 bg-slate-400 rounded-full"
                                                animate={{ y: [-2, 2, -2] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                            />
                                            <motion.span
                                                className="w-2 h-2 bg-slate-400 rounded-full"
                                                animate={{ y: [-2, 2, -2] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                                            />
                                            <motion.span
                                                className="w-2 h-2 bg-slate-400 rounded-full"
                                                animate={{ y: [-2, 2, -2] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* 输入区域 */}
                        <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`和${botName}聊点什么...`}
                                    disabled={isLoading || remaining === 0}
                                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-start/50 transition-all disabled:opacity-50"
                                    maxLength={500}
                                />
                                <motion.button
                                    onClick={sendMessage}
                                    disabled={!inputValue.trim() || isLoading || remaining === 0}
                                    className="p-2.5 rounded-xl bg-gradient-to-r from-primary-start to-primary-end text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </div>
                            {remaining === 0 && (
                                <p className="text-xs text-red-500 mt-2 text-center">
                                    今日对话次数已用完，明天再来吧～
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

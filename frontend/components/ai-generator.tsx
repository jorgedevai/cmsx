"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Bot, Copy, Check, RotateCcw, Sparkles, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools,
    PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

type StreamStatus = "ready" | "submitted" | "streaming";

export function AIGenerator() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<StreamStatus>("ready");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showScrollDown, setShowScrollDown] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const streamingContentRef = useRef("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const isStreaming = status !== "ready";

    // Auto-scroll to bottom on new messages
    const scrollToBottom = useCallback((smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }, []);

    useEffect(() => {
        scrollToBottom(false);
    }, [messages, scrollToBottom]);

    // Detect if user scrolled up
    useEffect(() => {
        const el = scrollAreaRef.current;
        if (!el) return;
        const handleScroll = () => {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShowScrollDown(distFromBottom > 100);
        };
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSend = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
        };

        const assistantMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setStatus("submitted");
        streamingContentRef.current = "";

        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        try {
            const res = await fetch("/api/proxy/ai/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: trimmed,
                    system_prompt: "You are a helpful AI assistant for a headless CMS platform called CMSX. You help users with content strategy, copywriting, schema design, and general questions.\n\nRULES:\n- Always respond in Markdown format. Use headings (##, ###), bold, italic, lists, code blocks, and tables when appropriate.\n- Be concise but thorough. Structure your answers clearly.\n- Write in the same language as the user's prompt.\n- Never output raw HTML tags.",
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) throw new Error("Stream failed");
            if (!res.body) throw new Error("No response body");

            setStatus("streaming");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine.startsWith("data:")) continue;
                    const jsonStr = trimmedLine.slice(5).trim();
                    if (!jsonStr) continue;

                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.type === "content_block_delta" && data.delta?.text) {
                            streamingContentRef.current += data.delta.text;
                            const content = streamingContentRef.current;
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantMsg.id ? { ...m, content } : m
                                )
                            );
                        }
                    } catch {}
                }
            }
        } catch (err: any) {
            if (err.name !== "AbortError") {
                toast.error("Failed to generate response.");
                setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
            }
        } finally {
            setStatus("ready");
            abortRef.current = null;
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
        setStatus("ready");
    };

    const handleCopy = (id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRetry = (index: number) => {
        const userMsg = messages[index - 1];
        if (!userMsg || userMsg.role !== "user") return;
        const prompt = userMsg.content;
        setMessages((prev) => prev.slice(0, index - 1));
        setTimeout(() => handleSend(prompt), 100);
    };

    const handleSuggestion = (text: string) => {
        handleSend(text);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <EmptyState onSelect={handleSuggestion} />
                ) : (
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                        {messages.map((msg, i) => (
                            <div key={msg.id}>
                                {msg.role === "user" ? (
                                    <UserBubble content={msg.content} />
                                ) : (
                                    <AssistantMessage
                                        content={msg.content}
                                        isStreaming={isStreaming && i === messages.length - 1}
                                        copied={copiedId === msg.id}
                                        onCopy={() => handleCopy(msg.id, msg.content)}
                                        onRetry={() => handleRetry(i)}
                                    />
                                )}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Scroll to bottom */}
            {showScrollDown && (
                <div className="flex justify-center -mt-12 relative z-10">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-8 w-8 shadow-md bg-background"
                        onClick={() => scrollToBottom()}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Input area with PromptInput */}
            <div className="border-t bg-background/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <PromptInput
                        onSubmit={({ text }) => handleSend(text)}
                        className="rounded-2xl shadow-sm"
                    >
                        <PromptInputTextarea
                            placeholder="Message AI assistant..."
                            className="min-h-[56px]"
                        />
                        <PromptInputFooter>
                            <PromptInputTools>
                                <span className="text-xs text-muted-foreground">
                                    Shift+Enter for new line
                                </span>
                            </PromptInputTools>
                            <PromptInputSubmit
                                status={status === "ready" ? undefined : status}
                                onStop={handleStop}
                                disabled={isStreaming}
                            />
                        </PromptInputFooter>
                    </PromptInput>
                    <p className="text-[11px] text-muted-foreground text-center mt-2 opacity-60">
                        AI may produce inaccurate information.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── Empty State ──────────────────────────────────────────────── */

function EmptyState({ onSelect }: { onSelect: (text: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="rounded-2xl border bg-card p-4 mb-6 shadow-sm">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                Ask me anything about your CMS. I can help you generate content,
                write copy, analyze data, or answer questions.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 w-full max-w-lg">
                {[
                    "Write a blog post about modern web development",
                    "Generate SEO meta descriptions for my pages",
                    "Help me structure a product catalog schema",
                    "Create a welcome email for new users",
                ].map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => onSelect(suggestion)}
                        className="text-left rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─── User Bubble ──────────────────────────────────────────────── */

function UserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
        </div>
    );
}

/* ─── Assistant Message ────────────────────────────────────────── */

function AssistantMessage({
    content,
    isStreaming,
    copied,
    onCopy,
    onRetry,
}: {
    content: string;
    isStreaming: boolean;
    copied: boolean;
    onCopy: () => void;
    onRetry: () => void;
}) {
    return (
        <div className="flex gap-3">
            <div className="shrink-0 mt-1">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                {!content && isStreaming ? (
                    <div className="flex items-center gap-1.5 py-3">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                ) : (
                    <>
                        <div className={cn(
                            "prose prose-sm dark:prose-invert max-w-none",
                            // Typography
                            "prose-p:leading-relaxed prose-p:my-2",
                            "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mt-4 prose-headings:mb-2",
                            // Code blocks
                            "prose-pre:bg-zinc-950 prose-pre:text-zinc-50 prose-pre:dark:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:my-3 prose-pre:p-4 prose-pre:text-[13px] prose-pre:leading-relaxed prose-pre:overflow-x-auto",
                            // Inline code
                            "prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-mono",
                            // Lists
                            "prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2",
                            // Links
                            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                            // Tables
                            "prose-table:text-sm prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-th:bg-muted/50",
                            // Blockquotes
                            "prose-blockquote:border-l-primary prose-blockquote:not-italic prose-blockquote:text-muted-foreground",
                        )}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {stripHtml(content)}
                            </ReactMarkdown>
                            {isStreaming && (
                                <span className="inline-block w-1.5 h-5 ml-0.5 align-text-bottom bg-primary animate-pulse rounded-sm" />
                            )}
                        </div>
                        {!isStreaming && content && (
                            <div className="flex items-center gap-1 mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={onCopy}
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3 mr-1" />
                                    ) : (
                                        <Copy className="h-3 w-3 mr-1" />
                                    )}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={onRetry}
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Retry
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Helpers ──────────────────────────────────────────────────── */

/**
 * Converts HTML tags to Markdown equivalents so ReactMarkdown can render them.
 * Handles cases where the backend returns HTML instead of Markdown.
 */
function stripHtml(text: string): string {
    if (!/<[a-z][\s\S]*>/i.test(text)) return text;

    return text
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
        .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
        .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1\n\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<\/?(?:ul|ol)[^>]*>/gi, "\n")
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<\/?\w+[^>]*>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

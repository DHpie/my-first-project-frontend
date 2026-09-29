"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { Bot, Send, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { streamChat, getChatHistory, archiveConversation } from "@/api/ai";
import ChatMessage, { type ChatMessageData } from "./chat-message";

const MAX_MESSAGES = 50;
const MAX_INPUT_LENGTH = 500;
const STREAM_TIMEOUT_MS = 30000;

const WELCOME_MESSAGE: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your AI travel assistant. Ask me anything about traveling in China!",
  timestamp: new Date(),
};

let messageIdCounter = 0;
function generateId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [validationError, setValidationError] = useState("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<string>("");
  const hasLoadedHistory = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Load history on first open, then focus input
  useEffect(() => {
    if (!isOpen) {
      buttonRef.current?.focus();
      return;
    }

    if (!hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      setIsLoadingHistory(true);
      (async () => {
        try {
          const history = await getChatHistory();
          if (history.messages.length > 0) {
            setConversationId(history.conversationId);
            setMessages(
              history.messages.map((m) => ({
                id: `hist-${m.id}`,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt),
              }))
            );
          } else {
            setMessages([WELCOME_MESSAGE]);
          }
        } catch {
          setMessages([WELCOME_MESSAGE]);
        } finally {
          setIsLoadingHistory(false);
        }
        setTimeout(() => inputRef.current?.focus(), 100);
      })();
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape key handler + focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Listen for custom event from header AI assistant link
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-widget", handleOpen);
    return () => window.removeEventListener("open-ai-widget", handleOpen);
  }, []);

  const trimMessages = useCallback((msgs: ChatMessageData[]) => {
    if (msgs.length <= MAX_MESSAGES) return msgs;
    const welcome = msgs.find((m) => m.id === "welcome");
    const nonWelcome = msgs.filter((m) => m.id !== "welcome");
    const kept = nonWelcome.slice(-(MAX_MESSAGES - 1));
    return welcome ? [welcome, ...kept] : kept;
  }, []);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isStreaming) return;

      const userMessage: ChatMessageData = {
        id: generateId(),
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      };

      const aiMessageId = generateId();
      const aiMessage: ChatMessageData = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        streaming: true,
      };

      lastUserMessageRef.current = messageText.trim();
      setMessages((prev) => trimMessages([...prev, userMessage]));
      setInputValue("");
      setValidationError("");
      setIsStreaming(true);
      setError(false);

      // Add the empty AI message that will be filled by streaming
      setMessages((prev) => trimMessages([...prev, aiMessage]));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

      try {
        const stream = streamChat(messageText.trim(), conversationId, controller.signal);

        for await (const chunk of stream) {
          clearTimeout(timeoutId);

          if (chunk.error) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? { ...m, content: "", streaming: false }
                  : m
              )
            );
            const errorMsg: ChatMessageData = {
              id: generateId(),
              role: "system",
              content: chunk.error,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
            setIsStreaming(false);
            return;
          }

          if (chunk.done) {
            if (chunk.conversationId) {
              setConversationId(chunk.conversationId);
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? { ...m, streaming: false }
                  : m
              )
            );
            setIsStreaming(false);
            return;
          }

          if (chunk.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? { ...m, content: m.content + chunk.content }
                  : m
              )
            );
          }
        }

        // Stream ended without done chunk (fallback)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, streaming: false } : m
          )
        );
        setIsStreaming(false);
      } catch {
        clearTimeout(timeoutId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? { ...m, content: m.content || "", streaming: false }
              : m
          )
        );
        setError(true);
        const errorMessage: ChatMessageData = {
          id: generateId(),
          role: "system",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsStreaming(false);
      }
    },
    [conversationId, isStreaming, trimMessages]
  );

  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      setMessages((prev) => {
        const lastSystemIdx = prev.findLastIndex((m) => m.role === "system");
        if (lastSystemIdx >= 0) {
          return prev.filter((_, i) => i !== lastSystemIdx);
        }
        return prev;
      });
      sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  const handleNewChat = useCallback(async () => {
    try {
      await archiveConversation();
    } catch {
      // Ignore archive errors
    }
    hasLoadedHistory.current = false;
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setError(false);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isStreaming) return;

    const trimmed = inputValue.trim();
    if (!trimmed) {
      setValidationError("Please enter a message");
      return;
    }

    sendMessage(trimmed);
  };

  const handleInputChange = (value: string) => {
    if (value.length > MAX_INPUT_LENGTH) return;
    setInputValue(value);
    if (validationError) setValidationError("");
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setError(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI travel assistant chat"
          className="mb-3 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg max-[480px]:h-[70vh] min-[480px]:h-[560px] min-[480px]:w-[420px]"
          style={{ animation: "fade-slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          {/* Brand gradient accent */}
          <div className="h-[2px] bg-gradient-to-r from-primary via-accent to-primary" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">AI Travel Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="rounded-full p-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                aria-label="New chat"
                title="New chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-atomic="false" aria-label="Chat messages" role="log">
            {isLoadingHistory ? (
              <>
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
              </>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  {...(msg.streaming ? { role: "status", "aria-busy": "true" } : {})}
                >
                  <ChatMessage message={msg} />
                </div>
              ))
            )}
            {error && (
              <div className="flex flex-col items-center gap-2 py-2">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Retry
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-3"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask about traveling in China..."
                aria-label="Type your message"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isStreaming}
                className="flex-1"
                maxLength={MAX_INPUT_LENGTH}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {validationError && (
              <p className="mt-1 text-xs text-destructive">{validationError}</p>
            )}
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
        aria-label="Open AI assistant"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { Bot, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { chat } from "@/api/ai";
import ChatMessage, { type ChatMessageData } from "./chat-message";
import TypingIndicator from "./typing-indicator";

const MAX_MESSAGES = 50;
const MAX_INPUT_LENGTH = 500;
const CHAT_TIMEOUT_MS = 15000;

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [validationError, setValidationError] = useState("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<string>("");

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus management: open → input, close → button
  useEffect(() => {
    if (isOpen) {
      // Add welcome message on first open
      if (messages.length === 0) {
        setMessages([WELCOME_MESSAGE]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      buttonRef.current?.focus();
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

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;

      const userMessage: ChatMessageData = {
        id: generateId(),
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      };

      lastUserMessageRef.current = messageText.trim();
      setMessages((prev) => {
        const next = [...prev, userMessage];
        if (next.length > MAX_MESSAGES) {
          const welcome = next.find((m) => m.id === "welcome");
          const nonWelcome = next.filter((m) => m.id !== "welcome");
          const kept = nonWelcome.slice(-(MAX_MESSAGES - 1));
          return welcome ? [welcome, ...kept] : kept;
        }
        return next;
      });
      setInputValue("");
      setValidationError("");
      setIsLoading(true);
      setError(false);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

        const response = await Promise.race([
          chat(messageText.trim()),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () =>
              reject(new Error("Request timeout"))
            );
            clearTimeout(timeoutId);
          }),
        ]);
        clearTimeout(timeoutId);

        const aiMessage: ChatMessageData = {
          id: generateId(),
          role: "assistant",
          content: response.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const next = [...prev, aiMessage];
          if (next.length > MAX_MESSAGES) {
            const welcome = next.find((m) => m.id === "welcome");
            const nonWelcome = next.filter((m) => m.id !== "welcome");
            const kept = nonWelcome.slice(-(MAX_MESSAGES - 1));
            return welcome ? [welcome, ...kept] : kept;
          }
          return next;
        });
      } catch {
        setError(true);
        const errorMessage: ChatMessageData = {
          id: generateId(),
          role: "system",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      // Remove the last system error message
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

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
          aria-label="AI travel assistant chat"
          className="mb-3 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg max-[480px]:h-[70vh] min-[480px]:h-[480px] min-[480px]:w-[360px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">AI Travel Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-muted"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
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
                disabled={isLoading}
                className="flex-1"
                maxLength={MAX_INPUT_LENGTH}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
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

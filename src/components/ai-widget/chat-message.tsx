import { FileText, MapPin } from "lucide-react";
import type { SourceRef } from "@/types/ai-chat";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  sources?: SourceRef[];
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="px-3 py-2 text-center text-sm text-destructive" role="alert">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`rounded-lg px-3 py-2 text-sm shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {message.content}
          {message.streaming && (
            <span className="ml-0.5 inline-block animate-pulse">▊</span>
          )}
        </div>

        {/* Sources display for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {/* Cited From inline tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-medium text-muted-foreground/70">CITED FROM</span>
              {message.sources.map((source, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    source.type === "DESTINATION"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {source.type === "DESTINATION" ? (
                    <MapPin className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {source.name}
                </span>
              ))}
            </div>

            {/* Sources box */}
            <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Sources
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((source, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      source.type === "DESTINATION"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {source.type === "DESTINATION" ? (
                      <MapPin className="h-3 w-3" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    {source.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

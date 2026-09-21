"use client";

export default function AIAssistantButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-ai-widget"))}
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="h-2 w-2 rounded-full bg-[#C41E3A]" />
      AI Assistant
    </button>
  );
}

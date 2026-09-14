import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-0">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground hover:opacity-80"
        >
          ChinaBuddy
        </Link>

        {/* TODO: Replace with actual AI widget interaction after homepage-ai-widget change is implemented */}
        <a
          href="#ai-assistant"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          AI Assistant
        </a>
      </div>
    </header>
  );
}

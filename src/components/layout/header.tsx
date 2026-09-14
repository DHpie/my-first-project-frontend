import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80">
      {/* Brand gradient bottom edge */}
      <div className="h-px bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#C41E3A]" />

      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-0">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-[#C41E3A]"
        >
          ChinaBuddy
        </Link>

        <a
          href="#ai-assistant"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="h-2 w-2 rounded-full bg-[#C41E3A]" />
          AI Assistant
        </a>
      </div>
    </header>
  );
}

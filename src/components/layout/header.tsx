import Link from "next/link";
import AIAssistantButton from "./ai-assistant-button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Brand gradient bottom edge */}
      <div className="h-px bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#C41E3A]" />

      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-0">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-[#C41E3A]"
        >
          ChinaBuddy
        </Link>

        <AIAssistantButton />
      </div>
    </header>
  );
}

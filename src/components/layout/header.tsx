import Link from "next/link";
import { User } from "lucide-react";
import AIAssistantButton from "./ai-assistant-button";
import NotificationBell from "../notifications/notification-bell";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Brand gradient bottom edge */}
      <div className="h-[2px] bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#C41E3A]" />

      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-0">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-[#C41E3A]"
        >
          ChinaBuddy
        </Link>

        <div className="flex items-center gap-3">
          {/* Profile 入口（需登录后显示，当前阶段始终可见） */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="My Profile"
          >
            <User className="size-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <NotificationBell />
          <AIAssistantButton />
        </div>
      </div>
    </header>
  );
}

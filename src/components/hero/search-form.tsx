"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAX_LENGTH = 200;

export default function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      setError("Please enter a search term");
      return;
    }

    if (isNavigating) return;

    setError("");
    setIsNavigating(true);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleChange = (value: string) => {
    if (value.length > MAX_LENGTH) return;
    setQuery(value);
    if (error) setError("");
  };

  return (
    <div
      className="w-full max-w-lg mx-auto"
      style={{
        animation:
          "fade-slide-up 500ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both",
      }}
    >
      <form onSubmit={handleSubmit} className="w-full" noValidate>
        <div className="flex items-center gap-2 rounded-full backdrop-blur-md bg-white/15 border border-white/25 px-3 py-2 focus-within:ring-2 focus-within:ring-[#D4A017]/50">
          <Input
            type="text"
            placeholder="Search destinations, tips, or ask AI..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={MAX_LENGTH}
            aria-label="Search destinations, tips, or ask AI"
            className="flex-1 bg-transparent border-none text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:border-none shadow-none"
            disabled={isNavigating}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Search"
            disabled={isNavigating}
            className="rounded-full bg-[#C41E3A] hover:bg-[#A01830] shrink-0"
          >
            <Search className="h-4 w-4 text-white" />
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

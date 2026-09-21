"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SearchFormProps {
  /** 搜索输入框占位文本 */
  placeholder?: string;
  /** 允许的最大输入长度 */
  maxLength?: number;
}

const DEFAULTS = {
  placeholder: "Search destinations, tips, or ask AI...",
  maxLength: 200,
};

export default function SearchForm({
  placeholder = DEFAULTS.placeholder,
  maxLength = DEFAULTS.maxLength,
}: SearchFormProps) {
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
    if (value.length > maxLength) {
      setError(`Search query is too long (max ${maxLength} characters)`);
      return;
    }
    setQuery(value);
    if (error) setError("");
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="w-full" noValidate>
        <div className="flex items-center gap-2 rounded-full backdrop-blur-md bg-white/15 border border-white/25 px-3 py-2">
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            aria-label="Search destinations, tips, or ask AI"
            className="flex-1 bg-transparent border-none text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-[#D4A017]/50 focus-visible:border-none shadow-none"
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

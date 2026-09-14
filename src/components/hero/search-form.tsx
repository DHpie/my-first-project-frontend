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
    <form onSubmit={handleSubmit} className="w-full max-w-xl" noValidate>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search destinations, tips, or ask AI..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={MAX_LENGTH}
          aria-label="Search destinations, tips, or ask AI"
          className="flex-1"
          disabled={isNavigating}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Search"
          disabled={isNavigating}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

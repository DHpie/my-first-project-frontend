"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  getFeaturedDestinations,
  type Destination,
} from "@/api/destinations";
import DestinationCard from "./destination-card";

const MAX_CARDS = 6;

function SkeletonCard() {
  return (
    <div
      className="min-w-[80vw] animate-pulse rounded-xl border border-border bg-card md:min-w-0"
      style={{ height: 200 }}
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
      </div>
    </div>
  );
}

export default function DestinationsSection() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const data = await Promise.race([
        getFeaturedDestinations(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(new Error("Request timeout"))
          );
          clearTimeout(timeoutId);
        }),
      ]);

      clearTimeout(timeoutId);
      setDestinations(data.slice(0, MAX_CARDS));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const renderContent = (): ReactNode => {
    if (loading) {
      return (
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:snap-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            Failed to load destinations
          </p>
          <button
            onClick={fetchDestinations}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      );
    }

    if (destinations.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            No destinations available at the moment
          </p>
        </div>
      );
    }

    return (
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:snap-none md:px-0 md:pb-0">
        {destinations.map((dest) => (
          <DestinationCard key={dest.id} destination={dest} />
        ))}
      </div>
    );
  };

  return (
    <section aria-label="Featured destinations" className="py-8 md:py-12">
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        Popular Destinations
      </h2>
      {renderContent()}
    </section>
  );
}

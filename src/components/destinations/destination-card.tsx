"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Destination } from "@/api/destinations";
import { useScrollReveal } from "@/lib/use-scroll-reveal";

interface DestinationCardProps {
  destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const ref = useScrollReveal<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      href={`/destinations/${destination.slug}`}
      className="group block min-w-[80vw] snap-start md:min-w-0"
      aria-label={`Explore ${destination.cityName}`}
    >
      <article className="group/card relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        {/* Cover Image - 4:3 aspect ratio */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
          {!imageFailed ? (
            <Image
              src={destination.coverImageUrl}
              alt={destination.cityName}
              fill
              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600">
              <span className="text-lg font-bold text-white">
                {destination.cityName}
              </span>
            </div>
          )}

          {/* Image overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

          {/* City name repositioned on image */}
          <h3 className="absolute bottom-3 left-4 text-lg font-bold text-white drop-shadow-md">
            {destination.cityName}
          </h3>

          {/* Popularity tag on image */}
          <span className="absolute top-3 right-3 rounded-full backdrop-blur-md bg-white/20 border border-white/25 px-2.5 py-0.5 text-xs font-medium text-white">
            {destination.popularityTag}
          </span>
        </div>

        {/* Card Content */}
        <div className="relative p-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {destination.highlight}
          </p>

          {/* Decorative vertical line */}
          <div
            className="absolute top-0 left-0 h-full w-1 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100"
            style={{ background: "var(--gradient-card-accent)" }}
          />
        </div>

        {/* Bottom accent bar */}
        <div
          className="h-0.5 w-full opacity-0 transition-opacity duration-200 group-hover/card:opacity-100"
          style={{ background: "var(--gradient-card-accent)" }}
        />
      </article>
    </Link>
  );
}

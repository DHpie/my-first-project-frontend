"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Destination } from "@/api/destinations";

interface DestinationCardProps {
  destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group block min-w-[80vw] snap-start md:min-w-0"
      aria-label={`Explore ${destination.cityName}`}
    >
      <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg">
        {/* Cover Image - 4:3 aspect ratio */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
          {!imageFailed ? (
            <Image
              src={destination.coverImageUrl}
              alt={destination.cityName}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600">
              <span className="text-lg font-bold text-white">
                {destination.cityName}
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-base font-semibold text-card-foreground">
              {destination.cityName}
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {destination.popularityTag}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {destination.highlight}
          </p>
        </div>
      </article>
    </Link>
  );
}

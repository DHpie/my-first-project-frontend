"use client";

import { useState } from "react";
import Image from "next/image";

interface HeroBackgroundProps {
  src: string;
  alt: string;
}

export default function HeroBackground({ src, alt }: HeroBackgroundProps) {
  const [failed, setFailed] = useState(false);

  return (
    <>
      {/* Base background color for fallback */}
      <div className="absolute inset-0 bg-[var(--background)]" />

      {/* Background image */}
      {!failed && (
        <Image
          src={src}
          alt={alt}
          fill
          priority
          className="object-cover md:object-center object-top"
          onError={() => setFailed(true)}
        />
      )}

      {/* Brand gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero-overlay)" }}
      />

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
        }}
      />
    </>
  );
}

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
      <div className="absolute inset-0 bg-[#1a1a2e]" />

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

    </>
  );
}

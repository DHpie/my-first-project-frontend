"use client";

import { useState } from "react";
import Image from "next/image";

interface HeroBackgroundProps {
  src: string;
  alt: string;
}

export default function HeroBackground({ src, alt }: HeroBackgroundProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      className="object-cover md:object-center object-top"
      onError={() => setFailed(true)}
    />
  );
}

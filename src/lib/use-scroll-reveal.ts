"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-triggered entrance animation hook.
 * Uses IntersectionObserver (threshold: 0.15) to set data-visible="true"
 * when the target element enters the viewport, triggering CSS fade-slide-up.
 * Animation plays once only.
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-visible", "true");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

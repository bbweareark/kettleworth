"use client";
import { motion, useReducedMotion } from "motion/react";
import { artSrcSet, FULL_BLEED } from "@/lib/art-srcset";

/**
 * Motion signature 2: photography enters by unmasking from the bottom edge, never by fading.
 *
 * A fade says "this image is arriving". An unmask from the bottom says the image was already
 * there and the floodlight came up on it, which is the DNA's whole premise - a dark room, one
 * hard light. It is also the only entrance in the app that moves an area rather than a line,
 * so it marks the hero as the hero without a single extra pixel of chrome.
 *
 * Reduced motion renders the image in place with no clip at all.
 */
export function Unmask({ src, alt = "", className, priority, sizes = FULL_BLEED }: { src: string; alt?: string; className?: string; priority?: boolean; sizes?: string }) {
  const reduce = useReducedMotion();
  const webp = artSrcSet(src);
  const img = (
    <motion.img
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      transition={{ duration: 0.76, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    />
  );
  // The JPEG stays as the fallback source; a browser that takes the WebP never fetches it.
  return webp ? (
    <picture>
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {img}
    </picture>
  ) : (
    img
  );
}

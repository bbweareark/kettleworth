"use client";
import { motion, useReducedMotion } from "motion/react";

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
export function Unmask({ src, alt = "", className, priority }: { src: string; alt?: string; className?: string; priority?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.img
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      transition={{ duration: 0.76, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    />
  );
}

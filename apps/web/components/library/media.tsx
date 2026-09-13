"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, cn } from "@kettleworth/ui";
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

/** Mux player when real footage exists; otherwise a labelled two-frame loop from the public-domain stills. */
export function ExerciseMedia({ name, images, video, className, compact }: { name: string; images: string[]; video: { provider: string; playbackId: string | null; isPlaceholder: boolean; status: string } | null; className?: string; compact?: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => { if (images.length < 2) return; const t = setInterval(() => setFrame((f) => (f + 1) % images.length), 900); return () => clearInterval(t); }, [images.length]);
  const ready = video && !video.isPlaceholder && video.playbackId && video.status === "ready";
  const real = ready && video.provider === "mux";
  const yt = ready && video.provider === "youtube";
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-surface-2", compact ? "aspect-[4/3]" : "aspect-video lg:aspect-[4/3]", className)}>
      {yt ? (
        <iframe title={`${name} demonstration`} src={`https://www.youtube-nocookie.com/embed/${video!.playbackId}?rel=0&modestbranding=1&playsinline=1${compact ? "&mute=1" : ""}`} className="absolute inset-0 size-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      ) : real ? (
        <MuxPlayer playbackId={video!.playbackId!} streamType="on-demand" autoPlay="muted" loop muted playsInline metadata={{ video_title: name }} accentColor="#ff8a3d" className="size-full" />
      ) : images.length ? (
        <>
          {images.map((src, i) => <img key={src} src={src} alt={i === 0 ? `${name} start position` : `${name} end position`} className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", i === frame ? "opacity-100" : "opacity-0")} />)}
          <Badge tone="amber" className="absolute left-3 top-3">Demo footage coming · stills</Badge>
        </>
      ) : (
        <div className="grid size-full place-items-center text-sm text-fg-subtle">Demo video coming</div>
      )}
    </div>
  );
}

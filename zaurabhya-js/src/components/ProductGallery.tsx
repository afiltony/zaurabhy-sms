"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

export default function ProductGallery({
  images,
  name,
  caption,
}: {
  images: (string | null)[];
  name: string;
  caption: string;
}) {
  const slots = [images[0] ?? null, images[1] ?? null, images[2] ?? null];
  const [activeIndex, setActiveIndex] = useState(
    Math.max(slots.findIndex((src) => src), 0),
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const activeSrc = slots[activeIndex];

  function handleZoomClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
    setZoomed((z) => !z);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setZoomed(false);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {activeSrc ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative block h-80 w-full sm:h-96"
            aria-label="Open full-size image"
          >
            <Image
              src={activeSrc}
              alt={name}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-contain p-6"
              priority
            />
            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" />
              Zoom
            </span>
          </button>
        ) : (
          <PhotoPlaceholder caption={caption} className="h-80 sm:h-96" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {slots.map((src, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`overflow-hidden rounded-xl border bg-white transition ${
              index === activeIndex
                ? "border-teal ring-2 ring-teal/40"
                : "border-border hover:border-teal/60"
            }`}
          >
            {src ? (
              <div className="relative h-20 w-full sm:h-24">
                <Image
                  src={src}
                  alt={`${name} photo ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-contain p-1.5"
                />
              </div>
            ) : (
              <PhotoPlaceholder caption="soon" className="h-20 sm:h-24" />
            )}
          </button>
        ))}
      </div>

      {lightboxOpen && activeSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative h-[80vh] w-full max-w-3xl cursor-zoom-in overflow-hidden"
            onClick={(event) => {
              event.stopPropagation();
              handleZoomClick(event);
            }}
          >
            <Image
              src={activeSrc}
              alt={name}
              fill
              sizes="90vw"
              className="object-contain transition-transform duration-300"
              style={{
                transform: zoomed ? "scale(2.2)" : "scale(1)",
                transformOrigin: zoomOrigin,
                cursor: zoomed ? "zoom-out" : "zoom-in",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

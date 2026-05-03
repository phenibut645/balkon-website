import { ReactNode } from "react";
import Image from "next/image";

type ItemMediaProps = {
  name: string;
  imageUrl: string | null;
  emoji: string | null;
  accentColor?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  overlay?: ReactNode;
};

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function ItemMedia({
  name,
  imageUrl,
  emoji,
  accentColor,
  className,
  imageClassName,
  fallbackClassName,
  overlay,
}: ItemMediaProps) {
  const mediaClassName = joinClassNames("item-card-media", className);
  const resolvedImageClassName = joinClassNames("item-card-image", imageClassName);
  const resolvedFallbackClassName = joinClassNames("item-card-emoji-fallback", fallbackClassName);
  const backgroundAccent = accentColor || "#44506d";

  return (
    <div
      className={mediaClassName}
      style={{ background: `linear-gradient(145deg, ${backgroundAccent}2d, #1d2437)` }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={180}
          height={180}
          unoptimized
          className={resolvedImageClassName}
          onError={event => {
            const target = event.currentTarget as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.parentElement?.querySelector<HTMLElement>(".item-card-emoji-fallback");
            if (fallback) {
              fallback.style.display = "grid";
            }
          }}
        />
      ) : null}
      <div className={resolvedFallbackClassName} style={{ display: imageUrl ? "none" : "grid" }}>
        {emoji || "📦"}
      </div>
      {overlay}
    </div>
  );
}

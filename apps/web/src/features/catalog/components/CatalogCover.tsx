import { useEffect, useState } from "react";

const fallbackCoverPath = "/media/comics/cover-fallback.png";

interface CatalogCoverProps {
  alt: string;
  coverPath: string | null;
  eager?: boolean;
  variant: "card" | "detail";
}

export function resolveCoverPath(coverPath: string | null): string {
  return coverPath ? `/${coverPath.replace(/^\/+/, "")}` : fallbackCoverPath;
}

export function CatalogCover({
  alt,
  coverPath,
  eager = false,
  variant,
}: CatalogCoverProps) {
  const [source, setSource] = useState(() => resolveCoverPath(coverPath));

  useEffect(() => {
    setSource(resolveCoverPath(coverPath));
  }, [coverPath]);

  return (
    <div className={`catalog-cover catalog-cover--${variant}`}>
      <img
        src={source}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        onError={() => {
          if (source !== fallbackCoverPath) {
            setSource(fallbackCoverPath);
          }
        }}
      />
    </div>
  );
}

"use client";

import { memo, useEffect, useState } from "react";
import { toDataURL } from "../lib/qrGenerator";
import type { QrOptions } from "../lib/types";

interface QrThumbnailProps {
  data: string;
  options?: Partial<QrOptions>;
  size?: number;
  className?: string;
}

/**
 * QR Code thumbnail component
 * Renders a small QR code preview as an image
 */
export const QrThumbnail = memo(function QrThumbnail({
  data,
  options = {},
  size = 80,
  className = "",
}: QrThumbnailProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!data) {
      setDataUrl("");
      return;
    }

    toDataURL(data, size * 2, options)
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [data, size, options]);

  if (!data || !dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.4}
          height={size * 0.4}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-400"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="3" height="3" />
          <rect x="18" y="14" width="3" height="3" />
          <rect x="14" y="18" width="3" height="3" />
          <rect x="18" y="18" width="3" height="3" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code"
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
});

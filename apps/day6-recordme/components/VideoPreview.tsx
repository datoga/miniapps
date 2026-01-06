"use client";

import { memo, useRef, useEffect } from "react";

interface VideoPreviewProps {
  stream: MediaStream | null;
  className?: string;
  muted?: boolean;
  mirrored?: boolean;
}

export const VideoPreview = memo(function VideoPreview({
  stream,
  className = "",
  muted = true,
  mirrored = true,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`h-full w-full object-cover ${className}`}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
    />
  );
});

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export const VideoPlayer = memo(function VideoPlayer({
  src,
  className = "",
}: VideoPlayerProps) {
  return (
    <video
      src={src}
      controls
      playsInline
      className={`h-full w-full object-contain ${className}`}
    />
  );
});


"use client";

import { memo, useRef, useEffect, useState, useCallback } from "react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  // Smooth time update using requestAnimationFrame
  const updateTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
    animationRef.current = requestAnimationFrame(updateTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      // Start smooth time updates
      animationRef.current = requestAnimationFrame(updateTime);
    };
    const onPause = () => {
      setIsPlaying(false);
      // Stop smooth time updates
      cancelAnimationFrame(animationRef.current);
    };
    const onEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      cancelAnimationFrame(animationRef.current);
    };
  }, [updateTime]);

  return (
    <div
      className={`relative h-full w-full ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(true)}
    >
      {/* Video container - video is already mirrored from recording */}
      <div className="h-full w-full">
        <video
          ref={videoRef}
          src={src}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Custom controls - not mirrored */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar - step=0.01 for smooth continuous progress */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="mb-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time display */}
          <span className="font-mono text-sm text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Click to play/pause */}
      <button
        onClick={togglePlay}
        className="absolute inset-0 cursor-pointer"
        aria-label={isPlaying ? "Pause" : "Play"}
      />
    </div>
  );
});


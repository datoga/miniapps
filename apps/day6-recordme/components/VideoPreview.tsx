"use client";

import { memo, useRef, useEffect, useState, useCallback } from "react";
import { PauseIcon, PlayIcon, FullscreenEnterIcon, FullscreenExitIcon } from "./Icons";

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

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const VideoPlayer = memo(function VideoPlayer({
  src,
  className = "",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  const changeSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
      ref={containerRef}
      className={`relative h-full w-full ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(true)}
    >
      {/* Video container - CSS mirrored to match live preview */}
      <div className="h-full w-full" style={{ transform: "scaleX(-1)" }}>
        <video
          ref={videoRef}
          src={src}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Fullscreen button - top right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        className={`absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
      </button>

      {/* Custom controls - not mirrored, z-10 to be above click area, overflow-visible for dropdown */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 overflow-visible bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
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
          onClick={(e) => e.stopPropagation()}
          className="mb-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon />}
            </button>

            {/* Time display */}
            <span className="font-mono text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Playback speed control */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeedMenu(!showSpeedMenu);
              }}
              className="flex h-10 items-center justify-center rounded-full bg-white/20 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              {playbackRate}x
            </button>

            {/* Speed menu - positioned above button */}
            {showSpeedMenu && (
              <div 
                className="absolute bottom-12 right-0 overflow-hidden rounded-xl bg-black/80 py-2 shadow-xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={(e) => {
                      e.stopPropagation();
                      changeSpeed(speed);
                    }}
                    className={`block w-full px-5 py-2 text-center text-sm transition-colors ${
                      playbackRate === speed
                        ? "bg-white/20 font-semibold text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click to play/pause - z-0 so controls are above */}
      <button
        onClick={togglePlay}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label={isPlaying ? "Pause" : "Play"}
      />
    </div>
  );
});


"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const MIC_STATE_KEY = "recordme-last-mic-state";

export interface MediaDevice {
  deviceId: string;
  label: string;
}

export interface UseMediaStreamOptions {
  initialVideoDeviceId?: string;
  micDefaultOn?: boolean;
  cameraDefault?: "front" | "back"; // "user" or "environment" facingMode
}

export interface UseMediaStreamResult {
  // Stream
  stream: MediaStream | null;

  // Devices
  videoDevices: MediaDevice[];
  selectedVideoDeviceId: string | null;

  // Permission states
  cameraPermission: "prompt" | "granted" | "denied";
  micPermission: "prompt" | "granted" | "denied";

  // State flags
  isLoading: boolean;
  error: string | null;

  // Actions
  switchCamera: (deviceId: string) => Promise<void>;
  setMicEnabled: (enabled: boolean) => void;
  isMicEnabled: boolean;

  // Cleanup
  stopStream: () => void;
}

/**
 * Hook to manage webcam and microphone streams
 * - Requests permissions on mount
 * - Enumerates devices after permission
 * - Allows switching cameras
 * - Allows enabling/disabling mic track (keeps track, toggles enabled)
 */
export function useMediaStream(options?: UseMediaStreamOptions): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(
    options?.initialVideoDeviceId || null
  );
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabledState] = useState(false);

  // Ref to track if we've already initialized
  const initializedRef = useRef(false);

  // Quality constraints (will be updated when starting recording)
  const qualityRef = useRef({ width: 1280, height: 720, fps: 30 });

  /**
   * Enumerate video devices
   */
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
        }));
      setVideoDevices(cameras);
      return cameras;
    } catch {
      return [];
    }
  }, []);

  /**
   * Get media stream with specified constraints
   */
  const getStream = useCallback(async (videoDeviceId?: string, includeAudio = true, useFacingMode = true) => {
    // Determine video constraints
    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: qualityRef.current.width },
      height: { ideal: qualityRef.current.height },
      frameRate: { ideal: qualityRef.current.fps },
    };

    if (videoDeviceId) {
      // Specific device requested
      videoConstraints.deviceId = { exact: videoDeviceId };
    } else if (useFacingMode && options?.cameraDefault) {
      // Use facingMode for initial camera selection
      videoConstraints.facingMode = options.cameraDefault === "front" ? "user" : "environment";
    }

    const constraints: MediaStreamConstraints = {
      video: videoConstraints,
      audio: includeAudio,
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  }, [options?.cameraDefault]);

  /**
   * Initialize stream and permissions
   */
  const initialize = useCallback(async () => {
    if (initializedRef.current) {return;}
    initializedRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // Try to get both video and audio
      let newStream: MediaStream;
      let gotMic = true;

      try {
        newStream = await getStream(options?.initialVideoDeviceId, true);
        setMicPermission("granted");
      } catch {
        // If audio fails, try video only
        try {
          newStream = await getStream(options?.initialVideoDeviceId, false);
          gotMic = false;
          setMicPermission("denied");
        } catch (videoError) {
          // Both failed
          if (videoError instanceof Error) {
            if (videoError.name === "NotAllowedError") {
              setCameraPermission("denied");
              setError("Camera access denied");
            } else {
              setError(videoError.message);
            }
          }
          setIsLoading(false);
          return;
        }
      }

      setCameraPermission("granted");

      // Set mic track enabled state based on permission and default setting
      if (gotMic) {
        const audioTrack = newStream.getAudioTracks()[0];
        if (audioTrack) {
          // Check localStorage for last mic state, fall back to settings default
          let micDefault = options?.micDefaultOn ?? false;
          try {
            const savedState = localStorage.getItem(MIC_STATE_KEY);
            if (savedState !== null) {
              micDefault = savedState === "1";
            }
          } catch {
            // Ignore storage errors
          }
          audioTrack.enabled = micDefault;
          setIsMicEnabledState(micDefault);
        }
      }

      setStream(newStream);

      // Now enumerate devices (labels available after permission)
      const cameras = await enumerateDevices();

      // Set selected device
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          setSelectedVideoDeviceId(settings.deviceId);
        } else if (cameras.length > 0 && cameras[0]) {
          setSelectedVideoDeviceId(cameras[0].deviceId);
        }
      }

      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to access camera");
      }
      setIsLoading(false);
    }
  }, [options?.initialVideoDeviceId, getStream, enumerateDevices]);

  /**
   * Switch to a different camera
   */
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!stream) {return;}

    try {
      // Get new stream with specified device (don't use facingMode when switching)
      const hasMic = stream.getAudioTracks().length > 0;
      const newStream = await getStream(deviceId, hasMic, false);

      // Stop old video track
      stream.getVideoTracks().forEach((track) => track.stop());

      // If we had mic, preserve its enabled state and stop old track
      if (hasMic) {
        const oldAudioTrack = stream.getAudioTracks()[0];
        const newAudioTrack = newStream.getAudioTracks()[0];
        if (oldAudioTrack && newAudioTrack) {
          newAudioTrack.enabled = oldAudioTrack.enabled;
          oldAudioTrack.stop();
        }
      }

      setStream(newStream);
      setSelectedVideoDeviceId(deviceId);
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  }, [stream, getStream]);

  /**
   * Enable/disable microphone and save state to localStorage
   */
  const setMicEnabled = useCallback((enabled: boolean) => {
    if (!stream) {return;}

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
      setIsMicEnabledState(enabled);
      // Save to localStorage for next session
      try {
        localStorage.setItem(MIC_STATE_KEY, enabled ? "1" : "0");
      } catch {
        // Ignore storage errors
      }
    }
  }, [stream]);

  /**
   * Stop all tracks and clear stream
   */
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      // Note: We don't stop stream on unmount to allow it to persist
      // The component using this hook should call stopStream when appropriate
    };
  }, [initialize]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [enumerateDevices]);

  return {
    stream,
    videoDevices,
    selectedVideoDeviceId,
    cameraPermission,
    micPermission,
    isLoading,
    error,
    switchCamera,
    setMicEnabled,
    isMicEnabled,
    stopStream,
  };
}


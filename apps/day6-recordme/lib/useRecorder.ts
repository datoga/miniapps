"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createUniqueFile, generateFilename, getBestMimeType } from "./capabilities";
import {
  trackFirstValue,
  trackRecordingCompleted,
  trackRecordingPaused,
  trackRecordingResumed,
  trackRecordingStarted,
} from "./ga";
import {
  getFolderHandle,
  getQualitySettings,
  pickDirectory,
  verifyFolderPermission,
  type RecorderSettings,
} from "./settings";

export type RecorderState =
  | "idle"
  | "countdown"
  | "recording"
  | "paused"
  | "processing"
  | "finished";

export interface RecordingResult {
  fileHandle: FileSystemFileHandle;
  filename: string;
  folderName: string;
}

export interface UseRecorderOptions {
  settings: RecorderSettings;
  stream: MediaStream | null;
  isMicEnabled: boolean;
  customFilename?: string;
}

export interface RecordingInfo {
  filename: string;
  folderName: string;
  mimeType: string;
  width: number;
  height: number;
  fps: number;
  bitrateMbps: number;
  audioEnabled: boolean;
  audioCodec: string | null;
  audioSampleRate: number | null;
  audioChannels: number | null;
}

export interface UseRecorderResult {
  // State
  state: RecorderState;
  countdownValue: number;
  elapsedMs: number;
  formatWarning: string | null;
  currentFilename: string; // Filename being written during recording
  recordingInfo: RecordingInfo | null; // Debug info during recording

  // Result
  result: RecordingResult | null;
  resultFile: File | null;
  resultUrl: string | null;

  // Actions
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<void>;
  resetRecorder: () => void;

  // Error
  error: string | null;
}

/**
 * Hook to manage MediaRecorder with incremental disk writes
 */
export function useRecorder(options: UseRecorderOptions): UseRecorderResult {
  const { settings, stream, isMicEnabled, customFilename } = options;

  const [state, setState] = useState<RecorderState>("idle");
  const [countdownValue, setCountdownValue] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [formatWarning, setFormatWarning] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState("");
  const [recordingInfo, setRecordingInfo] = useState<RecordingInfo | null>(null);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const writableRef = useRef<FileSystemWritableFileStream | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const elapsedIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const formatRef = useRef<"webm" | "mp4">("webm");
  const folderNameRef = useRef<string>("Selected folder");
  const filenameRef = useRef<string>("");
  const isClosingRef = useRef<boolean>(false);
  const bytesWrittenRef = useRef<number>(0);
  const canvasCleanupRef = useRef<(() => void) | null>(null);

  /**
   * Queue a write operation to maintain order
   */
  const queueWrite = useCallback((data: Blob) => {
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      // Skip writes if stream is closing or closed
      if (!writableRef.current || isClosingRef.current) {
        return;
      }

      try {
        const buffer = await data.arrayBuffer();
        // Double-check before writing (stream might have closed while waiting)
        if (!writableRef.current || isClosingRef.current) {
          return;
        }
        await writableRef.current.write(new Uint8Array(buffer));
        bytesWrittenRef.current += buffer.byteLength;
        console.log(
          `[Recording] Wrote ${buffer.byteLength} bytes, total: ${bytesWrittenRef.current}`
        );
      } catch (err) {
        // Ignore errors when closing (expected)
        if (!isClosingRef.current) {
          console.error("Write error:", err);
        }
      }
    });
  }, []);

  /**
   * Start elapsed time counter
   */
  const startElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
    }

    elapsedIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
      setElapsedMs(elapsed);
    }, 100);
  }, []);

  /**
   * Stop elapsed time counter
   */
  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    if (!stream) {
      setError("No media stream available");
      return;
    }

    setError(null);
    setFormatWarning(null);

    try {
      // 1. Get or pick folder
      let folderHandle = await getFolderHandle();

      if (folderHandle) {
        const hasPermission = await verifyFolderPermission(folderHandle);
        if (!hasPermission) {
          folderHandle = null;
        }
      }

      if (!folderHandle) {
        folderHandle = await pickDirectory();
        if (!folderHandle) {
          // User cancelled
          return;
        }
      }

      folderNameRef.current = folderHandle.name;

      // 2. Start countdown if configured
      const countdownSecs = settings.countdownSeconds;
      if (countdownSecs > 0) {
        setState("countdown");
        for (let i = countdownSecs; i > 0; i--) {
          setCountdownValue(i);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setCountdownValue(0);
      }

      // 3. Determine format
      const { mimeType, format, matchesPreference } = getBestMimeType(settings.preferMp4);
      formatRef.current = format;

      if (!matchesPreference) {
        setFormatWarning(settings.preferMp4 ? "mp4_not_supported" : "webm_not_supported");
      }

      // 4. Create file
      let filename: string;
      if (customFilename) {
        // Use custom filename, ensure it has the right extension
        const ext = `.${format}`;
        filename = customFilename.endsWith(ext) ? customFilename : `${customFilename}${ext}`;
      } else {
        filename = generateFilename(format, settings.qualityPreset);
      }
      filenameRef.current = filename;
      setCurrentFilename(filename);

      const { fileHandle, finalFilename } = await createUniqueFile(folderHandle, filename);
      fileHandleRef.current = fileHandle;
      filenameRef.current = finalFilename;
      setCurrentFilename(finalFilename);

      // 5. Create writable stream
      const writable = await fileHandle.createWritable();
      writableRef.current = writable;

      // 6. Get quality settings
      const quality = getQualitySettings(settings);

      // 7. Create MediaRecorder with original stream
      // Note: File is saved as others see you. In-app playback is CSS-mirrored.
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: quality.bitrateMbps * 1_000_000,
      });
      recorderRef.current = recorder;

      // 8. Handle data
      recorder.ondataavailable = (event) => {
        console.log(`[Recording] ondataavailable: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          queueWrite(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("Recorder error:", event);
        setError("Recording error occurred");
      };

      // 9. Start recording with timeslice
      bytesWrittenRef.current = 0; // Reset bytes counter
      recorder.start(1000); // 1 second chunks
      console.log("[Recording] Started with mimeType:", mimeType);

      // 10. Track state
      setState("recording");
      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pauseStartTimeRef.current = 0;
      isClosingRef.current = false;
      setElapsedMs(0);
      startElapsedTimer();

      // 10b. Set recording info for debug display
      // Extract audio codec from mimeType (e.g., "video/webm;codecs=vp8,opus" -> "opus")
      let audioCodec: string | null = null;
      const codecsMatch = mimeType.match(/codecs=([^;]+)/);
      if (codecsMatch && codecsMatch[1]) {
        const codecs = codecsMatch[1].split(",");
        // Audio codec is usually the second one (opus, mp4a, etc.)
        const secondCodec = codecs[1];
        const firstCodec = codecs[0];
        audioCodec = secondCodec ? secondCodec.trim() : firstCodec ? firstCodec.trim() : null;
      } else if (mimeType.includes("webm")) {
        audioCodec = "opus";
      } else if (mimeType.includes("mp4")) {
        audioCodec = "aac";
      }

      // Get audio track info for recording info display
      let audioSampleRate: number | null = null;
      let audioChannels: number | null = null;
      const infoAudioTrack = stream.getAudioTracks()[0];
      if (infoAudioTrack) {
        const audioSettings = infoAudioTrack.getSettings();
        audioSampleRate = audioSettings.sampleRate || null;
        audioChannels = audioSettings.channelCount || null;
      }

      setRecordingInfo({
        filename: finalFilename,
        folderName: folderHandle.name,
        mimeType,
        width: quality.width,
        height: quality.height,
        fps: quality.fps,
        bitrateMbps: quality.bitrateMbps,
        audioEnabled: isMicEnabled,
        audioCodec,
        audioSampleRate,
        audioChannels,
      });

      // 11. Track analytics
      trackRecordingStarted(isMicEnabled, format);
    } catch (err) {
      console.error("Start recording error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to start recording");
      }
      setState("idle");
    }
  }, [stream, settings, isMicEnabled, customFilename, queueWrite, startElapsedTimer]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (recorderRef.current && state === "recording") {
      recorderRef.current.pause();
      stopElapsedTimer();
      pauseStartTimeRef.current = Date.now();
      setState("paused");
      trackRecordingPaused();
    }
  }, [state, stopElapsedTimer]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (recorderRef.current && state === "paused") {
      recorderRef.current.resume();
      // Add the pause duration to total paused time
      totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
      pauseStartTimeRef.current = 0;
      setState("recording");
      startElapsedTimer();
      trackRecordingResumed();
    }
  }, [state, startElapsedTimer]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) {
      return;
    }

    setState("processing");
    stopElapsedTimer();

    try {
      const recorder = recorderRef.current;
      console.log(`[Recording] Stopping... state: ${recorder.state}`);

      // Create a promise that resolves when onstop fires
      const stopPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          console.log("[Recording] onstop event fired");
          resolve();
        };
      });

      // Request any pending data and stop
      if (recorder.state === "recording" || recorder.state === "paused") {
        console.log("[Recording] Calling stop()");
        recorder.stop();
      }

      // Wait for onstop event (fires after all ondataavailable events)
      await stopPromise;
      console.log("[Recording] Stop complete, waiting for writes...");

      // Clean up canvas mirroring now that recording is done
      if (canvasCleanupRef.current) {
        canvasCleanupRef.current();
        canvasCleanupRef.current = null;
      }

      // Mark as closing AFTER stop to allow final data to be written
      isClosingRef.current = true;

      // Wait for all pending writes to complete
      await writeQueueRef.current;

      console.log(`[Recording] Finished. Total bytes written: ${bytesWrittenRef.current}`);

      // Check if we have any data
      if (bytesWrittenRef.current === 0) {
        // No data was written - abort and clean up
        if (writableRef.current) {
          await writableRef.current.abort();
          writableRef.current = null;
        }
        setError("errors.noVideoData"); // Translation key
        setState("idle");
        return;
      }

      // Close writable stream
      if (writableRef.current) {
        await writableRef.current.close();
        writableRef.current = null;
      }

      // Get the file for preview
      if (fileHandleRef.current) {
        const file = await fileHandleRef.current.getFile();
        setResultFile(file);

        // Create object URL for playback
        const url = URL.createObjectURL(file);
        setResultUrl(url);

        setResult({
          fileHandle: fileHandleRef.current,
          filename: filenameRef.current,
          folderName: folderNameRef.current,
        });
      }

      setState("finished");

      // Track analytics
      trackRecordingCompleted(isMicEnabled, formatRef.current);
      trackFirstValue();
    } catch (err) {
      console.error("Stop recording error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to finalize recording");
      }
      setState("idle");
    }
  }, [isMicEnabled, stopElapsedTimer]);

  /**
   * Reset recorder to idle state
   */
  const resetRecorder = useCallback(() => {
    // Clean up canvas if still active
    if (canvasCleanupRef.current) {
      canvasCleanupRef.current();
      canvasCleanupRef.current = null;
    }

    // Revoke previous URL
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setResult(null);
    setResultFile(null);
    setResultUrl(null);
    setError(null);
    setFormatWarning(null);
    setElapsedMs(0);
    setCurrentFilename("");
    setRecordingInfo(null);
    setState("idle");

    recorderRef.current = null;
    fileHandleRef.current = null;
    isClosingRef.current = false;
  }, [resultUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopElapsedTimer();
      if (canvasCleanupRef.current) {
        canvasCleanupRef.current();
        canvasCleanupRef.current = null;
      }
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [stopElapsedTimer, resultUrl]);

  // Stop timer when not recording
  useEffect(() => {
    if (state !== "recording" && state !== "paused") {
      stopElapsedTimer();
    }
  }, [state, stopElapsedTimer]);

  return {
    state,
    countdownValue,
    elapsedMs,
    formatWarning,
    currentFilename,
    recordingInfo,
    result,
    resultFile,
    resultUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecorder,
    error,
  };
}

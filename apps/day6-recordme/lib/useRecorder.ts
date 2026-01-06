"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  getBestMimeType,
  generateFilename,
  createUniqueFile,
} from "./capabilities";
import {
  getFolderHandle,
  verifyFolderPermission,
  pickDirectory,
  getQualitySettings,
  type RecorderSettings,
} from "./settings";
import {
  trackRecordingStarted,
  trackRecordingCompleted,
  trackFirstValue,
  trackRecordingPaused,
  trackRecordingResumed,
} from "./ga";

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

  /**
   * Queue a write operation to maintain order
   */
  const queueWrite = useCallback((data: Blob) => {
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      // Skip writes if stream is closing or closed
      if (!writableRef.current || isClosingRef.current) {return;}

      try {
        const buffer = await data.arrayBuffer();
        // Double-check before writing (stream might have closed while waiting)
        if (!writableRef.current || isClosingRef.current) {return;}
        await writableRef.current.write(new Uint8Array(buffer));
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

      // 7. Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: quality.bitrateMbps * 1_000_000,
      });
      recorderRef.current = recorder;

      // 8. Handle data
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          queueWrite(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("Recorder error:", event);
        setError("Recording error occurred");
      };

      // 9. Start recording with timeslice for incremental writes
      recorder.start(1000); // 1 second chunks

      // 10. Track state
      setState("recording");
      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pauseStartTimeRef.current = 0;
      isClosingRef.current = false;
      setElapsedMs(0);
      startElapsedTimer();

      // 10b. Set recording info for debug display
      setRecordingInfo({
        filename: finalFilename,
        folderName: folderHandle.name,
        mimeType,
        width: quality.width,
        height: quality.height,
        fps: quality.fps,
        bitrateMbps: quality.bitrateMbps,
        audioEnabled: isMicEnabled,
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
    if (!recorderRef.current) {return;}

    setState("processing");
    stopElapsedTimer();

    // Mark as closing to prevent new writes
    isClosingRef.current = true;

    try {
      // Stop recorder - this will trigger final ondataavailable
      recorderRef.current.stop();

      // Small delay to let final data events fire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for all pending writes to complete
      await writeQueueRef.current;

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


/**
 * Camera Controls Footer Component
 *
 * A modern footer with camera controls inspired by contrastio/recorder.
 * Contains record button, camera selector, and status displays.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import RecordButton from "./RecordButton";
import RecordingDuration from "./RecordingDuration";
import useStopwatch from "@/hooks/useStopwatch";
import { CameraState } from "@/lib/types";

interface CameraControlsProps {
  cameras: CameraState[];
  selectedCamera: CameraState | null;
  onCameraSelect: (camera: CameraState) => void;
  onRefresh: () => void;
}

export default function CameraControls({
  cameras,
  selectedCamera,
  onCameraSelect,
  onRefresh,
}: CameraControlsProps) {
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [isRecordLoading, setIsRecordLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const stopwatch = useStopwatch();

  // Sync state with selected camera
  useEffect(() => {
    if (selectedCamera) {
      setIsStreaming(selectedCamera.isStreaming);
      setIsRecording(selectedCamera.isRecording);

      // If recording was already in progress, start stopwatch
      if (selectedCamera.isRecording && selectedCamera.recordingStartTime) {
        const elapsed =
          Date.now() - new Date(selectedCamera.recordingStartTime).getTime();
        // Note: We'd need to modify useStopwatch to support setting initial elapsed
        if (!stopwatch.isRunning) {
          stopwatch.start();
        }
      }
    }
  }, [selectedCamera]);

  // Toggle stream for selected camera
  const toggleStream = useCallback(async () => {
    if (!selectedCamera) return;

    setIsStreamLoading(true);
    try {
      const action = isStreaming ? "stop" : "start";
      const response = await fetch(
        `/api/cameras/${selectedCamera.id}/stream/${action}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (result.success) {
        setIsStreaming(!isStreaming);
        onRefresh();
      }
    } catch (error) {
      console.error("Stream toggle failed:", error);
    } finally {
      setIsStreamLoading(false);
    }
  }, [selectedCamera, isStreaming, onRefresh]);

  // Toggle recording for selected camera
  const toggleRecording = useCallback(async () => {
    if (!selectedCamera) return;

    setIsRecordLoading(true);
    try {
      const action = isRecording ? "stop" : "start";
      const response = await fetch(
        `/api/cameras/${selectedCamera.id}/record/${action}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (result.success) {
        if (isRecording) {
          stopwatch.stop();
          stopwatch.reset();
        } else {
          stopwatch.reset();
          stopwatch.start();
        }
        setIsRecording(!isRecording);
        onRefresh();
      }
    } catch (error) {
      console.error("Recording toggle failed:", error);
    } finally {
      setIsRecordLoading(false);
    }
  }, [selectedCamera, isRecording, stopwatch, onRefresh]);

  // Start all cameras streaming
  const startAllStreams = useCallback(async () => {
    setIsStreamLoading(true);
    try {
      await Promise.all(
        cameras.map((cam) =>
          fetch(`/api/cameras/${cam.id}/stream/start`, { method: "POST" })
        )
      );
      onRefresh();
    } catch (error) {
      console.error("Start all streams failed:", error);
    } finally {
      setIsStreamLoading(false);
    }
  }, [cameras, onRefresh]);

  // Record all cameras
  const toggleRecordAll = useCallback(async () => {
    const anyRecording = cameras.some((c) => c.isRecording);
    setIsRecordLoading(true);

    try {
      const action = anyRecording ? "stop" : "start";
      await Promise.all(
        cameras.map((cam) =>
          fetch(`/api/cameras/${cam.id}/record/${action}`, { method: "POST" })
        )
      );

      if (anyRecording) {
        stopwatch.stop();
        stopwatch.reset();
      } else {
        stopwatch.reset();
        stopwatch.start();
      }

      onRefresh();
    } catch (error) {
      console.error("Record all failed:", error);
    } finally {
      setIsRecordLoading(false);
    }
  }, [cameras, stopwatch, onRefresh]);

  const anyRecording = cameras.some((c) => c.isRecording);

  return (
    <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Recording duration */}
          <div className="flex-1 flex items-center">
            <RecordingDuration
              duration={stopwatch.formatTime()}
              isRecording={stopwatch.isRunning}
            />
          </div>

          {/* Center: Main controls */}
          <div className="flex items-center gap-6">
            {/* Stream all button */}
            <button
              onClick={startAllStreams}
              disabled={isStreamLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">Stream All</span>
            </button>

            {/* Main record button */}
            <RecordButton
              isRecording={anyRecording}
              isLoading={isRecordLoading}
              onClick={toggleRecordAll}
              size="lg"
            />
          </div>

          {/* Right: Individual camera controls */}
          <div className="flex-1 flex items-center justify-end gap-3">
            {selectedCamera && (
              <>
                <button
                  onClick={toggleStream}
                  disabled={isStreamLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    isStreaming
                      ? "bg-gray-600 hover:bg-gray-500"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {isStreamLoading
                    ? "Loading..."
                    : isStreaming
                    ? "Stop Stream"
                    : "Start Stream"}
                </button>

                <button
                  onClick={toggleRecording}
                  disabled={isRecordLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-green-600 hover:bg-green-500"
                  }`}
                >
                  {isRecordLoading
                    ? "Loading..."
                    : isRecording
                    ? "Stop Rec"
                    : "Start Rec"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

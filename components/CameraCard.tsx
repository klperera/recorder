/**
 * Camera Card Component
 *
 * Displays a single camera with:
 * - Live video preview (HLS)
 * - Stream start/stop controls
 * - Recording start/stop controls
 * - Status indicators
 */

"use client";

import { useState, useCallback } from "react";
import HlsPlayer from "./HlsPlayer";
import { CameraState } from "@/lib/types";

interface CameraCardProps {
  camera: CameraState;
  onStatusChange?: () => void; // Callback to refresh camera list
}

export default function CameraCard({
  camera,
  onStatusChange,
}: CameraCardProps) {
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [isRecordLoading, setIsRecordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStreaming, setLocalStreaming] = useState(camera.isStreaming);
  const [localRecording, setLocalRecording] = useState(camera.isRecording);

  // Toggle HLS stream
  const toggleStream = useCallback(async () => {
    setError(null);
    setIsStreamLoading(true);

    try {
      const action = localStreaming ? "stop" : "start";
      const response = await fetch(
        `/api/cameras/${camera.id}/stream/${action}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (result.success) {
        setLocalStreaming(!localStreaming);
        onStatusChange?.();
      } else {
        setError(result.error || "Failed to toggle stream");
      }
    } catch {
      setError("Network error. Check if the server is running.");
    } finally {
      setIsStreamLoading(false);
    }
  }, [camera.id, localStreaming, onStatusChange]);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    setError(null);
    setIsRecordLoading(true);

    try {
      const action = localRecording ? "stop" : "start";
      const response = await fetch(
        `/api/cameras/${camera.id}/record/${action}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (result.success) {
        setLocalRecording(!localRecording);
        onStatusChange?.();
      } else {
        setError(result.error || "Failed to toggle recording");
      }
    } catch {
      setError("Network error. Check if the server is running.");
    } finally {
      setIsRecordLoading(false);
    }
  }, [camera.id, localRecording, onStatusChange]);

  // Calculate recording duration
  const getRecordingDuration = () => {
    if (!camera.recordingStartTime) return null;
    const start = new Date(camera.recordingStartTime).getTime();
    const now = Date.now();
    const seconds = Math.floor((now - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Camera name header */}
      <div className="px-4 py-3 bg-gray-900 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{camera.name}</h3>
        <div className="flex items-center gap-2">
          {/* Streaming indicator */}
          {localStreaming && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {/* Recording indicator */}
          {localRecording && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              REC {getRecordingDuration()}
            </span>
          )}
        </div>
      </div>

      {/* Video preview area */}
      <div className="aspect-video bg-gray-900">
        {localStreaming ? (
          <HlsPlayer
            src={`/streams/${camera.id}/stream.m3u8`}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-4xl mb-2">📷</div>
              <div className="text-gray-400 text-sm">Stream not started</div>
              <div className="text-gray-500 text-xs mt-1">
                Click &quot;Start Stream&quot; to view live feed
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Control buttons */}
      <div className="p-4 flex gap-3">
        {/* Stream toggle button */}
        <button
          onClick={toggleStream}
          disabled={isStreamLoading}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            localStreaming
              ? "bg-gray-600 hover:bg-gray-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isStreamLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {localStreaming ? "Stopping..." : "Starting..."}
            </span>
          ) : localStreaming ? (
            "⏹ Stop Stream"
          ) : (
            "▶ Start Stream"
          )}
        </button>

        {/* Recording toggle button */}
        <button
          onClick={toggleRecording}
          disabled={isRecordLoading}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            localRecording
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-green-600 hover:bg-green-500 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecordLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {localRecording ? "Stopping..." : "Starting..."}
            </span>
          ) : localRecording ? (
            "⏹ Stop Recording"
          ) : (
            "🔴 Start Recording"
          )}
        </button>
      </div>

      {/* Camera info footer */}
      <div className="px-4 py-2 bg-gray-900/50 text-xs text-gray-500">
        <div className="truncate" title={camera.rtspUrl}>
          ID: {camera.id}
        </div>
        {camera.currentRecordingFile && (
          <div className="truncate mt-1">📁 {camera.currentRecordingFile}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Video Preview Component
 *
 * A modern video preview container with overlay controls.
 * Supports live HLS streaming with status indicators.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoPreviewProps {
  cameraId: string;
  cameraName: string;
  isStreaming: boolean;
  isRecording: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function VideoPreview({
  cameraId,
  cameraName,
  isStreaming,
  isRecording,
  isSelected,
  onClick,
}: VideoPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup HLS for browsers that don't natively support it
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isStreaming) {
      const streamUrl = `/streams/${cameraId}/stream.m3u8`;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.startLoad();

        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari natively supports HLS
        video.src = streamUrl;
      }
    }
  }, [cameraId, isStreaming]);

  return (
    <div
      className={`
        relative w-full h-full bg-gray-900 rounded-xl overflow-hidden
        transition-all duration-200
        ${isSelected ? "ring-2 ring-red-500/50" : ""}
      `}
      style={{ minHeight: 240 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Video content */}
      {isStreaming ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          controls
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Click to start stream</p>
          </div>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Camera name label */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="text-white font-medium text-sm drop-shadow-lg">
          {cameraName}
        </span>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/80 rounded text-xs font-medium text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {isRecording && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/80 rounded text-xs font-medium text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              REC
            </span>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

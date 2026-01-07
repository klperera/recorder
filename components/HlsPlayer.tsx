/**
 * HLS Video Player Component
 *
 * Uses HLS.js library to play HLS streams in browsers that don't support
 * HLS natively (most browsers except Safari).
 *
 * Safari has native HLS support, so we use the native video element there.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsPlayerProps {
  src: string; // HLS playlist URL (e.g., /streams/camera-1/stream.m3u8)
  className?: string;
  autoPlay?: boolean;
}

export default function HlsPlayer({
  src,
  className = "",
  autoPlay = true,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setIsLoading(true);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS.js is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        // Low latency settings
        lowLatencyMode: true,
        liveSyncDuration: 1,
        liveMaxLatencyDuration: 5,
        liveDurationInfinity: true,
        // Retry settings
        manifestLoadingRetryDelay: 1000,
        levelLoadingRetryDelay: 1000,
        fragLoadingRetryDelay: 1000,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay might be blocked, that's okay
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover network errors
              console.log("[HLS] Network error, attempting recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("[HLS] Media error, attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              setError(
                "Stream error. The camera may be offline or not streaming."
              );
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari has native HLS support
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
    } else {
      setError("HLS is not supported in this browser");
    }

    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        muted // Muted for autoplay policy
        playsInline
      />

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Connecting to stream...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center p-4">
            <div className="text-red-400 text-sm">{error}</div>
            <div className="text-gray-400 text-xs mt-2">
              Make sure the camera is online and streaming is started
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Camera Grid Component
 *
 * Main component that displays all cameras in a responsive grid.
 * Fetches camera status from API and provides real-time updates.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import CameraCard from "./CameraCard";
import { CameraState } from "@/lib/types";

export default function CameraGrid() {
  const [cameras, setCameras] = useState<CameraState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch camera status from API
  const fetchCameras = useCallback(async () => {
    try {
      const response = await fetch("/api/cameras");
      const result = await response.json();

      if (result.success && result.data) {
        setCameras(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch cameras");
      }
    } catch {
      setError("Failed to connect to server. Make sure the app is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchCameras();

    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchCameras, 5000);

    return () => clearInterval(interval);
  }, [fetchCameras]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading cameras...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-red-900/20 rounded-lg">
          <div className="text-red-400 text-lg mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
          <button
            onClick={fetchCameras}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No cameras configured
  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
          <div className="text-4xl mb-4">📷</div>
          <div className="text-xl text-white mb-2">No Cameras Configured</div>
          <div className="text-gray-400 text-sm">
            Edit{" "}
            <code className="bg-gray-700 px-2 py-0.5 rounded">
              lib/config.ts
            </code>{" "}
            to add your IP cameras.
          </div>
        </div>
      </div>
    );
  }

  // Camera grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          camera={camera}
          onStatusChange={fetchCameras}
        />
      ))}
    </div>
  );
}

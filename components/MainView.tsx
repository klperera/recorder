"use client";

import { useState, useEffect, useCallback } from "react";
import VideoPreview from "./VideoPreview";
import CameraControls from "./CameraControls";
import { Camera, CameraState } from "@/lib/types";

export default function MainView() {
  const [cameras, setCameras] = useState<CameraState[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load of cameras from database
  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    // Listen for header events
    const onSelect = (e: Event) => {
      try {
        const ev = e as CustomEvent<{ id: string }>;
        const id = ev.detail?.id;
        if (id) {
          const cam = cameras.find((c) => c.id === id);
          if (cam) setSelectedCamera(cam);
          else {
            localStorage.setItem("selectedCameraId", id);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    const onCamerasUpdated = () => {
      loadCameras();
    };

    // Listen for localStorage changes (from other tabs or same-page updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedCameraId" && e.newValue) {
        const cam = cameras.find((c) => c.id === e.newValue);
        if (cam) {
          setSelectedCamera(cam);
        }
      }
    };

    window.addEventListener("camera-selected", onSelect as EventListener);
    window.addEventListener("cameras-updated", onCamerasUpdated);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("camera-selected", onSelect as EventListener);
      window.removeEventListener("cameras-updated", onCamerasUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [cameras]);

  const loadCameras = async () => {
    try {
      // Fetch cameras from database
      const response = await fetch("/api/db/cameras");
      if (!response.ok) {
        throw new Error("Failed to fetch cameras");
      }
      const { cameras: fetchedCameras } = await response.json();
      console.log("Fetched cameras:", fetchedCameras);

      const camerasWithState = (fetchedCameras || []).map((cam: Camera) => ({
        ...cam,
        isStreaming: false,
        isRecording: false,
      }));

      setCameras(camerasWithState);

      // Restore selected camera from localStorage or select first
      const savedSelectedId = localStorage.getItem("selectedCameraId");
      if (savedSelectedId && camerasWithState.length > 0) {
        const savedCamera = camerasWithState.find(
          (cam: CameraState) => cam.id === savedSelectedId
        );
        if (savedCamera) {
          setSelectedCamera(savedCamera);
        } else if (camerasWithState.length > 0) {
          setSelectedCamera(camerasWithState[0]);
        }
      } else if (camerasWithState.length > 0) {
        setSelectedCamera(camerasWithState[0]);
      }
    } catch (err) {
      console.error("Failed to load cameras:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch camera status from API
  const fetchCameras = useCallback(async () => {
    try {
      const response = await fetch("/api/cameras");
      const result = await response.json();

      if (result.success && result.data) {
        setCameras(result.data);

        // Update selected camera if it exists
        if (selectedCamera) {
          const updated = result.data.find(
            (c: CameraState) => c.id === selectedCamera.id
          );
          if (updated) setSelectedCamera(updated);
        } else if (result.data.length > 0) {
          setSelectedCamera(result.data[0]);
        }

        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch camera status:", err);
    }
  }, [selectedCamera]);

  // Handle camera selection
  const handleCameraSelect = (camera: CameraState) => {
    setSelectedCamera(camera);
  };

  // Handle click on video preview
  const handlePreviewClick = async (camera: CameraState) => {
    setSelectedCamera(camera);

    // Auto-start stream if not streaming
    if (!camera.isStreaming) {
      try {
        await fetch(`/api/cameras/${camera.id}/stream/start`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to start stream:", error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-lg">Loading cameras...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 rounded-2xl max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Connection Error
          </h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchCameras}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main content area - Single camera view */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Video preview or no cameras message */}
        {cameras.length === 0 && !isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 bg-gray-800/50 rounded-2xl max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-500"
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
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Cameras Configured
              </h3>
              <p className="text-gray-400">
                Click the &quot;Add Camera&quot; button in the header to add
                your first IP camera.
              </p>
            </div>
          </div>
        ) : (
          // Video preview area
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            {selectedCamera ? (
              <div className="w-full h-full max-w-7xl">
                <VideoPreview
                  cameraId={selectedCamera.id}
                  cameraName={selectedCamera.name}
                  isStreaming={selectedCamera.isStreaming}
                  isRecording={selectedCamera.isRecording}
                  isSelected={true}
                  onClick={() => handlePreviewClick(selectedCamera)}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Select a camera to view</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Controls footer */}
      {cameras.length > 0 && (
        <CameraControls
          cameras={cameras}
          selectedCamera={selectedCamera}
          onCameraSelect={handleCameraSelect}
          onRefresh={fetchCameras}
        />
      )}
    </>
  );
}

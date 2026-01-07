"use client";

import { useState, useEffect } from "react";
import { Camera } from "@/lib/types";

interface CameraManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraManagementModal({
  isOpen,
  onClose,
}: CameraManagementModalProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newRtspUrl, setNewRtspUrl] = useState("");
  const [newIsEnabled, setNewIsEnabled] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCameras = async () => {
      try {
        const response = await fetch("/api/db/cameras");
        if (!response.ok) {
          throw new Error("Failed to fetch cameras");
        }
        const { cameras: fetchedCameras } = await response.json();
        setCameras(fetchedCameras || []);
      } catch (err) {
        console.error("Failed to load cameras:", err);
      }
    };
    if (isOpen) {
      loadCameras();
    }
  }, [isOpen]);

  const handleAddCamera = async () => {
    setError("");

    if (!newName.trim()) {
      setError("Camera name is required");
      return;
    }

    if (!newIpAddress.trim()) {
      setError("IP address is required");
      return;
    }

    // Basic IP address validation
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipPattern.test(newIpAddress.trim())) {
      setError("Please enter a valid IP address");
      return;
    }

    if (!newRtspUrl.trim()) {
      setError("RTSP URL is required");
      return;
    }

    if (!newRtspUrl.startsWith("rtsp://")) {
      setError("RTSP URL must start with rtsp://");
      return;
    }

    try {
      const response = await fetch("/api/db/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          ipAddress: newIpAddress.trim(),
          rtspUrl: newRtspUrl.trim(),
          isEnabled: newIsEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add camera");
      }

      const { camera } = await response.json();

      // Update local state
      const updatedCameras = [...cameras, camera];
      setCameras(updatedCameras);
      localStorage.setItem("selectedCameraId", camera.id);

      // Notify components
      window.dispatchEvent(new CustomEvent("cameras-updated"));
      window.dispatchEvent(
        new CustomEvent("camera-selected", { detail: { id: camera.id } })
      );

      // Reset form
      setNewName("");
      setNewIpAddress("");
      setNewRtspUrl("");
      setNewIsEnabled(true);
      setIsAddMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add camera");
    }
  };

  const handleRemoveCamera = async (id: string) => {
    if (!confirm("Are you sure you want to remove this camera?")) {
      return;
    }

    try {
      const response = await fetch(`/api/db/cameras/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete camera");
      }

      const updatedCameras = cameras.filter((cam) => cam.id !== id);
      setCameras(updatedCameras);

      // If removed camera was selected, select first camera or clear
      const selectedId = localStorage.getItem("selectedCameraId");
      if (selectedId === id) {
        const newSelectedId =
          updatedCameras.length > 0 ? updatedCameras[0].id : "";
        localStorage.setItem("selectedCameraId", newSelectedId);
        window.dispatchEvent(
          new CustomEvent("camera-selected", { detail: { id: newSelectedId } })
        );
      }

      window.dispatchEvent(new CustomEvent("cameras-updated"));
    } catch (err) {
      console.error("Failed to remove camera:", err);
      alert("Failed to remove camera. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Camera Management
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Camera List */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Configured Cameras ({cameras.length})
            </h3>

            {cameras.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">
                No cameras configured yet.
              </p>
            ) : (
              <div className="space-y-2">
                {cameras.map((camera) => (
                  <div
                    key={camera.id}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">
                        {camera.name}
                      </h4>
                      <p className="text-gray-500 text-sm font-mono truncate">
                        {camera.rtspUrl}
                      </p>
                      {(camera as Camera).ipAddress && (
                        <p className="text-gray-600 text-xs mt-1">
                          IP: {(camera as Camera).ipAddress}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCamera(camera.id)}
                      className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove camera"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Camera Section */}
          {!isAddMode ? (
            <button
              onClick={() => setIsAddMode(true)}
              className="w-full p-4 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-lg text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Camera
            </button>
          ) : (
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-white font-medium mb-4">Add New Camera</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Camera Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Front Door"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    placeholder="e.g., 192.168.1.100"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    RTSP URL
                  </label>
                  <input
                    type="text"
                    value={newRtspUrl}
                    onChange={(e) => setNewRtspUrl(e.target.value)}
                    placeholder="rtsp://username:password@192.168.1.100:554/stream"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsEnabled}
                      onChange={(e) => setNewIsEnabled(e.target.checked)}
                      className="w-4 h-4 bg-gray-800 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 text-blue-600 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      Enable camera immediately
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsAddMode(false);
                      setNewName("");
                      setNewIpAddress("");
                      setNewRtspUrl("");
                      setNewIsEnabled(true);
                      setError("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCamera}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add Camera
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

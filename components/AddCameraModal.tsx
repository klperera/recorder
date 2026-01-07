/**
 * Add Camera Modal Component
 *
 * Modal dialog for adding new IP cameras to the system.
 */

"use client";

import { useState } from "react";

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (camera: {
    name: string;
    ipAddress: string;
    rtspUrl: string;
    isEnabled: boolean;
  }) => void;
}

export default function AddCameraModal({
  isOpen,
  onClose,
  onAdd,
}: AddCameraModalProps) {
  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError("Camera name is required");
      return;
    }

    if (!ipAddress.trim()) {
      setError("IP address is required");
      return;
    }

    // Basic IP address validation
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipPattern.test(ipAddress.trim())) {
      setError("Please enter a valid IP address (e.g., 192.168.1.100)");
      return;
    }

    if (!rtspUrl.trim()) {
      setError("RTSP URL is required");
      return;
    }

    if (!rtspUrl.startsWith("rtsp://")) {
      setError("RTSP URL must start with rtsp://");
      return;
    }

    // Add camera
    onAdd({
      name: name.trim(),
      ipAddress: ipAddress.trim(),
      rtspUrl: rtspUrl.trim(),
      isEnabled,
    });

    // Reset form
    setName("");
    setIpAddress("");
    setRtspUrl("");
    setIsEnabled(true);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setIpAddress("");
    setRtspUrl("");
    setIsEnabled(true);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Add New Camera</h2>
          <button
            onClick={handleClose}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Camera Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Camera Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Front Door, Back Yard"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* IP Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              IP Address
            </label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g., 192.168.1.100"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* RTSP URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              RTSP URL
            </label>
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://username:password@192.168.1.100:554/stream"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Include credentials in the URL. Example formats:
            </p>
            <ul className="mt-1 text-xs text-gray-500 space-y-1 ml-4">
              <li>• Generic: rtsp://admin:pass@192.168.1.100:554/stream</li>
              <li>
                • Hikvision: rtsp://admin:pass@IP:554/Streaming/Channels/101
              </li>
              <li>
                • Dahua: rtsp://admin:pass@IP:554/cam/realmonitor?channel=1
              </li>
            </ul>
          </div>

          {/* Is Enabled */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-5 h-5 bg-gray-900 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-300">
                Enable camera immediately
              </span>
            </label>
            <p className="mt-1 ml-8 text-xs text-gray-500">
              When enabled, the camera will be available for streaming and
              recording
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Camera
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

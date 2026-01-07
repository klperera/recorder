"use client";

import { useState } from "react";
import AddCameraModal from "./AddCameraModal";

export default function AddCameraButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = async (newCamera: {
    name: string;
    ipAddress: string;
    rtspUrl: string;
    isEnabled: boolean;
  }) => {
    try {
      // Save camera to Supabase
      const response = await fetch("/api/db/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCamera.name,
          ipAddress: newCamera.ipAddress,
          rtspUrl: newCamera.rtspUrl,
          isEnabled: newCamera.isEnabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add camera");
      }

      const { camera } = await response.json();

      // Set as selected
      localStorage.setItem("selectedCameraId", camera.id);

      // Notify other components
      window.dispatchEvent(new CustomEvent("cameras-updated"));
      window.dispatchEvent(
        new CustomEvent("camera-selected", { detail: { id: camera.id } })
      );

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to add camera:", err);
      alert(
        `Failed to add camera: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <>
      <button
        type="button"
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        onClick={() => setIsModalOpen(true)}
      >
        <svg
          className="w-4 h-4"
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
        <span className="hidden lg:inline">Add Camera</span>
      </button>

      {isModalOpen && (
        <AddCameraModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}

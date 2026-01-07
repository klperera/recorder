"use client";

import { useEffect, useState } from "react";
import { Camera } from "@/lib/types";

export default function CameraDropdownTop() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/db/cameras");
        if (!response.ok) {
          throw new Error("Failed to fetch cameras");
        }
        const { cameras: fetchedCameras } = await response.json();
        setCameras(fetchedCameras || []);

        const firstId = fetchedCameras.length > 0 ? fetchedCameras[0].id : "";
        const saved = localStorage.getItem("selectedCameraId") || firstId;
        setSelectedId(saved);
      } catch (err) {
        console.error("CameraDropdownTop: failed to load cameras", err);
      }
    };

    load();

    // Listen for cameras-updated event
    const onCamerasUpdated = () => {
      load();
    };
    window.addEventListener("cameras-updated", onCamerasUpdated);
    return () =>
      window.removeEventListener("cameras-updated", onCamerasUpdated);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    localStorage.setItem("selectedCameraId", id);
    // dispatch a global event so MainView can react
    window.dispatchEvent(
      new CustomEvent("camera-selected", { detail: { id } })
    );
  };

  if (cameras.length === 0) return null;

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={handleChange}
        className="appearance-none bg-gray-800 hover:bg-gray-700 text-white pl-3 pr-8 py-2 rounded-md text-sm font-medium transition-colors"
      >
        {cameras.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

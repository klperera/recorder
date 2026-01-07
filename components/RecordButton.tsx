/**
 * Record Button Component
 *
 * An animated record button inspired by contrastio/recorder.
 * Features pulse animation and visual feedback for recording state.
 */

"use client";

import { forwardRef } from "react";

interface RecordButtonProps {
  isRecording: boolean;
  isLoading?: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const RecordButton = forwardRef<HTMLButtonElement, RecordButtonProps>(
  (
    { isRecording, isLoading, onClick, size = "md", disabled, className = "" },
    ref
  ) => {
    const sizeClasses = {
      sm: "w-12 h-12",
      md: "w-16 h-16",
      lg: "w-20 h-20",
    };

    const innerSizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-14 h-14",
    };

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`
          relative flex items-center justify-center
          ${sizeClasses[size]}
          rounded-full
          border-2 border-gray-400
          bg-transparent
          transition-all duration-200
          hover:border-white
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
          ${className}
        `}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {/* Pulse animation ring (only when recording) */}
        {isRecording && !isLoading && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30" />
        )}

        {/* Inner button */}
        <span
          className={`
            ${innerSizeClasses[size]}
            transition-all duration-300 ease-out
            ${
              isRecording
                ? "bg-red-500 rounded-md scale-75"
                : "bg-red-500 rounded-full shadow-[0_0_20px_4px_rgba(239,68,68,0.4)]"
            }
            ${isLoading ? "animate-pulse" : ""}
          `}
        />

        {/* Loading spinner overlay */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>
    );
  }
);

RecordButton.displayName = "RecordButton";

export default RecordButton;

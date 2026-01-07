/**
 * Recording Duration Component
 *
 * Displays the current recording duration with a monospace font.
 * Inspired by contrastio/recorder's duration display.
 */

"use client";

interface RecordingDurationProps {
  duration: string;
  isRecording: boolean;
  className?: string;
}

export default function RecordingDuration({
  duration,
  isRecording,
  className = "",
}: RecordingDurationProps) {
  if (!isRecording) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Recording indicator dot */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>

      {/* Duration text */}
      <span
        className="font-mono font-medium text-white tabular-nums"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {duration}
      </span>
    </div>
  );
}

/**
 * Type definitions for the IP Camera Recorder application.
 */

// Camera configuration from the config file
export interface Camera {
  id: string;
  name: string;
  rtspUrl: string; // RTSP stream URL (e.g., rtsp://user:pass@192.168.1.100:554/stream)
  ipAddress?: string; // Optional IP address of the camera
  isEnabled?: boolean; // Optional flag to indicate if the camera is enabled
}


// Runtime state for each camera
export interface CameraState extends Camera {
  isRecording: boolean;
  isStreaming: boolean;
  recordingStartTime?: string;
  currentRecordingFile?: string;
}

// API response types
export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Recording metadata
export interface RecordingInfo {
  cameraId: string;
  filename: string;
  startTime: string;
  filePath: string;
}

// Process tracker entry
export interface ProcessEntry {
  pid: number;
  type: 'hls' | 'recording';
  cameraId: string;
  startTime: Date;
  outputPath?: string;
}

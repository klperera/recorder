/**
 * Camera configuration file.
 * 
 * Edit this file to add your IP cameras.
 * Each camera needs:
 *   - id: Unique identifier (used for folder names)
 *   - name: Display name in the UI
 *   - rtspUrl: Full RTSP URL including credentials
 * 
 * Example RTSP URLs:
 *   - Generic: rtsp://username:password@192.168.1.100:554/stream
 *   - Hikvision: rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101
 *   - Dahua: rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
 *   - Reolink: rtsp://admin:password@192.168.1.100:554/h264Preview_01_main
  */

/**
 * Application configuration
 */
export const appConfig = {
  // Base directory for all recordings (relative to project root)
  recordingsDir: './recordings',
  
  // Base directory for HLS stream files (relative to public folder for serving)
  hlsDir: './public/streams',
  
  // HLS segment duration in seconds
  hlsSegmentDuration: 2,
  
  // Number of HLS segments to keep in playlist
  hlsListSize: 5,
  
  // Recording segment duration before starting new file (in seconds, 0 = single file)
  recordingSegmentDuration: 0,
  
  // FFmpeg path (use 'ffmpeg' if in PATH, or full path like 'C:\\ffmpeg\\bin\\ffmpeg.exe')
  ffmpegPath: 'ffmpeg',
};


/**
 * FFmpeg Process Manager
 * 
 * This module manages FFmpeg processes for:
 * 1. HLS live streaming (converts RTSP to HLS for browser playback)
 * 2. Recording (saves RTSP stream to MP4 files)
 * 
 * Uses an in-memory Map to track active processes.
 * Processes are cleaned up on stop or when the server restarts.
 */

import { spawn, spawnSync, ChildProcess } from 'child_process';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { ProcessEntry } from './types';
import { appConfig } from './config';

// In-memory process tracker
// Key format: `${cameraId}-${type}` (e.g., "camera-1-hls" or "camera-1-recording")
const activeProcesses = new Map<string, { process: ChildProcess; entry: ProcessEntry }>();

/**
 * Generate a timestamped filename for recordings
 * Format: YYYY-MM-DD_HH-mm-ss.mp4
 */
function generateRecordingFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  return `${timestamp}.mp4`;
}

/**
 * Ensure a directory exists, create if not
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get the process key for a camera and type
 */
function getProcessKey(cameraId: string, type: 'hls' | 'recording'): string {
  return `${cameraId}-${type}`;
}

/**
 * Check whether the configured ffmpeg binary is available.
 * Returns true when `ffmpeg -version` runs successfully.
 */
function isFfmpegAvailable(): boolean {
  try {
    const res = spawnSync(appConfig.ffmpegPath, ['-version']);
    // spawnSync returns a status code; 0 indicates success
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Start HLS streaming for a camera
 * 
 * This spawns an FFmpeg process that:
 * - Connects to the RTSP stream
 * - Transcodes to H.264/AAC (browser-compatible)
 * - Outputs HLS segments (.ts files) and playlist (.m3u8)
 * 
 * FFmpeg Command Breakdown:
 * -rtsp_transport tcp    : Use TCP for RTSP (more reliable than UDP)
 * -i <rtsp_url>          : Input RTSP stream
 * -c:v libx264           : Transcode video to H.264 (or use 'copy' if already H.264)
 * -preset ultrafast      : Fastest encoding (low CPU usage)
 * -tune zerolatency      : Optimize for low latency streaming
 * -c:a aac               : Transcode audio to AAC
 * -f hls                 : Output format is HLS
 * -hls_time 2            : Each segment is 2 seconds
 * -hls_list_size 5       : Keep 5 segments in playlist
 * -hls_flags delete_segments : Delete old segments automatically
 * -hls_segment_filename  : Pattern for segment filenames
 * <output.m3u8>          : Output playlist file
 */
export async function startHlsStream(cameraId: string, rtspUrl: string): Promise<boolean> {
  const key = getProcessKey(cameraId, 'hls');
  
  // Validate RTSP URL
  if (!rtspUrl) {
    console.warn(`[HLS] Missing RTSP URL for ${cameraId}`);
    return false;
  }

  // Check if ffmpeg is available
  if (!isFfmpegAvailable()) {
    console.error('[HLS] FFmpeg not available. Set appConfig.ffmpegPath to a valid executable path.');
    return false;
  }

  // Check if already streaming
  if (activeProcesses.has(key)) {
    console.log(`[HLS] Stream already active for ${cameraId}`);
    return true;
  }
  
  // Ensure HLS output directory exists
  let hlsOutputDir = path.join(process.cwd(), appConfig.hlsDir, cameraId);
  try {
    await ensureDir(hlsOutputDir);
  } catch (err) {
    console.warn(`[HLS] Failed to create HLS output dir at ${hlsOutputDir}, falling back to temp dir:`, (err as Error).message);
    // fallback to OS temp directory which is writable in many hosting environments
    hlsOutputDir = path.join(os.tmpdir(), 'vapr', 'streams', cameraId);
    await ensureDir(hlsOutputDir);
  }
  
  const playlistPath = path.join(hlsOutputDir, 'stream.m3u8');
  const segmentPattern = path.join(hlsOutputDir, 'segment%03d.ts');
  
  // FFmpeg arguments for HLS streaming
  const ffmpegArgs = [
    // Input options
    '-rtsp_transport', 'tcp',           // Use TCP for RTSP transport
    '-i', rtspUrl,                       // Input RTSP URL
    
    // Video codec options
    '-c:v', 'libx264',                   // Transcode to H.264 for browser compatibility
    '-preset', 'ultrafast',              // Fast encoding, lower CPU usage
    '-tune', 'zerolatency',              // Low latency for live streaming
    '-g', '30',                          // Keyframe every 30 frames (1 sec at 30fps)
    
    // Audio codec options
    '-c:a', 'aac',                       // Transcode audio to AAC
    '-ar', '44100',                      // Audio sample rate
    '-b:a', '128k',                      // Audio bitrate
    
    // HLS output options
    '-f', 'hls',                         // Output format: HLS
    '-hls_time', String(appConfig.hlsSegmentDuration),  // Segment duration
    '-hls_list_size', String(appConfig.hlsListSize),    // Playlist size
    '-hls_flags', 'delete_segments+append_list',        // Cleanup old segments
    '-hls_segment_filename', segmentPattern,            // Segment naming pattern
    
    playlistPath                         // Output playlist file
  ];
  
  console.log(`[HLS] Starting stream for ${cameraId}`);
  console.log(`[HLS] Command: ${appConfig.ffmpegPath} ${ffmpegArgs.join(' ')}`);
  
  const ffmpegProcess = spawn(appConfig.ffmpegPath, ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],   // Capture stdout and stderr
    detached: false,                      // Keep attached to parent process
  });
  
  // Log FFmpeg output for debugging
  ffmpegProcess.stderr?.on('data', (data) => {
    const message = data.toString();
    // Only log important messages (not every frame)
    if (message.includes('Error') || message.includes('error') || message.includes('Opening')) {
      console.log(`[HLS ${cameraId}] ${message.trim()}`);
    }
  });
  
  ffmpegProcess.on('error', (err) => {
    console.error(`[HLS ${cameraId}] Process error:`, err.message);
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`[HLS ${cameraId}] FFmpeg executable not found at '${appConfig.ffmpegPath}'. Update appConfig.ffmpegPath to the full path to ffmpeg.`);
    }
    activeProcesses.delete(key);
  });
  
  ffmpegProcess.on('exit', (code, signal) => {
    console.log(`[HLS ${cameraId}] Process exited with code ${code}, signal ${signal}`);
    activeProcesses.delete(key);
  });
  
  // Store process reference
  activeProcesses.set(key, {
    process: ffmpegProcess,
    entry: {
      pid: ffmpegProcess.pid || 0,
      type: 'hls',
      cameraId,
      startTime: new Date(),
      outputPath: playlistPath,
    },
  });
  
  // Wait a moment for FFmpeg to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return ffmpegProcess.pid !== undefined;
}

/**
 * Stop HLS streaming for a camera
 */
export async function stopHlsStream(cameraId: string): Promise<boolean> {
  const key = getProcessKey(cameraId, 'hls');
  const processInfo = activeProcesses.get(key);
  
  if (!processInfo) {
    console.log(`[HLS] No active stream for ${cameraId}`);
    return true;
  }
  
  console.log(`[HLS] Stopping stream for ${cameraId}`);
  
  // Send SIGTERM for graceful shutdown
  processInfo.process.kill('SIGTERM');
  
  // Wait for process to exit
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      // Force kill if not exited after 5 seconds
      processInfo.process.kill('SIGKILL');
      resolve();
    }, 5000);
    
    processInfo.process.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  
  activeProcesses.delete(key);
  return true;
}

/**
 * Start recording for a camera
 * 
 * This spawns an FFmpeg process that:
 * - Connects to the RTSP stream
 * - Copies video/audio streams directly (no re-encoding for quality)
 * - Saves to MP4 file with timestamp
 * 
 * FFmpeg Command Breakdown:
 * -rtsp_transport tcp    : Use TCP for RTSP
 * -i <rtsp_url>          : Input RTSP stream
 * -c copy                : Copy streams without re-encoding (preserves quality)
 * -movflags +faststart   : Move metadata to start for streaming playback
 * <output.mp4>           : Output MP4 file
 */
export async function startRecording(cameraId: string, rtspUrl: string): Promise<{ success: boolean; filename?: string }> {
  const key = getProcessKey(cameraId, 'recording');
  
  // Validate RTSP URL
  if (!rtspUrl) {
    console.warn(`[Recording] Missing RTSP URL for ${cameraId}`);
    return { success: false };
  }

  // Check if ffmpeg is available
  if (!isFfmpegAvailable()) {
    console.error('[Recording] FFmpeg not available. Set appConfig.ffmpegPath to a valid executable path.');
    return { success: false };
  }

  // Check if already recording
  if (activeProcesses.has(key)) {
    const existing = activeProcesses.get(key);
    console.log(`[Recording] Already recording for ${cameraId}`);
    return { 
      success: true, 
      filename: existing?.entry.outputPath?.split(path.sep).pop() 
    };
  }
  
  // Ensure recording output directory exists
  let recordingDir = path.join(process.cwd(), appConfig.recordingsDir, cameraId);
  try {
    await ensureDir(recordingDir);
  } catch (err) {
    console.warn(`[Recording] Failed to create recording dir at ${recordingDir}, falling back to temp dir:`, (err as Error).message);
    recordingDir = path.join(os.tmpdir(), 'vapr', 'recordings', cameraId);
    await ensureDir(recordingDir);
  }
  
  const filename = generateRecordingFilename();
  const outputPath = path.join(recordingDir, filename);
  
  // FFmpeg arguments for recording
  const ffmpegArgs = [
    // Input options
    '-rtsp_transport', 'tcp',           // Use TCP for RTSP transport
    '-i', rtspUrl,                       // Input RTSP URL
    
    // Output options - copy streams for best quality
    '-c', 'copy',                        // Copy all streams without re-encoding
    '-movflags', '+faststart',           // Enable fast start for web playback
    
    // Handle stream errors gracefully
    '-err_detect', 'ignore_err',         // Ignore decoding errors
    '-fflags', '+genpts',                // Generate PTS if missing
    
    outputPath                           // Output file
  ];
  
  console.log(`[Recording] Starting recording for ${cameraId}`);
  console.log(`[Recording] Output: ${outputPath}`);
  console.log(`[Recording] Command: ${appConfig.ffmpegPath} ${ffmpegArgs.join(' ')}`);
  
  const ffmpegProcess = spawn(appConfig.ffmpegPath, ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  
  // Log FFmpeg output for debugging
  ffmpegProcess.stderr?.on('data', (data) => {
    const message = data.toString();
    if (message.includes('Error') || message.includes('error') || message.includes('Opening') || message.includes('Output')) {
      console.log(`[Recording ${cameraId}] ${message.trim()}`);
    }
  });
  
  ffmpegProcess.on('error', (err) => {
    console.error(`[Recording ${cameraId}] Process error:`, err.message);
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`[Recording ${cameraId}] FFmpeg executable not found at '${appConfig.ffmpegPath}'. Update appConfig.ffmpegPath to the full path to ffmpeg.`);
    }
    activeProcesses.delete(key);
  });
  
  ffmpegProcess.on('exit', (code, signal) => {
    console.log(`[Recording ${cameraId}] Process exited with code ${code}, signal ${signal}`);
    activeProcesses.delete(key);
  });
  
  // Store process reference
  activeProcesses.set(key, {
    process: ffmpegProcess,
    entry: {
      pid: ffmpegProcess.pid || 0,
      type: 'recording',
      cameraId,
      startTime: new Date(),
      outputPath,
    },
  });
  
  return { success: ffmpegProcess.pid !== undefined, filename };
}

/**
 * Stop recording for a camera
 * Sends 'q' to FFmpeg for graceful stop, which properly finalizes the MP4 file
 */
export async function stopRecording(cameraId: string): Promise<boolean> {
  const key = getProcessKey(cameraId, 'recording');
  const processInfo = activeProcesses.get(key);
  
  if (!processInfo) {
    console.log(`[Recording] No active recording for ${cameraId}`);
    return true;
  }
  
  console.log(`[Recording] Stopping recording for ${cameraId}`);
  
  // Send 'q' to FFmpeg stdin for graceful stop (finalizes MP4 properly)
  // If stdin is not available, use SIGINT
  try {
    processInfo.process.kill('SIGINT');
  } catch {
    processInfo.process.kill('SIGTERM');
  }
  
  // Wait for process to exit
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      // Force kill if not exited after 10 seconds
      try {
        processInfo.process.kill('SIGKILL');
      } catch {
        // Process may have already exited
      }
      resolve();
    }, 10000);
    
    processInfo.process.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  
  activeProcesses.delete(key);
  return true;
}

/**
 * Check if a camera is currently streaming HLS
 */
export function isStreaming(cameraId: string): boolean {
  const key = getProcessKey(cameraId, 'hls');
  return activeProcesses.has(key);
}

/**
 * Check if a camera is currently recording
 */
export function isRecording(cameraId: string): boolean {
  const key = getProcessKey(cameraId, 'recording');
  return activeProcesses.has(key);
}

/**
 * Get recording info for a camera
 */
export function getRecordingInfo(cameraId: string): ProcessEntry | undefined {
  const key = getProcessKey(cameraId, 'recording');
  return activeProcesses.get(key)?.entry;
}

/**
 * Get all active processes (for status/debugging)
 */
export function getAllActiveProcesses(): ProcessEntry[] {
  return Array.from(activeProcesses.values()).map(p => p.entry);
}

/**
 * Stop all processes (for cleanup on server shutdown)
 */
export async function stopAllProcesses(): Promise<void> {
  console.log('[Cleanup] Stopping all FFmpeg processes...');
  
  const stopPromises: Promise<void>[] = [];
  
  for (const [, processInfo] of activeProcesses) {
    stopPromises.push(
      new Promise<void>((resolve) => {
        processInfo.process.kill('SIGTERM');
        
        const timeout = setTimeout(() => {
          try {
            processInfo.process.kill('SIGKILL');
          } catch {
            // Ignore
          }
          resolve();
        }, 5000);
        
        processInfo.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      })
    );
  }
  
  await Promise.all(stopPromises);
  activeProcesses.clear();
  console.log('[Cleanup] All processes stopped');
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  stopAllProcesses().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  stopAllProcesses().then(() => process.exit(0));
});

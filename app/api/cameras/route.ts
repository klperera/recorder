/**
 * API Route: GET /api/cameras
 * 
 * Returns the list of all configured cameras with their current status.
 * Status includes whether each camera is streaming HLS and/or recording.
 */

import { NextResponse } from 'next/server';
import { isStreaming, isRecording, getRecordingInfo } from '@/lib/ffmpeg-manager';
import { CameraState, ApiResponse, Camera } from '@/lib/types';

// Helper to get cameras from a server-side data source
// In production, this would read from a database
function getCamerasFromStorage(): Camera[] {
  // For now, return empty array - cameras are managed client-side via localStorage
  // You can extend this to read from a file or database
  return [];
}

export async function GET(): Promise<NextResponse<ApiResponse<CameraState[]>>> {
  try {
    // Get cameras (from database, file, or other server-side storage)
    const cameras = getCamerasFromStorage();
    
    // Map camera configs to states with live status
    const cameraStates: CameraState[] = cameras.map(camera => {
      const recordingInfo = getRecordingInfo(camera.id);
      
      return {
        id: camera.id,
        name: camera.name,
        rtspUrl: camera.rtspUrl,
        isRecording: isRecording(camera.id),
        isStreaming: isStreaming(camera.id),
        recordingStartTime: recordingInfo?.startTime.toISOString(),
        currentRecordingFile: recordingInfo?.outputPath?.split(/[\\/]/).pop(),
      };
    });
    
    return NextResponse.json({
      success: true,
      data: cameraStates,
    });
  } catch (error) {
    console.error('[API /cameras] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

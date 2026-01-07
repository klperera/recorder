/**
 * API Route: POST /api/cameras/[id]/record/start
 * 
 * Starts recording for a specific camera.
 * Creates MP4 files in /recordings/[camera-id]/ with timestamped filenames.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cameras } from '@/lib/config';
import { startRecording, isRecording, getRecordingInfo } from '@/lib/ffmpeg-manager';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ filename: string }>>> {
  try {
    const { id } = await params;
    
    // Find camera configuration
    const camera = cameras.find(c => c.id === id);
    
    if (!camera) {
      return NextResponse.json(
        {
          success: false,
          error: `Camera not found: ${id}`,
        },
        { status: 404 }
      );
    }
    
    // Check if already recording
    if (isRecording(id)) {
      const info = getRecordingInfo(id);
      return NextResponse.json({
        success: true,
        message: 'Already recording',
        data: { 
          filename: info?.outputPath?.split(/[\\/]/).pop() || 'unknown.mp4' 
        },
      });
    }
    
    // Start recording
    const result = await startRecording(id, camera.rtspUrl);
    
    if (result.success && result.filename) {
      return NextResponse.json({
        success: true,
        message: 'Recording started',
        data: { filename: result.filename },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to start recording. Check FFmpeg installation and camera URL.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API record/start] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

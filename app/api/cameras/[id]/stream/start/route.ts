/**
 * API Route: POST /api/cameras/[id]/stream/start
 * 
 * Starts the HLS live stream for a specific camera.
 * This creates segment files in /public/streams/[camera-id]/
 * that can be played by HLS.js in the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cameras } from '@/lib/config';
import { startHlsStream, isStreaming } from '@/lib/ffmpeg-manager';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ hlsUrl: string }>>> {
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
    
    // Check if already streaming
    if (isStreaming(id)) {
      return NextResponse.json({
        success: true,
        message: 'Stream already active',
        data: { hlsUrl: `/streams/${id}/stream.m3u8` },
      });
    }
    
    // Start the HLS stream
    const success = await startHlsStream(id, camera.rtspUrl);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'HLS stream started',
        data: { hlsUrl: `/streams/${id}/stream.m3u8` },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to start HLS stream. Check FFmpeg installation and camera URL.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API stream/start] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

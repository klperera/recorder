/**
 * API Route: POST /api/cameras/[id]/stream/stop
 * 
 * Stops the HLS live stream for a specific camera.
 * This terminates the FFmpeg process and cleans up resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cameras } from '@/lib/config';
import { stopHlsStream } from '@/lib/ffmpeg-manager';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    
    // Verify camera exists
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
    
    // Stop the HLS stream
    await stopHlsStream(id);
    
    return NextResponse.json({
      success: true,
      message: 'HLS stream stopped',
    });
  } catch (error) {
    console.error('[API stream/stop] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

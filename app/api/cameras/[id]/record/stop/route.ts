/**
 * API Route: POST /api/cameras/[id]/record/stop
 * 
 * Stops recording for a specific camera.
 * Properly finalizes the MP4 file so it's playable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stopRecording } from '@/lib/ffmpeg-manager';
import { ApiResponse } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const supabase = await createClient();
  try {
    const { id } = await params;
    
   const {data: camera , error: cameraError} = await supabase.from('cameras').select('*').eq('id', id).single();
    console.log("🚀 ~ POST ~ camera:", camera)

    if (cameraError) {
      console.error('Error fetching camera:', cameraError);
    }
    
    if (!camera) {
      return NextResponse.json(
        {
          success: false,
          error: `Camera not found: ${id}`,
        },
        { status: 404 }
      );
    }
    
    // Stop recording
    await stopRecording(id);
    
    return NextResponse.json({
      success: true,
      message: 'Recording stopped',
    });
  } catch (error) {
    console.error('[API record/stop] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

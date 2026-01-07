/**
 * API Route: POST /api/cameras/[id]/stream/start
 * 
 * Starts the HLS live stream for a specific camera.
 * This creates segment files in /public/streams/[camera-id]/
 * that can be played by HLS.js in the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { startHlsStream, isStreaming } from '@/lib/ffmpeg-manager';
import { ApiResponse } from '@/lib/types';
import {createClient} from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ hlsUrl: string }>>> {
  const supabase = await createClient();
  try {
    const { id } = await params;
    
   const {data: camera , error: cameraError} = await supabase.from('cameras').select('*').eq('id', id).single();
   console.log("🚀 ~ POST ~ camera:", camera)
   if (cameraError) {
    console.error('Error fetching camera:', cameraError);

    return NextResponse.json(
      {
        success: false,
        error: `Error fetching camera:', ${cameraError.message}`,
      },
      { status: 500 }
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
    console.log("🚀 ~ POST ~ camera.rtspUrl:", camera.rtspUrl)
    // Start the HLS stream
    const success = await startHlsStream(id, camera.rtspUrl);
    console.log("🚀 ~ POST ~ success:", success)
    
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

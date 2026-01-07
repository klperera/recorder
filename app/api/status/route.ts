/**
 * API Route: GET /api/status
 * 
 * Returns the status of all active FFmpeg processes.
 * Useful for debugging and monitoring.
 */

import { NextResponse } from 'next/server';
import { getAllActiveProcesses } from '@/lib/ffmpeg-manager';
import { ApiResponse, ProcessEntry } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse<ProcessEntry[]>>> {
  try {
    const processes = getAllActiveProcesses();
    
    return NextResponse.json({
      success: true,
      data: processes,
    });
  } catch (error) {
    console.error('[API /status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

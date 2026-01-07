/**
 * Camera Management API Routes
 * POST /api/cameras - Add a new camera
 * DELETE /api/cameras/[id] - Delete a camera
 */

import { NextRequest, NextResponse } from 'next/server';
import { Camera } from '@/lib/types';

// In-memory camera storage (replace with database in production)
let cameras: Camera[] = [];

// Load cameras from localStorage on server (using a file in production)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('cameras');
  if (stored) {
    cameras = JSON.parse(stored);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, rtspUrl } = await request.json();
    
    if (!name || !rtspUrl) {
      return NextResponse.json(
        { success: false, error: 'Name and RTSP URL are required' },
        { status: 400 }
      );
    }
    
    // Generate unique ID
    const id = `camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newCamera: Camera = {
      id,
      name,
      rtspUrl,
    };
    
    cameras.push(newCamera);
    
    // Save to localStorage (in production, save to database)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cameras', JSON.stringify(cameras));
    }
    
    return NextResponse.json({
      success: true,
      data: newCamera,
    });
  } catch (error) {
    console.error('[API POST /cameras] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Camera ID is required' },
        { status: 400 }
      );
    }
    
    cameras = cameras.filter(cam => cam.id !== id);
    
    // Save to localStorage (in production, save to database)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cameras', JSON.stringify(cameras));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Camera deleted successfully',
    });
  } catch (error) {
    console.error('[API DELETE /cameras] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export the cameras array for other API routes to access
export function getCameras(): Camera[] {
  return cameras;
}

export function setCameras(newCameras: Camera[]) {
  cameras = newCameras;
}

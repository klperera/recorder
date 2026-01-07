/**
 * Camera Database API - List all cameras
 * 
 * GET /api/db/cameras - Fetch all cameras from Supabase
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cameras:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cameras', details: error.message },
        { status: 500 }
      );
    }

    // Transform database records to match Camera interface
    const cameras = (data || []).map((record: any) => ({
      id: record.id,
      name: record.name,
      ipAddress: record.ip_address,
      rtspUrl: record.rtsp_url,
      isEnabled: record.is_enabled,
    }));

    return NextResponse.json({ cameras });
  } catch (error: any) {
    console.error('Error in GET /api/db/cameras:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
    const supabase = await createClient();
  try {
    const body = await request.json();
    const { name, ipAddress, rtspUrl, isEnabled } = body;
    console.log("Received POST body:", body);

    if (!name || !ipAddress || !rtspUrl) {
      return NextResponse.json(
        { error: 'Name, IP address, and RTSP URL are required' },
        { status: 400 }
      );
    }

    // Let Supabase generate the UUID automatically
    const { data, error } = await supabase
      .from('cameras')
      .insert([
        {
          name,
          ip_address: ipAddress,
          rtsp_url: rtspUrl,
          is_enabled: isEnabled ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating camera:', error);
      return NextResponse.json(
        { error: 'Failed to create camera', details: error.message },
        { status: 500 }
      );
    }

    // Transform to match Camera interface
    const camera = {
      id: data.id,
      name: data.name,
      ipAddress: data.ip_address,
      rtspUrl: data.rtsp_url,
      isEnabled: data.is_enabled,
    };

    return NextResponse.json({ camera }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/db/cameras:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

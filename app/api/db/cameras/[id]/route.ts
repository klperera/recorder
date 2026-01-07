/**
 * Camera Database API - Single camera operations
 * 
 * DELETE /api/db/cameras/[id] - Delete a camera from Supabase
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
  try {
    const { id } = await params;
    console.log("Deleting camera with ID:", id);

    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting camera:', error);
      return NextResponse.json(
        { error: 'Failed to delete camera', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/db/cameras/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

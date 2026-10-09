import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function POST(req) {
  try {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasServiceKey) {
      console.error('[upload-ticket] Missing env vars:', {
        hasUrl,
        hasServiceKey,
      });
      return NextResponse.json(
        { error: 'Server is missing Supabase env vars.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('ticket');
    const participantId = formData.get('participantId');

    if (!file || !participantId) {
      return NextResponse.json(
        { error: 'Missing file or participantId' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = 'tickets';
    const fileName = `ticket-${participantId}-${Date.now()}.png`;

    console.log('[upload-ticket] Starting upload:', {
      bucket,
      fileName,
      size: buffer.length,
      participantId,
    });

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload-ticket] upload error (full):', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        name: uploadError.name,
        bucket,
        fileName,
      });
      return NextResponse.json(
        { error: uploadError.message || 'Upload failed' },
        { status: 500 }
      );
    }

    console.log('[upload-ticket] Upload success:', uploadData);

    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('[upload-ticket] Public URL:', publicUrl);

    // NOTE: column name is ticket_image_url (not ticket_url)
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('rocket_participants')
      .update({ ticket_image_url: publicUrl })
      .eq('id', Number(participantId))
      .select()
      .single();

    if (updateError) {
      console.error('[upload-ticket] update error (full):', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        participantId,
      });
      return NextResponse.json(
        { error: updateError.message || 'Could not save ticket URL' },
        { status: 500 }
      );
    }

    console.log('[upload-ticket] DB updated:', updateData);

    return NextResponse.json({
      success: true,
      ticket_url: publicUrl,
      participant: updateData,
    });
  } catch (err) {
    console.error('[upload-ticket] unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

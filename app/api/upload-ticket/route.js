import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Adjust these to match your Supabase project.
const BUCKET = process.env.SUPABASE_TICKET_BUCKET || 'tickets';
const TABLE = 'rocket_participants';
const URL_COLUMN = 'ticket_image_url';

function fail(status, error, details) {
  console.error('upload-ticket:', error, details || '');
  return NextResponse.json({ error, details }, { status });
}

export async function POST(request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return fail(
        500,
        'Server is not configured.',
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const formData = await request.formData();
    const file = formData.get('ticket');
    const participantId = formData.get('participantId');

    if (!file || typeof file === 'string') {
      return fail(400, 'Ticket file is missing.');
    }
    if (!participantId) {
      return fail(400, 'Participant ID is missing.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${participantId}.png`;

    // 1) Upload the PNG to Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      return fail(500, 'Storage upload failed.', uploadError.message);
    }

    // 2) Build the public URL
    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);
    const ticketUrl = publicData.publicUrl;

    // 3) Save the URL on the participant row
    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ [URL_COLUMN]: ticketUrl })
      .eq('id', participantId);

    if (updateError) {
      return fail(500, 'Saving the ticket URL failed.', updateError.message);
    }

    return NextResponse.json({ ticket_url: ticketUrl });
  } catch (err) {
    return fail(500, 'Unexpected upload error.', err?.message);
  }
}

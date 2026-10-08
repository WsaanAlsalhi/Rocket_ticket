import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Sharp / Buffer handling needs the Node.js runtime
export const runtime = 'nodejs';

// Admin client using service_role — bypasses RLS (server only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('ticket');
    const participantId = formData.get('participantId');

    // Both file and participantId are required
    if (!file || !participantId) {
      return NextResponse.json(
        { error: 'Missing file or participantId' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `ticket-${participantId}-${Date.now()}.png`;
    const bucket = 'tickets';

    // 1) Upload file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload-ticket] upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2) Get the public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 3) Save the URL in the participants table
    const { error: updateError } = await supabaseAdmin
      .from('rocket_participants')
      .update({ ticket_url: publicUrl })
      .eq('id', participantId);

    if (updateError) {
      console.error('[upload-ticket] update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket_url: publicUrl });
  } catch (err) {
    console.error('[upload-ticket] unexpected:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function generateMissionId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MSN-${rand}`;
}

function generateSeat() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A–F
  const number = Math.floor(Math.random() * 50) + 1;
  return `${letter}${number}`;
}

export async function POST(req) {
  try {
    const { name, country, email } = await req.json();

    if (!name || !name.trim() || !country || !country.trim()) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      );
    }

    const mission_id = generateMissionId();
    const seat = generateSeat();

    const { data, error } = await supabaseAdmin
      .from('rocket_participants')
      .insert([
        {
          name: name.trim(),
          country: country.trim(),
          email: email?.trim() || null,
          mission_id,
          seat,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[register] supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[register] participant created:', {
      id: data.id,
      mission_id: data.mission_id,
      seat: data.seat,
    });

    return NextResponse.json({ success: true, participant: data });
  } catch (err) {
    console.error('[register] unexpected:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

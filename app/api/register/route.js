import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_SUPABASE_URL is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error: "SUPABASE_SERVICE_ROLE_KEY is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const body = await request.json();

    const name = body.name?.trim();
    const country = body.country?.trim();
    const email = body.email?.trim() || null;

    if (!name || !country) {
      return NextResponse.json(
        { error: "Name and country are required." },
        { status: 400 }
      );
    }

    // Get the latest participant
    const { data: lastParticipant, error: lastError } = await supabase
      .from("rocket_participants")
      .select("mission_id, seat")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastError) {
      console.error("Supabase read error:", lastError);

      return NextResponse.json(
        {
          error: "Could not read participant data from Supabase.",
          details: lastError.message,
        },
        { status: 500 }
      );
    }

    let nextNumber = 1;

    if (lastParticipant?.mission_id) {
      const match = lastParticipant.mission_id.match(/\d+/);

      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    const missionId = `RM-${String(nextNumber).padStart(4, "0")}`;
    const seat = `A-${String(nextNumber).padStart(3, "0")}`;

    const { data, error } = await supabase
      .from("rocket_participants")
      .insert([
        {
          name,
          country,
          email,
          mission_id: missionId,
          seat,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        {
          error: "Could not save participant.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: data,
    });
  } catch (error) {
    console.error("Register API error:", error);

    return NextResponse.json(
      {
        error: "Server error.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

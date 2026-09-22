import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const formData = await request.formData();

    const file = formData.get("file");
    const missionId = formData.get("missionId");

    if (!file) {
      return NextResponse.json(
        {
          error: "Ticket file is missing.",
        },
        { status: 400 }
      );
    }

    if (!missionId) {
      return NextResponse.json(
        {
          error: "Mission ID is missing.",
        },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const filePath = `${missionId}.png`;

    const { error: uploadError } = await supabase.storage
      .from("rocket-tickets")
      .upload(filePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);

      return NextResponse.json(
        {
          error: "Could not upload ticket.",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("rocket-tickets")
      .getPublicUrl(filePath);

    const ticketUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("rocket_participants")
      .update({
        ticket_url: ticketUrl,
      })
      .eq("mission_id", missionId);

    if (updateError) {
      console.error("Database update error:", updateError);

      return NextResponse.json(
        {
          error: "Ticket uploaded, but database update failed.",
          details: updateError.message,
          ticketUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticketUrl,
    });
  } catch (error) {
    console.error("Upload ticket API error:", error);

    return NextResponse.json(
      {
        error: "Server error.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

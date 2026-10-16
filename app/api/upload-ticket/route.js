import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("Supabase environment variables are missing.");
    }

    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export async function POST(request) {
    try {
        const formData = await request.formData();

        const file = formData.get("file");
        const missionId = String(formData.get("mission_id") || "").trim();

        if (
            !file ||
            typeof file.arrayBuffer !== "function" ||
            !missionId
        ) {
            return NextResponse.json(
                { error: "Ticket image and mission ID are required." },
                { status: 400 }
            );
        }

        if (file.type !== "image/png") {
            return NextResponse.json(
                { error: "The ticket must be a PNG image." },
                { status: 400 }
            );
        }

        if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "The image must be smaller than 10 MB." },
                { status: 400 }
            );
        }

        if (!/^RM-[A-Z0-9-]+$/i.test(missionId)) {
            return NextResponse.json(
                { error: "Invalid mission ID." },
                { status: 400 }
            );
        }

        const supabase = getSupabase();
        const buffer = Buffer.from(await file.arrayBuffer());

        const filePath = `${missionId.toUpperCase()}.png`;

        const { error: uploadError } = await supabase.storage
            .from("rocket-tickets")
            .upload(filePath, buffer, {
                contentType: "image/png",
                upsert: true,
            });

        if (uploadError) {
            console.error("Ticket upload error:", uploadError);

            return NextResponse.json(
                { error: "Could not upload the ticket image." },
                { status: 500 }
            );
        }

        const { data: publicUrlData } = supabase.storage
            .from("rocket-tickets")
            .getPublicUrl(filePath);

        const ticketImageUrl = publicUrlData.publicUrl;

        const { data: participant, error: updateError } = await supabase
            .from("rocket_participants")
            .update({
                ticket_image_url: ticketImageUrl,
            })
            .eq("mission_id", missionId)
            .select("mission_id, ticket_image_url")
            .single();

        if (updateError) {
            console.error("Ticket URL update error:", updateError);

            return NextResponse.json(
                { error: "Image uploaded, but the participant record could not be updated." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                mission_id: participant.mission_id,
                ticket_image_url: participant.ticket_image_url,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Upload API error:", error);

        return NextResponse.json(
            { error: "Ticket upload failed." },
            { status: 500 }
        );
    }
}

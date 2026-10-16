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
        const body = await request.json();

        const name = String(body.name || "").trim();
        const country = String(body.country || "").trim();

        if (!name || !country) {
            return NextResponse.json(
                { error: "Name and country are required." },
                { status: 400 }
            );
        }

        if (name.length > 50 || country.length > 40) {
            return NextResponse.json(
                { error: "Name or country is too long." },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // Create the participant record first.
        const { data: participant, error: insertError } =
            await supabase
                .from("rocket_participants")
                .insert({
                    name,
                    country,
                })
                .select("id, name, country")
                .single();

        if (insertError) {
            console.error("Participant insert error:", insertError);

            return NextResponse.json(
                { error: "Could not register participant." },
                { status: 500 }
            );
        }

        const number = String(participant.id).padStart(6, "0");
        const seatNumber = String(participant.id).padStart(3, "0");

        const missionId = `RM-${number}`;
        const seat = `R-${seatNumber}`;

        const { data: updated, error: updateError } =
            await supabase
                .from("rocket_participants")
                .update({
                    mission_id: missionId,
                    seat,
                })
                .eq("id", participant.id)
                .select("id, name, country, mission_id, seat")
                .single();

        if (updateError) {
            console.error("Participant update error:", updateError);

            return NextResponse.json(
                { error: "Could not assign mission details." },
                { status: 500 }
            );
        }

        return NextResponse.json(updated, { status: 200 });

    } catch (error) {
        console.error("Registration error:", error);

        return NextResponse.json(
            { error: "Registration failed. Check the server configuration." },
            { status: 500 }
        );
    }
}

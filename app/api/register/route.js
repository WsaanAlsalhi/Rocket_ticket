import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const supabaseUrl =
            process.env.NEXT_PUBLIC_SUPABASE_URL;

        const serviceRoleKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) {
            return NextResponse.json(
                {
                    error:
                        "NEXT_PUBLIC_SUPABASE_URL is missing.",
                },
                { status: 500 }
            );
        }

        if (!serviceRoleKey) {
            return NextResponse.json(
                {
                    error:
                        "SUPABASE_SERVICE_ROLE_KEY is missing.",
                },
                { status: 500 }
            );
        }

        const supabase = createClient(
            supabaseUrl,
            serviceRoleKey
        );

        const body = await request.json();

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const country =
            typeof body.country === "string"
                ? body.country.trim()
                : "";

        const email =
            typeof body.email === "string" &&
            body.email.trim()
                ? body.email.trim()
                : null;

        if (!name || !country) {
            return NextResponse.json(
                {
                    error:
                        "Name and country are required.",
                },
                { status: 400 }
            );
        }

        /*
         * Get the latest participant.
         * We use the database ID to create the next
         * mission number.
         */

        const { data: lastParticipant, error: readError } =
            await supabase
                .from("rocket_participants")
                .select("id")
                .order("id", {
                    ascending: false,
                })
                .limit(1)
                .maybeSingle();

        if (readError) {
            console.error(
                "Supabase read error:",
                readError
            );

            return NextResponse.json(
                {
                    error:
                        "Could not read participant data.",
                    details: readError.message,
                },
                { status: 500 }
            );
        }

        const nextNumber =
            (lastParticipant?.id || 0) + 1;

        const missionId =
            `RM-${String(nextNumber).padStart(4, "0")}`;

        const seat =
            `A-${String(nextNumber).padStart(3, "0")}`;

        /*
         * Save participant.
         */

        const { data, error: insertError } =
            await supabase
                .from("rocket_participants")
                .insert({
                    name,
                    country,
                    email,
                    mission_id: missionId,
                    seat,
                })
                .select()
                .single();

        if (insertError) {
            console.error(
                "Supabase insert error:",
                insertError
            );

            return NextResponse.json(
                {
                    error:
                        "Could not save participant.",
                    details: insertError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            participant: data,
        });
    } catch (error) {
        console.error(
            "Register API error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Registration failed.",
                details:
                    error?.message ||
                    "Unknown server error.",
            },
            { status: 500 }
        );
    }
}

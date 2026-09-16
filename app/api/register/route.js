import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();

        const name = String(body.name || "").trim();
        const country = String(body.country || "").trim();
        const email = String(body.email || "").trim();

        if (!name || !country) {
            return NextResponse.json(
                {
                    error:
                        "Name and country are required.",
                },
                {
                    status: 400,
                }
            );
        }

        // Get the latest participant
        const { data: lastParticipant, error: lastError } =
            await supabase
                .from("rocket_participants")
                .select("mission_id")
                .order("id", {
                    ascending: false,
                })
                .limit(1)
                .maybeSingle();

        if (lastError) {
            console.error(lastError);

            return NextResponse.json(
                {
                    error:
                        "Could not access participant database.",
                },
                {
                    status: 500,
                }
            );
        }

        let nextNumber = 1;

        if (lastParticipant?.mission_id) {
            const match =
                lastParticipant.mission_id.match(
                    /RM-(\d+)/
                );

            if (match) {
                nextNumber =
                    parseInt(match[1], 10) + 1;
            }
        }

        const missionId =
            `RM-${String(nextNumber).padStart(6, "0")}`;

        const seat =
            `R-${String(nextNumber).padStart(3, "0")}`;

        const { data, error } =
            await supabase
                .from("rocket_participants")
                .insert({
                    name,
                    country,
                    email: email || null,
                    mission_id: missionId,
                    seat,
                })
                .select()
                .single();

        if (error) {
            console.error(error);

            return NextResponse.json(
                {
                    error:
                        "Could not register participant.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                id: data.id,
                name: data.name,
                country: data.country,
                email: data.email,
                mission_id: data.mission_id,
                seat: data.seat,
            },
            {
                status: 200,
            }
        );

    } catch (error) {
        console.error(
            "Registration error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Registration failed.",
            },
            {
                status: 500,
            }
        );
    }
}
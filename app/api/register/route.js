import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";


const supabase = createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE_KEY,

    {
        auth: {
            autoRefreshToken: false,

            persistSession: false
        }
    }

);


function generateMissionId(number) {

    return `RM-${String(number).padStart(6, "0")}`;

}


function generateSeat(number) {

    return `R-${String(number).padStart(3, "0")}`;

}


export async function POST(request) {

    try {

        const body =
            await request.json();


        const name =
            String(body.name || "")
                .trim();

        const country =
            String(body.country || "")
                .trim();


        if (!name) {

            return NextResponse.json(

                {
                    error:
                        "Name is required."
                },

                {
                    status: 400
                }

            );

        }


        if (!country) {

            return NextResponse.json(

                {
                    error:
                        "Country is required."
                },

                {
                    status: 400
                }

            );

        }


        if (name.length > 50) {

            return NextResponse.json(

                {
                    error:
                        "Name is too long."
                },

                {
                    status: 400
                }

            );

        }


        /*
            Get latest participant number
        */

        const { count, error: countError } =
            await supabase

                .from("rocket_participants")

                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                );


        if (countError) {

            console.error(countError);

            return NextResponse.json(

                {
                    error:
                        "Could not access database."
                },

                {
                    status: 500
                }

            );

        }


        const participantNumber =
            (count || 0) + 1;


        const missionId =
            generateMissionId(
                participantNumber
            );


        const seat =
            generateSeat(
                participantNumber
            );


        /*
            Save participant
        */

        const { data, error } =
            await supabase

                .from("rocket_participants")

                .insert({

                    name: name,

                    country: country,

                    mission_id: missionId,

                    seat: seat

                })

                .select()

                .single();


        if (error) {

            console.error(error);

            return NextResponse.json(

                {
                    error:
                        "Could not register participant."
                },

                {
                    status: 500
                }

            );

        }


        /*
            Return participant information
        */

        return NextResponse.json({

            success: true,

            id: data.id,

            name: data.name,

            country: data.country,

            mission_id:
                data.mission_id,

            seat:
                data.seat

        });


    } catch (error) {

        console.error(error);


        return NextResponse.json(

            {
                error:
                    "Server error."
            },

            {
                status: 500
            }

        );

    }

}
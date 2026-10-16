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


export async function POST(request) {

    try {

        const body =
            await request.json();


        const name =
            String(
                body.name || ""
            ).trim();


        const country =
            String(
                body.country || ""
            ).trim();


        /* =================================
           VALIDATION
        ================================= */

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


        if (country.length > 40) {

            return NextResponse.json(
                {
                    error:
                        "Country is too long."
                },
                {
                    status: 400
                }
            );

        }


        /* =================================
           INSERT PARTICIPANT
        ================================= */

        const {
            data,
            error
        } = await supabase

            .from(
                "rocket_participants"
            )

            .insert({

                name: name,

                country: country

            })

            .select()

            .single();


        if (error) {

            console.error(
                "Database error:",
                error
            );


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


        /* =================================
           GENERATE MISSION ID
        ================================= */

        const missionId =
            `RM-${String(data.id).padStart(6, "0")}`;


        const seat =
            `R-${String(data.id).padStart(3, "0")}`;


        /* =================================
           UPDATE PARTICIPANT
        ================================= */

        const {
            data: updatedData,
            error: updateError
        } = await supabase

            .from(
                "rocket_participants"
            )

            .update({

                mission_id:
                    missionId,

                seat:
                    seat

            })

            .eq(
                "id",
                data.id
            )

            .select()

            .single();


        if (updateError) {

            console.error(
                "Update error:",
                updateError
            );


            return NextResponse.json(
                {
                    error:
                        "Could not create mission ID."
                },
                {
                    status: 500
                }
            );

        }


        /* =================================
           RETURN DATA
        ================================= */

        return NextResponse.json({

            success: true,

            id:
                updatedData.id,

            name:
                updatedData.name,

            country:
                updatedData.country,

            mission_id:
                updatedData.mission_id,

            seat:
                updatedData.seat

        });


    } catch (error) {

        console.error(
            "Server error:",
            error
        );


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

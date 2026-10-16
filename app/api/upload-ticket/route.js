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

        const formData =
            await request.formData();


        const file =
            formData.get("file");


        const missionId =
            String(
                formData.get(
                    "mission_id"
                ) || ""
            ).trim();


        /* =================================
           VALIDATION
        ================================= */

        if (!file) {

            return NextResponse.json(
                {
                    error:
                        "Ticket image is missing."
                },
                {
                    status: 400
                }
            );

        }


        if (!missionId) {

            return NextResponse.json(
                {
                    error:
                        "Mission ID is missing."
                },
                {
                    status: 400
                }
            );

        }


        /* =================================
           CONVERT FILE
        ================================= */

        const arrayBuffer =
            await file.arrayBuffer();


        const buffer =
            Buffer.from(
                arrayBuffer
            );


        /* =================================
           STORAGE PATH
        ================================= */

        const filePath =
            `${missionId}.png`;


        /* =================================
           UPLOAD
        ================================= */

        const {
            error: uploadError
        } = await supabase

            .storage

            .from(
                "rocket-tickets"
            )

            .upload(

                filePath,

                buffer,

                {
                    contentType:
                        "image/png",

                    upsert:
                        true
                }

            );


        if (uploadError) {

            console.error(
                "Storage error:",
                uploadError
            );


            return NextResponse.json(
                {
                    error:
                        "Could not upload ticket image."
                },
                {
                    status: 500
                }
            );

        }


        /* =================================
           PUBLIC URL
        ================================= */

        const {
            data: publicData
        } = supabase

            .storage

            .from(
                "rocket-tickets"
            )

            .getPublicUrl(
                filePath
            );


        const ticketUrl =
            publicData.publicUrl;


        /* =================================
           SAVE URL IN DATABASE
        ================================= */

        const {
            error: updateError
        } = await supabase

            .from(
                "rocket_participants"
            )

            .update({

                ticket_image_url:
                    ticketUrl

            })

            .eq(
                "mission_id",
                missionId
            );


        if (updateError) {

            console.error(
                "Database URL error:",
                updateError
            );


            return NextResponse.json(
                {
                    error:
                        "Image uploaded but database update failed."
                },
                {
                    status: 500
                }
            );

        }


        /* =================================
           SUCCESS
        ================================= */

        return NextResponse.json({

            success: true,

            ticket_url:
                ticketUrl,

            file:
                filePath

        });


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        return NextResponse.json(
            {
                error:
                    "Upload server error."
            },
            {
                status: 500
            }
        );

    }

}

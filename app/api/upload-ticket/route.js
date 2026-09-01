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
            formData.get("mission_id");


        if (!file || !missionId) {

            return NextResponse.json(

                {
                    error:
                        "Missing file or mission ID."
                },

                {
                    status: 400
                }

            );

        }


        const arrayBuffer =
            await file.arrayBuffer();


        const buffer =
            Buffer.from(arrayBuffer);


        const filePath =
            `${missionId}.png`;


        /*
            Upload image to Storage
        */

        const { error: uploadError } =
            await supabase.storage

                .from("rocket-tickets")

                .upload(

                    filePath,

                    buffer,

                    {
                        contentType:
                            "image/png",

                        upsert: true
                    }

                );


        if (uploadError) {

            console.error(uploadError);

            return NextResponse.json(

                {
                    error:
                        "Could not upload ticket."
                },

                {
                    status: 500
                }

            );

        }


        /*
            Get public URL
        */

        const { data: publicData } =
            supabase.storage

                .from("rocket-tickets")

                .getPublicUrl(
                    filePath
                );


        const ticketUrl =
            publicData.publicUrl;


        /*
            Update participant record
        */

        const { error: updateError } =
            await supabase

                .from("rocket_participants")

                .update({

                    ticket_image_url:
                        ticketUrl

                })

                .eq(
                    "mission_id",
                    missionId
                );


        if (updateError) {

            console.error(updateError);

            return NextResponse.json(

                {
                    error:
                        "Ticket uploaded but database update failed."
                },

                {
                    status: 500
                }

            );

        }


        return NextResponse.json({

            success: true,

            ticket_url:
                ticketUrl

        });


    } catch (error) {

        console.error(error);


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
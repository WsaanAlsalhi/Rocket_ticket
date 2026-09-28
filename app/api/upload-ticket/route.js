import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
    try {
        // -----------------------------------------
        // Environment variables
        // -----------------------------------------

        const supabaseUrl =
            process.env.NEXT_PUBLIC_SUPABASE_URL;

        const supabaseServiceRoleKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY;

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

        // -----------------------------------------
        // Supabase client
        // -----------------------------------------

        const supabase =
            createClient(
                supabaseUrl,
                supabaseServiceRoleKey
            );

        // -----------------------------------------
        // Read FormData
        // -----------------------------------------

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

        // -----------------------------------------
        // Validate
        // -----------------------------------------

        if (
            !file ||
            !missionId
        ) {
            return NextResponse.json(
                {
                    error:
                        "Missing ticket file or mission ID.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // Convert file to Buffer
        // -----------------------------------------

        const buffer =
            Buffer.from(
                await file.arrayBuffer()
            );

        // -----------------------------------------
        // Storage file path
        // -----------------------------------------

        const filePath =
            `${missionId}.png`;

        // -----------------------------------------
        // Upload
        // -----------------------------------------

        const {
            error: uploadError,
        } = await supabase.storage
            .from(
                "rocket-tickets"
            )
            .upload(
                filePath,
                buffer,
                {
                    contentType:
                        "image/png",

                    upsert: true,
                }
            );

        if (uploadError) {
            console.error(
                "Storage upload error:",
                uploadError
            );

            return NextResponse.json(
                {
                    error:
                        "Could not upload ticket.",
                    details:
                        uploadError.message,
                },
                { status: 500 }
            );
        }

        // -----------------------------------------
        // Get public URL
        // -----------------------------------------

        const {
            data:
                publicUrlData,
        } =
            supabase.storage
                .from(
                    "rocket-tickets"
                )
                .getPublicUrl(
                    filePath
                );

        const ticketUrl =
            publicUrlData.publicUrl;

        // -----------------------------------------
        // Update database
        // -----------------------------------------

        const {
            error: updateError,
        } = await supabase
            .from(
                "rocket_participants"
            )
            .update({
                ticket_url:
                    ticketUrl,
            })
            .eq(
                "mission_id",
                missionId
            );

        if (updateError) {
            console.error(
                "Database update error:",
                updateError
            );

            return NextResponse.json(
                {
                    error:
                        "Ticket uploaded, but database update failed.",
                    details:
                        updateError.message,
                    ticketUrl,
                },
                { status: 500 }
            );
        }

        // -----------------------------------------
        // Success
        // -----------------------------------------

        return NextResponse.json({
            success: true,
            ticket_url:
                ticketUrl,
        });

    } catch (error) {
        console.error(
            "Upload ticket API error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to upload ticket.",
                details:
                    error.message,
            },
            { status: 500 }
        );
    }
}

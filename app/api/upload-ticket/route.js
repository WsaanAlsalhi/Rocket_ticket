import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const formData = await request.formData();

        const file = formData.get("file");
        const missionId =
            String(
                formData.get("mission_id") || ""
            ).trim();

        if (!file || !missionId) {
            return NextResponse.json(
                {
                    error: "Missing ticket file or mission ID."
                },
                {
                    status: 400
                }
            );
        }

        const buffer = Buffer.from(
            await file.arrayBuffer()
        );

        const filePath =
            `${missionId}.png`;

        const { error: uploadError } =
            await supabase.storage
                .from("rocket-tickets")
                .upload(
                    filePath,
                    buffer,
                    {
                        contentType: "image/png",
                        upsert: true
                    }
                );

        if (uploadError) {
            console.error(
                "Storage upload error:",
                uploadError
            );

            return NextResponse.json(
                {
                    error: uploadError.message
                },
                {
                    status: 500
                }
            );
        }

        const {
            data: publicUrlData
        } = supabase.storage
            .from("rocket-tickets")
            .getPublicUrl(filePath);

        const ticketUrl =
            publicUrlData.publicUrl;

        // Save ticket URL in database
        const { error: updateError } =
            await supabase
                .from("rocket_participants")
                .update({
                    ticket_url: ticketUrl
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
        }

        return NextResponse.json(
            {
                success: true,
                ticket_url: ticketUrl
            },
            {
                status: 200
            }
        );

    } catch (error) {
        console.error(
            "Upload error:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to upload ticket."
            },
            {
                status: 500
            }
        );
    }
}
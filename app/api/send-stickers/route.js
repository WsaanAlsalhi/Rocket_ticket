import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function POST(request) {
    try {
        // -----------------------------------------
        // Environment variables
        // -----------------------------------------

        const resendApiKey =
            process.env.RESEND_API_KEY;

        const resendFromEmail =
            process.env.RESEND_FROM_EMAIL;

        // -----------------------------------------
        // Check Resend API key
        // -----------------------------------------

        if (!resendApiKey) {
            console.error(
                "RESEND_API_KEY is missing."
            );

            return NextResponse.json(
                {
                    error:
                        "RESEND_API_KEY is missing in Vercel Environment Variables.",
                },
                { status: 500 }
            );
        }

        // -----------------------------------------
        // Check sender
        // -----------------------------------------

        if (!resendFromEmail) {
            console.error(
                "RESEND_FROM_EMAIL is missing."
            );

            return NextResponse.json(
                {
                    error:
                        "RESEND_FROM_EMAIL is missing in Vercel Environment Variables.",
                },
                { status: 500 }
            );
        }

        // -----------------------------------------
        // Create Resend client
        // -----------------------------------------

        const resend =
            new Resend(
                resendApiKey
            );

        // -----------------------------------------
        // Read request
        // -----------------------------------------

        const body =
            await request.json();

        const email =
            body.email?.trim();

        const name =
            body.name?.trim() ||
            "Rocket Mission Participant";

        // -----------------------------------------
        // Email is optional
        // -----------------------------------------

        if (!email) {
            return NextResponse.json({
                success: true,
                message:
                    "No email provided. Nothing was sent.",
            });
        }

        // -----------------------------------------
        // Stickers directory
        // -----------------------------------------

        const stickersDirectory =
            path.join(
                process.cwd(),
                "public",
                "stickers"
            );

        // -----------------------------------------
        // Check directory
        // -----------------------------------------

        if (
            !fs.existsSync(
                stickersDirectory
            )
        ) {
            console.error(
                "Stickers directory does not exist:",
                stickersDirectory
            );

            return NextResponse.json(
                {
                    error:
                        "Stickers directory does not exist.",
                },
                { status: 500 }
            );
        }

        // -----------------------------------------
        // Find sticker images
        // -----------------------------------------

        const files =
            fs.readdirSync(
                stickersDirectory
            )
                .filter(
                    (file) =>
                        /\.(png|jpg|jpeg|webp)$/i.test(
                            file
                        )
                );

        // -----------------------------------------
        // No stickers
        // -----------------------------------------

        if (
            files.length === 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "No sticker images were found in public/stickers.",
                },
                { status: 404 }
            );
        }

        // -----------------------------------------
        // Prepare attachments
        // -----------------------------------------

        const attachments =
            files.map(
                (file) => {
                    const filePath =
                        path.join(
                            stickersDirectory,
                            file
                        );

                    return {
                        filename:
                            file,

                        content:
                            fs.readFileSync(
                                filePath
                            ),
                    };
                }
            );

        // -----------------------------------------
        // Send email
        // -----------------------------------------

        const {
            data,
            error,
        } =
            await resend.emails.send(
                {
                    from:
                        resendFromEmail,

                    to:
                        email,

                    subject:
                        "Rocket Mission — Your Mission Stickers",

                    text:
                        `Hello ${name},

Thank you for joining the Rocket Mission.

Your mission stickers are attached.

Rocket Mission 2026`,

                    attachments,
                }
            );

        // -----------------------------------------
        // Resend error
        // -----------------------------------------

        if (error) {
            console.error(
                "Resend email error:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Could not send email.",
                    details:
                        error.message,
                },
                { status: 500 }
            );
        }

        // -----------------------------------------
        // Success
        // -----------------------------------------

        return NextResponse.json({
            success: true,

            message:
                "Mission stickers sent successfully.",

            emailId:
                data?.id || null,
        });

    } catch (error) {
        console.error(
            "Send stickers API error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to send stickers.",
                details:
                    error.message,
            },
            { status: 500 }
        );
    }
}

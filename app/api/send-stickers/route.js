import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const resendApiKey =
            process.env.RESEND_API_KEY;

        const resendFromEmail =
            process.env.RESEND_FROM_EMAIL;

        if (!resendApiKey) {
            console.error(
                "RESEND_API_KEY is missing."
            );

            return NextResponse.json(
                {
                    error:
                        "RESEND_API_KEY is missing in Vercel.",
                },
                { status: 500 }
            );
        }

        if (!resendFromEmail) {
            console.error(
                "RESEND_FROM_EMAIL is missing."
            );

            return NextResponse.json(
                {
                    error:
                        "RESEND_FROM_EMAIL is missing in Vercel.",
                },
                { status: 500 }
            );
        }

        const body =
            await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim()
                : "";

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const missionId =
            typeof body.mission_id === "string"
                ? body.mission_id.trim()
                : "";

        /*
         * No email = no email sending.
         */

        if (!email) {
            return NextResponse.json({
                success: true,
                sent: false,
                message:
                    "No email was provided.",
            });
        }

        /*
         * Check email format.
         */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return NextResponse.json(
                {
                    error:
                        "Invalid email address.",
                },
                { status: 400 }
            );
        }

        /*
         * Sticker directory.
         */

        const stickersDirectory =
            path.join(
                process.cwd(),
                "public",
                "stickers"
            );

        if (
            !fs.existsSync(
                stickersDirectory
            )
        ) {
            console.error(
                "Sticker directory not found:",
                stickersDirectory
            );

            return NextResponse.json(
                {
                    error:
                        "Sticker directory not found.",
                    path:
                        stickersDirectory,
                },
                { status: 500 }
            );
        }

        /*
         * Find sticker images.
         */

        const files =
            fs.readdirSync(
                stickersDirectory
            ).filter(
                (file) =>
                    /\.(png|jpg|jpeg|webp)$/i.test(
                        file
                    )
            );

        if (files.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "No sticker images found.",
                },
                { status: 404 }
            );
        }

        /*
         * Build Resend attachments.
         */

        const attachments =
            files.map((file) => {
                const filePath =
                    path.join(
                        stickersDirectory,
                        file
                    );

                return {
                    filename: file,

                    content:
                        fs.readFileSync(
                            filePath
                        ),
                };
            });

        /*
         * Create Resend client.
         */

        const resend =
            new Resend(
                resendApiKey
            );

        /*
         * Send email.
         */

        const {
            data,
            error,
        } =
            await resend.emails.send({
                from:
                    resendFromEmail,

                to: [email],

                subject:
                    "Rocket Mission — Your Mission Stickers",

                text:
                    `Hello ${name || "Mission Participant"},

Thank you for joining the Rocket Mission.

Your mission stickers are attached.

Mission ID: ${
                    missionId || "N/A"
                }

See you on the mission!
`,

                attachments,
            });

        if (error) {
            console.error(
                "Resend error:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Resend could not send the email.",
                    details:
                        error.message ||
                        JSON.stringify(
                            error
                        ),
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            sent: true,
            message:
                "Mission stickers sent successfully.",
            emailId:
                data?.id || null,
        });
    } catch (error) {
        console.error(
            "Send stickers error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to send mission stickers.",
                details:
                    error?.message ||
                    "Unknown error.",
            },
            { status: 500 }
        );
    }
}

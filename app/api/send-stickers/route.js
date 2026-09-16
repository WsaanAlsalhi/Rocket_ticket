import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs/promises";
import path from "path";

const resend = new Resend(
    process.env.RESEND_API_KEY
);

export async function POST(request) {
    try {
        const body =
            await request.json();

        const email =
            String(
                body.email || ""
            ).trim();

        const name =
            String(
                body.name || ""
            ).trim();

        const missionId =
            String(
                body.mission_id || ""
            ).trim();

        // Email is optional
        if (!email) {
            return NextResponse.json(
                {
                    success: true,
                    skipped: true,
                },
                {
                    status: 200,
                }
            );
        }

        if (
            !process.env.RESEND_API_KEY
        ) {
            return NextResponse.json(
                {
                    error:
                        "RESEND_API_KEY is not configured.",
                },
                {
                    status: 500,
                }
            );
        }

        if (
            !process.env.RESEND_FROM_EMAIL
        ) {
            return NextResponse.json(
                {
                    error:
                        "RESEND_FROM_EMAIL is not configured.",
                },
                {
                    status: 500,
                }
            );
        }

        const stickersDirectory =
            path.join(
                process.cwd(),
                "public",
                "stickers"
            );

        let files = [];

        try {
            files =
                await fs.readdir(
                    stickersDirectory
                );
        } catch (error) {
            console.error(
                "Stickers directory error:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Sticker files were not found."
                },
                {
                    status: 500,
                }
            );
        }

        const imageFiles =
            files.filter(
                (file) => {
                    const extension =
                        path.extname(
                            file
                        ).toLowerCase();

                    return [
                        ".png",
                        ".jpg",
                        ".jpeg",
                        ".webp",
                    ].includes(
                        extension
                    );
                }
            );

        if (
            imageFiles.length === 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "No sticker images were found."
                },
                {
                    status: 500,
                }
            );
        }

        const attachments = [];

        for (
            const fileName
            of imageFiles
        ) {
            const filePath =
                path.join(
                    stickersDirectory,
                    fileName
                );

            const fileBuffer =
                await fs.readFile(
                    filePath
                );

            attachments.push({
                filename:
                    fileName,
                content:
                    fileBuffer,
            });
        }

        const {
            data,
            error,
        } = await resend.emails.send({
            from:
                process.env
                    .RESEND_FROM_EMAIL,

            to: [email],

            subject:
                "Your Rocket Mission Stickers",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                ">

                    <h1>
                        Rocket Mission
                    </h1>

                    <p>
                        Hello ${escapeHtml(name)},
                    </p>

                    <p>
                        Thank you for joining
                        the Rocket Mission.
                    </p>

                    <p>
                        Your mission ID:
                        <strong>
                            ${escapeHtml(missionId)}
                        </strong>
                    </p>

                    <p>
                        Your Rocket Mission
                        stickers are attached
                        to this email.
                    </p>

                    <p>
                        Have a great mission!
                    </p>

                </div>
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
                        error.message ||
                        "Failed to send email.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                email_id:
                    data?.id || null,
            },
            {
                status: 200,
            }
        );

    } catch (error) {
        console.error(
            "Send stickers error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to send stickers.",
            },
            {
                status: 500,
            }
        );
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
    try {
        const body = await request.json();

        const name =
            String(body.name || "")
                .trim()
                .toUpperCase();

        const missionId =
            String(body.mission_id || "")
                .trim()
                .toUpperCase();

        const seat =
            String(body.seat || "")
                .trim()
                .toUpperCase();

        const country =
            String(body.country || "")
                .trim()
                .toUpperCase();

        if (
            !name ||
            !missionId ||
            !seat ||
            !country
        ) {
            return NextResponse.json(
                {
                    error:
                        "Missing ticket information.",
                },
                {
                    status: 400,
                }
            );
        }

        const templatePath =
            path.join(
                process.cwd(),
                "public",
                "ticket-template.png"
            );

        const template =
            await fs.readFile(templatePath);

        /*
         * Ticket template:
         * 1774 x 887
         */

        const svg = `
        <svg
            width="1774"
            height="887"
            viewBox="0 0 1774 887"
            xmlns="http://www.w3.org/2000/svg"
        >

            <!-- Passenger Name -->

            <text
                x="925"
                y="405"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="38"
                font-weight="600"
                letter-spacing="0.8"
                fill="#111111"
            >
                ${escapeXml(name)}
            </text>

            <!-- Mission ID -->

            <text
                x="625"
                y="535"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="600"
                letter-spacing="0.3"
                fill="#111111"
            >
                ${escapeXml(missionId)}
            </text>

            <!-- Seat -->

            <text
                x="905"
                y="535"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="600"
                letter-spacing="0.3"
                fill="#111111"
            >
                ${escapeXml(seat)}
            </text>

            <!-- Passenger Type -->

            <text
                x="1150"
                y="535"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="600"
                letter-spacing="0.3"
                fill="#111111"
            >
                PATRICK
            </text>

            <!-- Country -->

            <text
                x="610"
                y="665"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="600"
                letter-spacing="0.3"
                fill="#111111"
            >
                ${escapeXml(country)}
            </text>

            <!-- Year -->

            <text
                x="885"
                y="665"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="600"
                letter-spacing="0.3"
                fill="#111111"
            >
                2026
            </text>

            <!-- Status -->

            <text
                x="1170"
                y="665"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18"
                font-weight="600"
                letter-spacing="0.3"
                fill="#111111"
            >
                CLEARED
            </text>

        </svg>
        `;

        const finalImage =
            await sharp(template)
                .composite([
                    {
                        input:
                            Buffer.from(svg),
                        top: 0,
                        left: 0,
                    },
                ])
                .png()
                .toBuffer();

        return new NextResponse(
            finalImage,
            {
                status: 200,
                headers: {
                    "Content-Type":
                        "image/png",

                    "Content-Disposition":
                        `inline; filename="${missionId}.png"`,
                },
            }
        );

    } catch (error) {
        console.error(
            "Ticket generation error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to generate ticket.",
            },
            {
                status: 500,
            }
        );
    }
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
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
            "&apos;"
        );
}
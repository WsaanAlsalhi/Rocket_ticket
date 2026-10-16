import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
    try {
        const body = await request.json();

        const name = String(body.name || "")
            .trim()
            .toUpperCase();

        const missionId = String(body.mission_id || "")
            .trim()
            .toUpperCase();

        const seat = String(body.seat || "")
            .trim()
            .toUpperCase();

        const country = String(body.country || "")
            .trim()
            .toUpperCase();

        if (!name || !missionId || !seat || !country) {
            return NextResponse.json(
                {
                    error: "Missing ticket information."
                },
                {
                    status: 400
                }
            );
        }

        // Original ticket template
        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        const template = await fs.readFile(templatePath);

        /*
         * Original template size:
         * 1774 x 887
         *
         * All text positions below are based on
         * the original ticket design.
         */

        const svg = `
        <svg
            width="1774"
            height="887"
            viewBox="0 0 1774 887"
            xmlns="http://www.w3.org/2000/svg"
        >

            <!-- ================================= -->
            <!-- PASSENGER -->
            <!-- ================================= -->

            <text
                x="925"
                y="365"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="42"
                font-weight="700"
                letter-spacing="1"
                fill="#000000"
            >
                ${escapeXml(name)}
            </text>


            <!-- ================================= -->
            <!-- ROW 1 -->
            <!-- MISSION ID -->
            <!-- SEAT -->
            <!-- TEAM -->
            <!-- ================================= -->

            <text
                x="625"
                y="513"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="20"
                font-weight="700"
                letter-spacing="0.5"
                fill="#000000"
            >
                ${escapeXml(missionId)}
            </text>

            <text
                x="905"
                y="513"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="20"
                font-weight="700"
                letter-spacing="0.5"
                fill="#000000"
            >
                ${escapeXml(seat)}
            </text>

            <text
                x="1150"
                y="513"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="20"
                font-weight="700"
                letter-spacing="0.5"
                fill="#000000"
            >
                PATRICK
            </text>


            <!-- ================================= -->
            <!-- ROW 2 -->
            <!-- DESTINATION -->
            <!-- LAUNCH DATE -->
            <!-- STATUS -->
            <!-- ================================= -->

            <text
                x="610"
                y="643"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="20"
                font-weight="700"
                letter-spacing="0.5"
                fill="#000000"
            >
                ${escapeXml(country)}
            </text>

            <text
                x="885"
                y="643"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="20"
                font-weight="700"
                letter-spacing="0.5"
                fill="#000000"
            >
                2026
            </text>

            <text
                x="1170"
                y="643"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="20"
                font-weight="700"
                letter-spacing="0.5"
                fill="#000000"
            >
                CLEARED
            </text>

        </svg>
        `;

        // Composite the text onto the original PNG template
        const finalImage = await sharp(template)
            .composite([
                {
                    input: Buffer.from(svg),
                    top: 0,
                    left: 0
                }
            ])
            .png()
            .toBuffer();

        return new NextResponse(finalImage, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `inline; filename="${missionId}.png"`
            }
        });

    } catch (error) {
        console.error("Ticket generation error:", error);

        return NextResponse.json(
            {
                error: "Failed to generate ticket."
            },
            {
                status: 500
            }
        );
    }
}


/*
 * Escape special XML characters so user input
 * cannot break the SVG.
 */
function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

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

        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        const template = await fs.readFile(templatePath);

        const svg = `
        <svg
            width="1536"
            height="768"
            viewBox="0 0 1536 768"
            xmlns="http://www.w3.org/2000/svg"
        >

            <!-- PASSENGER NAME -->

            <text
                x="900"
                y="312"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="42"
                font-weight="800"
                letter-spacing="1"
                fill="#000000"
            >
                ${escapeXml(name)}
            </text>


            <!-- MISSION ID -->

            <text
                x="610"
                y="450"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="19"
                font-weight="700"
                fill="#000000"
            >
                ${escapeXml(missionId)}
            </text>


            <!-- SEAT -->

            <text
                x="850"
                y="450"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="19"
                font-weight="700"
                fill="#000000"
            >
                ${escapeXml(seat)}
            </text>


            <!-- TEAM -->

            <text
                x="1080"
                y="450"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="19"
                font-weight="700"
                fill="#000000"
            >
                PATRICK
            </text>


            <!-- DESTINATION -->

            <text
                x="610"
                y="563"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="19"
                font-weight="700"
                fill="#000000"
            >
                ${escapeXml(country)}
            </text>


            <!-- LAUNCH DATE -->

            <text
                x="850"
                y="563"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="19"
                font-weight="700"
                fill="#000000"
            >
                2026
            </text>


            <!-- STATUS -->

            <text
                x="1080"
                y="563"
                text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif"
                font-size="19"
                font-weight="700"
                fill="#000000"
            >
                CLEARED
            </text>

        </svg>
        `;

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

                "Content-Disposition":
                    `inline; filename="${missionId}.png"`
            }
        });

    } catch (error) {

        console.error(
            "Ticket generation error:",
            error
        );

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


function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

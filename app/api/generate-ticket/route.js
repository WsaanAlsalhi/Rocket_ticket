import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function escapeXml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export async function POST(request) {
    try {
        const body = await request.json();

        const name = body.name?.trim();
        const country = body.country?.trim();
        const missionId = body.mission_id?.trim();
        const seat = body.seat?.trim();

        if (!name || !country || !missionId || !seat) {
            return NextResponse.json(
                {
                    error:
                        "Name, country, mission ID and seat are required.",
                },
                { status: 400 }
            );
        }

        // Ticket template
        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        // Embedded font
        const fontPath = path.join(
            process.cwd(),
            "public",
            "fonts",
            "DejaVuSans.ttf"
        );

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json(
                {
                    error: "Ticket template was not found.",
                    details: templatePath,
                },
                { status: 500 }
            );
        }

        if (!fs.existsSync(fontPath)) {
            return NextResponse.json(
                {
                    error: "Font file was not found.",
                    details: fontPath,
                },
                { status: 500 }
            );
        }

        const metadata = await sharp(templatePath).metadata();

        const width = metadata.width || 1774;
        const height = metadata.height || 887;

        // Read the font and embed it directly into the SVG.
        const fontBase64 = fs
            .readFileSync(fontPath)
            .toString("base64");

        const textLayer = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
>

    <style>
        @font-face {
            font-family: "RocketFont";
            src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
            font-weight: normal;
        }

        .ticket-text {
            font-family: "RocketFont";
            fill: #000000;
            font-weight: 600;
        }
    </style>

    <!-- NAME -->
    <text
        x="1035"
        y="405"
        text-anchor="middle"
        class="ticket-text"
        font-size="25"
    >${escapeXml(name)}</text>

    <!-- MISSION ID -->
    <text
        x="625"
        y="535"
        text-anchor="middle"
        class="ticket-text"
        font-size="20"
    >${escapeXml(missionId)}</text>

    <!-- SEAT -->
    <text
        x="905"
        y="535"
        text-anchor="middle"
        class="ticket-text"
        font-size="20"
    >${escapeXml(seat)}</text>

    <!-- PATRICK -->
    <text
        x="1170"
        y="535"
        text-anchor="middle"
        class="ticket-text"
        font-size="20"
    >PATRICK</text>

    <!-- COUNTRY -->
    <text
        x="625"
        y="665"
        text-anchor="middle"
        class="ticket-text"
        font-size="20"
    >${escapeXml(country)}</text>

    <!-- YEAR -->
    <text
        x="885"
        y="665"
        text-anchor="middle"
        class="ticket-text"
        font-size="20"
    >2026</text>

    <!-- STATUS -->
    <text
        x="1170"
        y="665"
        text-anchor="middle"
        class="ticket-text"
        font-size="20"
    >CLEARED</text>

</svg>
`;

        const output = await sharp(templatePath)
            .composite([
                {
                    input: Buffer.from(textLayer),
                    top: 0,
                    left: 0,
                },
            ])
            .png()
            .toBuffer();

        return new NextResponse(output, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition":
                    `inline; filename="${missionId}.png"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Generate ticket error:", error);

        return NextResponse.json(
            {
                error: "Could not generate ticket.",
                details:
                    error?.message || "Unknown error.",
            },
            { status: 500 }
        );
    }
}

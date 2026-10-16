import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export async function POST(request) {
    try {
        const body = await request.json();

        const name = String(body.name || "").trim().toUpperCase();
        const missionId = String(body.mission_id || "").trim().toUpperCase();
        const seat = String(body.seat || "").trim().toUpperCase();
        const country = String(body.country || "").trim().toUpperCase();

        if (!name || !missionId || !seat || !country) {
            return NextResponse.json(
                { error: "Missing ticket information." },
                { status: 400 }
            );
        }

        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        const template = await fs.readFile(templatePath);
        const metadata = await sharp(template).metadata();

        if (!metadata.width || !metadata.height) {
            throw new Error("Could not read ticket template dimensions.");
        }

        // Scale the overlay to the actual template dimensions.
        const width = metadata.width;
        const height = metadata.height;
        const sx = width / 1774;
        const sy = height / 887;

        const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
            viewBox="0 0 1774 887"
        >
            <g
                font-family="Arial, Helvetica, sans-serif"
                fill="#111111"
            >
                <!-- Passenger name -->
                <text
                    x="925"
                    y="365"
                    text-anchor="middle"
                    font-size="34"
                    font-weight="500"
                    letter-spacing="0.5"
                >${escapeXml(name)}</text>

                <!-- Mission ID -->
                <text
                    x="625"
                    y="550"
                    text-anchor="middle"
                    font-size="17"
                    font-weight="500"
                >${escapeXml(missionId)}</text>

                <!-- Seat -->
                <text
                    x="905"
                    y="550"
                    text-anchor="middle"
                    font-size="17"
                    font-weight="500"
                >${escapeXml(seat)}</text>

                <!-- Team -->
                <text
                    x="1150"
                    y="550"
                    text-anchor="middle"
                    font-size="17"
                    font-weight="500"
                >PATRICK</text>

                <!-- Destination -->
                <text
                    x="610"
                    y="680"
                    text-anchor="middle"
                    font-size="17"
                    font-weight="500"
                >${escapeXml(country)}</text>

                <!-- Launch date -->
                <text
                    x="885"
                    y="680"
                    text-anchor="middle"
                    font-size="17"
                    font-weight="500"
                >2026</text>

                <!-- Status -->
                <text
                    x="1170"
                    y="680"
                    text-anchor="middle"
                    font-size="17"
                    font-weight="500"
                >CLEARED</text>
            </g>
        </svg>
        `;

        const finalImage = await sharp(template)
            .composite([
                {
                    input: Buffer.from(svg),
                    top: 0,
                    left: 0,
                },
            ])
            .png()
            .toBuffer();

        return new NextResponse(finalImage, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `inline; filename="${missionId}.png"`,
                "Cache-Control": "no-store",
            },
        });

    } catch (error) {
        console.error("Ticket generation error:", error);

        return NextResponse.json(
            { error: "Failed to generate ticket. Check the template and server logs." },
            { status: 500 }
        );
    }
}

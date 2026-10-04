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
                        "Name, country, mission ID and seat are required."
                },
                { status: 400 }
            );
        }

        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json(
                {
                    error: "Ticket template was not found.",
                    details: templatePath
                },
                { status: 500 }
            );
        }

        const metadata =
            await sharp(templatePath).metadata();

        const width = metadata.width || 1774;
        const height = metadata.height || 887;

        const textLayer = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
>

    <text
        x="1035"
        y="405"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="25"
        font-weight="600"
    >${escapeXml(name)}</text>

    <text
        x="625"
        y="535"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="600"
    >${escapeXml(missionId)}</text>

    <text
        x="905"
        y="535"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="600"
    >${escapeXml(seat)}</text>

    <text
        x="1170"
        y="535"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="600"
    >PATRICK</text>

    <text
        x="625"
        y="665"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="600"
    >${escapeXml(country)}</text>

    <text
        x="885"
        y="665"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="600"
    >2026</text>

    <text
        x="1170"
        y="665"
        text-anchor="middle"
        fill="#000000"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="600"
    >CLEARED</text>

</svg>
`;

        const output =
            await sharp(templatePath)
                .composite([
                    {
                        input: Buffer.from(textLayer),
                        top: 0,
                        left: 0
                    }
                ])
                .png()
                .toBuffer();

        return new NextResponse(output, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition":
                    `inline; filename="${missionId}.png"`,
                "Cache-Control": "no-store"
            }
        });

    } catch (error) {
        console.error(
            "Generate ticket error:",
            error
        );

        return NextResponse.json(
            {
                error: "Could not generate ticket.",
                details:
                    error?.message ||
                    "Unknown error."
            },
            { status: 500 }
        );
    }
}

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

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const country =
            typeof body.country === "string"
                ? body.country.trim()
                : "";

        const missionId =
            typeof body.mission_id === "string"
                ? body.mission_id.trim()
                : "";

        const seat =
            typeof body.seat === "string"
                ? body.seat.trim()
                : "";

        if (
            !name ||
            !country ||
            !missionId ||
            !seat
        ) {
            return NextResponse.json(
                {
                    error:
                        "Name, country, mission ID and seat are required.",
                },
                { status: 400 }
            );
        }

        /*
         * Load ticket template.
         */

        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json(
                {
                    error:
                        "ticket-template.png was not found.",
                    path: templatePath,
                },
                { status: 500 }
            );
        }

        const image = sharp(templatePath);

        const metadata =
            await image.metadata();

        const width =
            metadata.width || 1774;

        const height =
            metadata.height || 887;

        /*
         * Text layer.
         *
         * IMPORTANT:
         * Keep the font simple and use normal weight.
         * The ticket only requires English text/numbers.
         */

        const textLayer = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
>

    <!-- PASSENGER NAME -->

    <text
        x="1035"
        y="405"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="25"
        font-weight="400"
    >${escapeXml(name)}</text>


    <!-- MISSION ID -->

    <text
        x="625"
        y="535"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="20"
        font-weight="400"
    >${escapeXml(missionId)}</text>


    <!-- SEAT -->

    <text
        x="905"
        y="535"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="20"
        font-weight="400"
    >${escapeXml(seat)}</text>


    <!-- TEAM -->

    <text
        x="1170"
        y="535"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="20"
        font-weight="400"
    >PATRICK</text>


    <!-- DESTINATION -->

    <text
        x="625"
        y="665"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="20"
        font-weight="400"
    >${escapeXml(country)}</text>


    <!-- LAUNCH DATE -->

    <text
        x="885"
        y="665"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="20"
        font-weight="400"
    >2026</text>


    <!-- STATUS -->

    <text
        x="1170"
        y="665"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#000000"
        font-family="DejaVu Sans"
        font-size="20"
        font-weight="400"
    >CLEARED</text>

</svg>
`;

        /*
         * Render the text layer onto the template.
         */

        const output =
            await sharp(templatePath)
                .composite([
                    {
                        input:
                            Buffer.from(
                                textLayer
                            ),
                        top: 0,
                        left: 0,
                    },
                ])
                .png()
                .toBuffer();

        return new NextResponse(
            output,
            {
                status: 200,
                headers: {
                    "Content-Type":
                        "image/png",

                    "Content-Disposition":
                        `inline; filename="${missionId}.png"`,

                    "Cache-Control":
                        "no-store, max-age=0",
                },
            }
        );
    } catch (error) {
        console.error(
            "Generate ticket error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not generate ticket.",
                details:
                    error?.message ||
                    "Unknown error.",
            },
            { status: 500 }
        );
    }
}

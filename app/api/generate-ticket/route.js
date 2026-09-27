import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

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

        // Template location
        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

        // Check template exists
        if (!fs.existsSync(templatePath)) {
            return NextResponse.json(
                {
                    error:
                        "Ticket template was not found.",
                    details: templatePath,
                },
                { status: 500 }
            );
        }

        /*
         * Read the template.
         *
         * The SVG text is rendered as a transparent layer
         * on top of the original ticket image.
         */
        const template = sharp(templatePath);

        const metadata = await template.metadata();

        const width = metadata.width || 1774;
        const height = metadata.height || 887;

        /*
         * IMPORTANT:
         * Use text-anchor="start" and explicit font-family.
         * This avoids problems where SVG text is generated
         * but does not appear correctly in Sharp.
         */

        const textLayer = `
        <svg
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
            xmlns="http://www.w3.org/2000/svg"
        >

            <!-- Passenger Name -->
            <text
                x="925"
                y="405"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="38px"
                font-weight="600"
                text-anchor="start"
            >${escapeXml(name)}</text>


            <!-- Mission ID -->
            <text
                x="625"
                y="535"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18px"
                font-weight="600"
                text-anchor="start"
            >${escapeXml(missionId)}</text>


            <!-- Seat -->
            <text
                x="905"
                y="535"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18px"
                font-weight="600"
                text-anchor="start"
            >${escapeXml(seat)}</text>


            <!-- Passenger Type -->
            <text
                x="1150"
                y="535"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18px"
                font-weight="600"
                text-anchor="start"
            >PATRICK</text>


            <!-- Country -->
            <text
                x="610"
                y="665"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18px"
                font-weight="600"
                text-anchor="start"
            >${escapeXml(country)}</text>


            <!-- Year -->
            <text
                x="885"
                y="665"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18px"
                font-weight="600"
                text-anchor="start"
            >2026</text>


            <!-- Status -->
            <text
                x="1170"
                y="665"
                fill="#000000"
                font-family="Arial, Helvetica, sans-serif"
                font-size="18px"
                font-weight="600"
                text-anchor="start"
            >CLEARED</text>

        </svg>
        `;

        /*
         * Composite the transparent SVG text layer
         * over the original ticket template.
         */
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
                "Content-Disposition": `inline; filename="${missionId}.png"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error(
            "Generate ticket error:",
            error
        );

        return NextResponse.json(
            {
                error: "Could not generate ticket.",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

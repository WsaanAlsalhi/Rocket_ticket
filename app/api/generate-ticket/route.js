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

function containsArabic(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(
        String(text)
    );
}

function createText({
    text,
    x,
    y,
    fontSize = 22,
    anchor = "start",
}) {
    const value = escapeXml(text);

    const isArabic = containsArabic(text);

    return `
        <text
            x="${x}"
            y="${y}"
            fill="#000000"
            font-family="DejaVu Sans, Arial, Helvetica, sans-serif"
            font-size="${fontSize}px"
            font-weight="600"
            text-anchor="${anchor}"
            dominant-baseline="alphabetic"
            ${isArabic ? 'direction="rtl" unicode-bidi="plaintext"' : ""}
        >${value}</text>
    `;
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

        // --------------------------------------------------
        // Ticket template
        // --------------------------------------------------

        const templatePath = path.join(
            process.cwd(),
            "public",
            "ticket-template.png"
        );

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

        // --------------------------------------------------
        // Read template dimensions
        // --------------------------------------------------

        const metadata =
            await sharp(templatePath).metadata();

        const width = metadata.width || 1774;
        const height = metadata.height || 887;

        // --------------------------------------------------
        // Text layer
        // --------------------------------------------------
        //
        // Coordinates are based on the actual ticket
        // design you provided.
        //
        // Ticket size:
        // 1774 x 887
        //
        // --------------------------------------------------

        const textLayer = `
        <svg
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
            xmlns="http://www.w3.org/2000/svg"
        >

            <!-- ========================================= -->
            <!-- PASSENGER -->
            <!-- ========================================= -->

            ${createText({
                text: name,
                x: 1035,
                y: 405,
                fontSize: 25,
                anchor: "middle",
            })}


            <!-- ========================================= -->
            <!-- MISSION ID -->
            <!-- ========================================= -->

            ${createText({
                text: missionId,
                x: 625,
                y: 535,
                fontSize: 20,
                anchor: "middle",
            })}


            <!-- ========================================= -->
            <!-- SEAT -->
            <!-- ========================================= -->

            ${createText({
                text: seat,
                x: 905,
                y: 535,
                fontSize: 20,
                anchor: "middle",
            })}


            <!-- ========================================= -->
            <!-- TEAM -->
            <!-- ========================================= -->

            ${createText({
                text: "PATRICK",
                x: 1170,
                y: 535,
                fontSize: 20,
                anchor: "middle",
            })}


            <!-- ========================================= -->
            <!-- DESTINATION -->
            <!-- ========================================= -->

            ${createText({
                text: country,
                x: 625,
                y: 665,
                fontSize: 20,
                anchor: "middle",
            })}


            <!-- ========================================= -->
            <!-- LAUNCH DATE -->
            <!-- ========================================= -->

            ${createText({
                text: "2026",
                x: 885,
                y: 665,
                fontSize: 20,
                anchor: "middle",
            })}


            <!-- ========================================= -->
            <!-- STATUS -->
            <!-- ========================================= -->

            ${createText({
                text: "CLEARED",
                x: 1170,
                y: 665,
                fontSize: 20,
                anchor: "middle",
            })}

        </svg>
        `;

        // --------------------------------------------------
        // Generate final PNG
        // --------------------------------------------------

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

        // --------------------------------------------------
        // Return generated ticket
        // --------------------------------------------------

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
        console.error(
            "Generate ticket error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not generate ticket.",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

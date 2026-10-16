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


        /*
         * Original ticket template.
         */

        const templatePath =
            path.join(
                process.cwd(),
                "public",
                "ticket-template.png"
            );


        const template =
            await fs.readFile(templatePath);


        /*
         * SVG overlay.
         *
         * The coordinates are based on the
         * 1536 x 768 ticket template.
         */

        const svg = `

        <svg
            width="1536"
            height="768"
            xmlns="http://www.w3.org/2000/svg"
        >

            <style>

                .name {
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    font-size: 42px;

                    font-weight: 800;

                    fill: #111111;

                    letter-spacing: 1px;
                }


                .value {
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    font-size: 20px;

                    font-weight: 700;

                    fill: #111111;

                    letter-spacing: 0.5px;
                }

            </style>


            <!-- ==========================
                 PASSENGER NAME
            =========================== -->

            <text
                x="500"
                y="319"
                class="name"
            >
                ${escapeXml(name)}
            </text>


            <!-- ==========================
                 MISSION ID
            =========================== -->

            <text
                x="478"
                y="455"
                class="value"
            >
                ${escapeXml(missionId)}
            </text>


            <!-- ==========================
                 SEAT
            =========================== -->

            <text
                x="742"
                y="455"
                class="value"
            >
                ${escapeXml(seat)}
            </text>


            <!-- ==========================
                 TEAM
            =========================== -->

            <text
                x="958"
                y="455"
                class="value"
            >
                PATRICK
            </text>


            <!-- ==========================
                 DESTINATION
            =========================== -->

            <text
                x="478"
                y="568"
                class="value"
            >
                ${escapeXml(country)}
            </text>


            <!-- ==========================
                 LAUNCH DATE
            =========================== -->

            <text
                x="742"
                y="568"
                class="value"
            >
                2026
            </text>


            <!-- ==========================
                 STATUS
            =========================== -->

            <text
                x="922"
                y="568"
                class="value"
            >
                CLEARED
            </text>

        </svg>

        `;


        /*
         * Composite SVG over the original image.
         */

        const finalImage =
            await sharp(template)

                .composite([
                    {
                        input:
                            Buffer.from(svg),

                        top: 0,

                        left: 0
                    }
                ])

                .png()

                .toBuffer();


        /*
         * Return generated PNG.
         */

        return new NextResponse(
            finalImage,
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "image/png",

                    "Content-Disposition":
                        `inline; filename="${missionId}.png"`
                }
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
                    "Failed to generate ticket."
            },
            {
                status: 500
            }
        );

    }

}


/*
 * Prevent special characters in user
 * input from breaking the SVG.
 */

function escapeXml(value) {

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
            "&apos;"
        );

}

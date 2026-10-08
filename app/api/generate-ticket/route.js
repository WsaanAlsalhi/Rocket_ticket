import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = body.name;
    const country = body.country;
    const missionId = body.mission_id || body.missionId;
    const seat = body.seat;

    if (!name || !missionId || !seat) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const templatePath = path.join(
      process.cwd(),
      'public',
      'ticket-template.png'
    );

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'ticket-template.png not found in /public' },
        { status: 500 }
      );
    }

    const templateBuffer = fs.readFileSync(templatePath);

    // Get actual template dimensions so text scales with it
    const meta = await sharp(templateBuffer).metadata();
    const width = meta.width || 1900;
    const height = meta.height || 1000;

    // Font sizes as a fraction of the image width
    const passengerSize = Math.round(width * 0.018);
    const valueSize = Math.round(width * 0.013);

    // All positions are fractions of image dimensions.
    // Tweak the decimals if the text is slightly off.
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .dark {
            fill: #0a1f44;
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-weight: 700;
          }
        </style>

        <!-- PASSENGER NAME (below the PASSENGER label) -->
        <text x="${Math.round(width * 0.42)}" y="${Math.round(height * 0.43)}"
              font-size="${passengerSize}" class="dark">
          ${escapeXml(name)}
        </text>

        <!-- MISSION ID -->
        <text x="${Math.round(width * 0.42)}" y="${Math.round(height * 0.60)}"
              font-size="${valueSize}" class="dark">
          ${escapeXml(missionId)}
        </text>

        <!-- SEAT -->
        <text x="${Math.round(width * 0.515)}" y="${Math.round(height * 0.60)}"
              font-size="${valueSize}" class="dark">
          ${escapeXml(seat)}
        </text>

        <!-- TEAM -->
        <text x="${Math.round(width * 0.625)}" y="${Math.round(height * 0.60)}"
              font-size="${valueSize}" class="dark">
          TEAM A
        </text>

        <!-- DESTINATION -->
        <text x="${Math.round(width * 0.42)}" y="${Math.round(height * 0.74)}"
              font-size="${valueSize}" class="dark">
          ${escapeXml((country || 'SPACE').toUpperCase())}
        </text>

        <!-- LAUNCH DATE -->
        <text x="${Math.round(width * 0.515)}" y="${Math.round(height * 0.74)}"
              font-size="${valueSize}" class="dark">
          2026
        </text>

        <!-- STATUS -->
        <text x="${Math.round(width * 0.625)}" y="${Math.round(height * 0.74)}"
              font-size="${valueSize}" class="dark">
          CONFIRMED
        </text>
      </svg>
    `;

    const ticketBuffer = await sharp(templateBuffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return new NextResponse(ticketBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[generate-ticket] error:', err);
    return NextResponse.json(
      { error: 'Failed to generate ticket' },
      { status: 500 }
    );
  }
}

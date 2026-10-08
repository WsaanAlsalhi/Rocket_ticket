import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Sharp needs the Node.js runtime (not Edge)
export const runtime = 'nodejs';

// Escape user input before embedding it in SVG
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
    const { name, country, missionId, seat } = await req.json();

    if (!name || !missionId || !seat) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const templatePath = path.join(process.cwd(), 'public', 'ticket-template.png');

    // Make sure the template exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'ticket-template.png not found in /public' },
        { status: 500 }
      );
    }

    const templateBuffer = fs.readFileSync(templatePath);
    const { width, height } = await sharp(templateBuffer).metadata();

    // Adjust x / y coordinates to match your ticket template design
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .label { fill: #7fb3ff; font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 16px; letter-spacing: 2px; }
          .value { fill: #ffffff; font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 30px; font-weight: 700; }
          .small { fill: #cfd8e3; font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 22px; }
        </style>

        <text x="70" y="380" class="label">NAME</text>
        <text x="70" y="420" class="value">${escapeXml(name)}</text>

        <text x="70" y="500" class="label">COUNTRY</text>
        <text x="70" y="540" class="small">${escapeXml(country || '—')}</text>

        <text x="70" y="620" class="label">MISSION ID</text>
        <text x="70" y="660" class="small">${escapeXml(missionId)}</text>

        <text x="70" y="740" class="label">SEAT</text>
        <text x="70" y="780" class="small">${escapeXml(seat)}</text>
      </svg>
    `;

    // Overlay the SVG text on top of the template
    const ticketBuffer = await sharp(templateBuffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    const base64 = ticketBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
    });
  } catch (err) {
    console.error('[generate-ticket] error:', err);
    return NextResponse.json(
      { error: 'Failed to generate ticket' },
      { status: 500 }
    );
  }
}

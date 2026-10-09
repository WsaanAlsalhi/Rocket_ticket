import { NextResponse } from 'next/server';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// ---- Register fonts once at module load ----
const FONT_DIR = path.join(process.cwd(), 'fonts');
const REGULAR_FONT = path.join(FONT_DIR, 'DejaVuSans.ttf');
const BOLD_FONT = path.join(FONT_DIR, 'DejaVuSans-Bold.ttf');

let FONT_NAME = 'sans-serif';

try {
  if (fs.existsSync(REGULAR_FONT)) {
    GlobalFonts.registerFromPath(REGULAR_FONT, 'RocketFont');
    FONT_NAME = 'RocketFont';
    console.log('[generate-ticket] Registered regular font:', REGULAR_FONT);
  } else {
    console.warn('[generate-ticket] Regular font NOT found:', REGULAR_FONT);
  }

  if (fs.existsSync(BOLD_FONT)) {
    GlobalFonts.registerFromPath(BOLD_FONT, 'RocketFontBold');
    console.log('[generate-ticket] Registered bold font:', BOLD_FONT);
  } else {
    console.warn('[generate-ticket] Bold font NOT found:', BOLD_FONT);
  }

  // Log what fonts are available for debugging
  console.log(
    '[generate-ticket] Registered families:',
    GlobalFonts.families.map((f) => f.family)
  );
} catch (e) {
  console.error('[generate-ticket] Font registration error:', e);
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

    // ---- 1) Load template ----
    const templateImg = await loadImage(templatePath);
    const width = templateImg.width;
    const height = templateImg.height;

    // ---- 2) Create canvas & draw template ----
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(templateImg, 0, 0);

    // ---- 3) Text helper ----
    const drawText = (text, xFrac, yFrac, sizeFrac, opts = {}) => {
      const fontSize = Math.round(width * sizeFrac);
      const bold = opts.bold ? 'RocketFontBold, ' : '';
      ctx.font = `${bold}${fontSize}px ${FONT_NAME}, sans-serif`;
      ctx.fillStyle = opts.color || '#0a1f44';
      ctx.textBaseline = 'top';
      ctx.fillText(
        String(text ?? ''),
        Math.round(width * xFrac),
        Math.round(height * yFrac)
      );
    };

    // ---- 4) Draw fields (positions tuned to sit BELOW each label) ----
    // PASSENGER NAME (below "PASSENGER" label)
    drawText(name, 0.42, 0.42, 0.020, { bold: true });

    // MISSION ID
    drawText(missionId, 0.42, 0.585, 0.014, { bold: true });

    // SEAT
    drawText(seat, 0.525, 0.585, 0.014, { bold: true });

    // TEAM
    drawText('TEAM A', 0.635, 0.585, 0.014, { bold: true });

    // DESTINATION
    drawText((country || 'SPACE').toUpperCase(), 0.42, 0.72, 0.014, {
      bold: true,
    });

    // LAUNCH DATE
    drawText('2026', 0.525, 0.72, 0.014, { bold: true });

    // STATUS
    drawText('CONFIRMED', 0.635, 0.72, 0.014, { bold: true });

    // ---- 5) Return PNG ----
    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[generate-ticket] error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate ticket' },
      { status: 500 }
    );
  }
}

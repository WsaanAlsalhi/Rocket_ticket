import { NextResponse } from 'next/server';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// ============================================================
// FONT LOADING — try every possible path until one works
// ============================================================
const CANDIDATE_DIRS = [
  path.join(process.cwd(), 'fonts'),
  path.join(process.cwd(), 'public', 'fonts'),
  '/var/task/fonts',
  '/usr/share/fonts/truetype/dejavu',
  '/usr/share/fonts/dejavu',
];

function findFont(fileName) {
  for (const dir of CANDIDATE_DIRS) {
    const full = path.join(dir, fileName);
    try {
      if (fs.existsSync(full)) {
        const buf = fs.readFileSync(full);
        if (buf.length > 1000) {
          return { path: full, buffer: buf };
        }
      }
    } catch (_) {}
  }
  return null;
}

let FONT_FAMILY = 'sans-serif';
let BOLD_FAMILY = 'sans-serif';
let FONTS_OK = false;

try {
  const regular = findFont('DejaVuSans.ttf');
  const bold = findFont('DejaVuSans-Bold.ttf');

  if (regular) {
    GlobalFonts.register(regular.buffer, 'RocketFont');
    FONT_FAMILY = 'RocketFont';
    FONTS_OK = true;
    console.log(
      `[generate-ticket] ✅ Regular font from ${regular.path} (${regular.buffer.length} bytes)`
    );
  } else {
    console.error('[generate-ticket] ❌ DejaVuSans.ttf NOT FOUND');
  }

  if (bold) {
    GlobalFonts.register(bold.buffer, 'RocketFontBold');
    BOLD_FAMILY = 'RocketFontBold';
    console.log(
      `[generate-ticket] ✅ Bold font from ${bold.path} (${bold.buffer.length} bytes)`
    );
  } else {
    console.warn('[generate-ticket] ⚠️ DejaVuSans-Bold.ttf NOT FOUND, using regular');
    BOLD_FAMILY = FONT_FAMILY;
  }

  console.log(
    '[generate-ticket] Available families:',
    GlobalFonts.families.map((f) => f.family).join(', ')
  );
} catch (e) {
  console.error('[generate-ticket] Font init error:', e);
}

// ============================================================
// ROUTE
// ============================================================
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

    if (!FONTS_OK) {
      console.error('[generate-ticket] Refusing: fonts not loaded');
      return NextResponse.json(
        {
          error:
            'Server fonts not loaded. Check terminal logs. Make sure fonts/DejaVuSans.ttf exists.',
        },
        { status: 500 }
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

    // Load template
    const templateImg = await loadImage(templatePath);
    const width = templateImg.width;
    const height = templateImg.height;

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(templateImg, 0, 0);

    // Text helper
    const drawText = (text, xFrac, yFrac, sizeFrac, opts = {}) => {
      const fontSize = Math.round(width * sizeFrac);
      const family = opts.bold ? BOLD_FAMILY : FONT_FAMILY;
      ctx.font = `${fontSize}px "${family}"`;
      ctx.fillStyle = opts.color || '#0a1f44';
      ctx.textBaseline = 'top';
      ctx.fillText(
        String(text ?? ''),
        Math.round(width * xFrac),
        Math.round(height * yFrac)
      );
    };

    // ---- Draw all fields ----
    // PASSENGER NAME (bigger, right under "PASSENGER" label)
    drawText(name, 0.42, 0.415, 0.020, { bold: true });

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

    // Return PNG
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

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FONT_FAMILY = 'TicketFont';

// Candidate locations, in case the serverless bundle changes the working directory.
const FONT_PATHS = [
  path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf'),
  path.join(process.cwd(), '.next', 'server', 'fonts', 'DejaVuSans.ttf'),
];
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'ticket-template.png');

let fontReady = false;
function ensureFont() {
  if (fontReady) return;
  for (const p of FONT_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const key = GlobalFonts.register(fs.readFileSync(p), FONT_FAMILY);
        if (key) {
          fontReady = true;
          console.log('Font registered from:', p);
          return;
        }
      }
    } catch (e) {
      console.error('Font load error for', p, e);
    }
  }
  console.error('Font could not be loaded. Tried:', FONT_PATHS);
}

const DARK = '#0b1220';
const ACCENT = '#e8445a';

// Positions measured from the 1774 x 887 template, stored as ratios so they
// keep working if the template is exported at a different resolution.
// x, y: left edge and text baseline (ratio of width / height)
// maxW: maximum text width (ratio of width)
// size: starting font size (ratio of height); text shrinks to fit maxW
const FIELDS = [
  { key: 'name',        x: 0.3207, y: 0.4622, maxW: 0.4280, size: 0.0676, color: DARK },
  { key: 'missionId',   x: 0.3061, y: 0.6088, maxW: 0.1380, size: 0.0383, color: DARK },
  { key: 'seat',        x: 0.4825, y: 0.6088, maxW: 0.1054, size: 0.0383, color: DARK },
  { key: 'team',        x: 0.6263, y: 0.6088, maxW: 0.1240, size: 0.0383, color: DARK },
  { key: 'destination', x: 0.2897, y: 0.7599, maxW: 0.1330, size: 0.0361, color: DARK },
  { key: 'launchDate',  x: 0.4600, y: 0.7599, maxW: 0.1065, size: 0.0361, color: DARK },
  { key: 'status',      x: 0.6049, y: 0.7599, maxW: 0.1466, size: 0.0361, color: ACCENT },
];

// Shrinks the font until the text fits within maxW, then draws it.
function drawFitted(ctx, text, x, y, maxW, startSize, color) {
  let size = Math.round(startSize);
  ctx.font = `${size}px ${FONT_FAMILY}`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 1;
    ctx.font = `${size}px ${FONT_FAMILY}`;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 40);
    const country = String(body.country || '').trim().slice(0, 40);

    if (!name || !country) {
      return NextResponse.json(
        { error: 'Name and country are required.' },
        { status: 400 }
      );
    }

    // Defaults for fields that are not sent by the client. Adjust as needed.
    const values = {
      name,
      missionId: String(body.mission_id || body.missionId || ''),
      seat: String(body.seat || ''),
      team: String(body.team || country),
      destination: String(body.destination || 'MARS'),
      launchDate: String(body.launchDate || '2026'),
      status: String(body.status || 'CONFIRMED'),
    };

    ensureFont();

    const template = await loadImage(fs.readFileSync(TEMPLATE_PATH));
    const W = template.width;
    const H = template.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(template, 0, 0);
    ctx.textBaseline = 'alphabetic';

    for (const f of FIELDS) {
      const text = values[f.key].toUpperCase();
      if (!text) continue;
      drawFitted(ctx, text, f.x * W, f.y * H, f.maxW * W, f.size * H, f.color);
    }

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('generate-ticket error:', err);
    return NextResponse.json(
      { error: 'Failed to generate the ticket.' },
      { status: 500 }
    );
  }
}

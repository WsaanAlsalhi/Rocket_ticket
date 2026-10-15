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
  path.join(__dirname, '..', '..', '..', '..', 'fonts', 'DejaVuSans.ttf'),
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

// x and y are ratios of the ticket width/height, maxW is the max text width
// (ratio of width), and size is the starting font size (ratio of height).
const FIELDS = [
  { key: 'name',        x: 0.3207, y: 0.492, maxW: 0.40, size: 0.052 },
  { key: 'missionId',   x: 0.3062, y: 0.626, maxW: 0.14, size: 0.036 },
  { key: 'seat',        x: 0.4810, y: 0.626, maxW: 0.12, size: 0.036 },
  { key: 'team',        x: 0.6248, y: 0.626, maxW: 0.17, size: 0.036 },
  { key: 'destination', x: 0.2895, y: 0.773, maxW: 0.14, size: 0.034 },
  { key: 'launchDate',  x: 0.4588, y: 0.773, maxW: 0.13, size: 0.034 },
  { key: 'status',      x: 0.6036, y: 0.773, maxW: 0.14, size: 0.034 },
];

function drawFitted(ctx, text, x, y, maxW, startSize) {
  let size = Math.round(startSize);
  ctx.font = `${size}px ${FONT_FAMILY}`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 1;
    ctx.font = `${size}px ${FONT_FAMILY}`;
  }
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

    const values = {
      name,
      missionId: String(body.missionId || ''),
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

    // Dark text color so it is visible on the white area of the ticket.
    ctx.fillStyle = '#0b1220';
    ctx.textBaseline = 'alphabetic';

    for (const f of FIELDS) {
      const text = values[f.key].toUpperCase();
      if (!text) continue;
      drawFitted(ctx, text, f.x * W, f.y * H, f.maxW * W, f.size * H);
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

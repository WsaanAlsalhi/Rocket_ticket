import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fontPath = path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf');
const templatePath = path.join(process.cwd(), 'public', 'ticket-template.png');

let fontReady = false;
function ensureFont() {
  if (fontReady) return;
  const ok = GlobalFonts.registerFromPath(fontPath, 'DejaVu');
  if (!ok) console.error('Font failed to register:', fontPath);
  fontReady = true;
}

// x و y نسب من عرض/ارتفاع التذكرة، و maxW أقصى عرض للنص، و size حجم الخط نسبة للارتفاع
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
  let size = startSize;
  ctx.font = `${size}px DejaVu`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 1;
    ctx.font = `${size}px DejaVu`;
  }
  ctx.fillText(text, x, y);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 40);
    const country = String(body.country || '').trim().slice(0, 40);

    if (!name || !country) {
      return NextResponse.json({ error: 'الاسم والدولة مطلوبان' }, { status: 400 });
    }

    // قيم افتراضية، عدّلها حسب ما تريد
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

    const template = await loadImage(fs.readFileSync(templatePath));
    const W = template.width;
    const H = template.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(template, 0, 0);

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
    return NextResponse.json({ error: 'فشل توليد التذكرة' }, { status: 500 });
  }
}

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
  if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'DejaVu');
  }
  fontReady = true;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 40);
    const country = String(body.country || '').trim().slice(0, 40);
    const missionId = String(body.missionId || '').trim();
    const seat = String(body.seat || '').trim();

    if (!name || !country) {
      return NextResponse.json(
        { error: 'الاسم والدولة مطلوبان' },
        { status: 400 }
      );
    }

    ensureFont();

    const template = await loadImage(fs.readFileSync(templatePath));
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(template, 0, 0);

    // عدّل المواضع والأحجام حسب تصميم تذكرتك
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px DejaVu';
    ctx.fillText(name, 120, 260);

    ctx.font = '36px DejaVu';
    ctx.fillText(country, 120, 330);
    ctx.fillText(`Mission: ${missionId}`, 120, 400);
    ctx.fillText(`Seat: ${seat}`, 120, 460);

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('generate-ticket error:', err);
    return NextResponse.json(
      { error: 'Fail' },
      { status: 500 }
    );
  }
}

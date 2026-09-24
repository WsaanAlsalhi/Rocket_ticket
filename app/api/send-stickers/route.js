import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing.");

      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    if (!resendFromEmail) {
      console.error("RESEND_FROM_EMAIL is missing.");

      return NextResponse.json(
        {
          error:
            "RESEND_FROM_EMAIL is missing in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const body = await request.json();

    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json({
        success: true,
        message: "No email provided. Nothing was sent.",
      });
    }

    const stickersDirectory = path.join(
      process.cwd(),
      "public",
      "stickers"
    );

    let files = [];

    if (fs.existsSync(stickersDirectory)) {
      files = fs
        .readdirSync(stickersDirectory)
        .filter((file) =>
          /\.(png|jpg|jpeg|webp)$/i.test(file)
        );
    }

    const attachments = files.map((file) => {
      const filePath = path.join(
        stickersDirectory,
        file
      );

      return {
        filename: file,
        content: fs.readFileSync(filePath),
      };
    });

    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: "Rocket Mission — Your Mission Stickers 🚀",
      text:
        "Thank you for joining the Rocket Mission. Your mission stickers are attached.",
      attachments,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        {
          error: "Could not send email.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stickers sent successfully.",
      emailId: data?.id || null,
    });
  } catch (error) {
    console.error(
      "Send stickers API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to send stickers.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

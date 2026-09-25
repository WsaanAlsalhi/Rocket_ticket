import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    // Read environment variables only when the API is called.
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    // Check Resend API key.
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

    // Check sender email.
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

    // Create Resend client only after the API request starts.
    const resend = new Resend(resendApiKey);

    // Read request body.
    const body = await request.json();

    const email = body.email?.trim();

    // Email is optional.
    if (!email) {
      return NextResponse.json({
        success: true,
        message: "No email provided. Nothing was sent.",
      });
    }

    // Stickers folder:
    // public/stickers/
    const stickersDirectory = path.join(
      process.cwd(),
      "public",
      "stickers"
    );

    // Check if stickers folder exists.
    if (!fs.existsSync(stickersDirectory)) {
      console.error(
        "Stickers directory does not exist:",
        stickersDirectory
      );

      return NextResponse.json(
        {
          error:
            "Stickers directory does not exist.",
        },
        { status: 500 }
      );
    }

    // Find supported image files.
    const files = fs
      .readdirSync(stickersDirectory)
      .filter((file) =>
        /\.(png|jpg|jpeg|webp)$/i.test(file)
      );

    // If no stickers exist.
    if (files.length === 0) {
      return NextResponse.json(
        {
          error:
            "No sticker images were found in public/stickers.",
        },
        { status: 404 }
      );
    }

    // Convert sticker files into Resend attachments.
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

    // Send email.
    const { data, error } =
      await resend.emails.send({
        from: resendFromEmail,
        to: email,
        subject:
          "Rocket Mission — Your Mission Stickers",
        text:
          "Thank you for joining the Rocket Mission. Your mission stickers are attached.",
        attachments,
      });

    // Resend returned an error.
    if (error) {
      console.error(
        "Resend email error:",
        error
      );

      return NextResponse.json(
        {
          error: "Could not send email.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Success.
    return NextResponse.json({
      success: true,
      message: "Mission stickers sent successfully.",
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

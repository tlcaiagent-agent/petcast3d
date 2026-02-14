import { NextResponse } from "next/server";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(request: Request) {
  try {
    const { email, taskId, modelUrl, thumbnailUrl } = await request.json();

    if (!email || !taskId) {
      return NextResponse.json({ error: "Missing email or taskId" }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY — skipping email to", email);
      return NextResponse.json({ sent: false, reason: "no_api_key" });
    }

    const resend = new Resend(RESEND_API_KEY);
    const viewUrl = `${getBaseUrl(request)}/view?id=${taskId}`;

    const { error } = await resend.emails.send({
      from: "PetCast 3D <noreply@petcast3d.com>",
      to: email,
      subject: "Your pet's 3D bust is ready! 🐾",
      html: buildEmailHtml(viewUrl, thumbnailUrl),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ sent: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Notify error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function buildEmailHtml(viewUrl: string, thumbnailUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FFF8F0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:32px;font-weight:bold;color:#E5A000;">🐾 PetCast 3D</span>
    </div>
    <div style="background:#fff;border-radius:16px;padding:32px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="font-size:48px;margin-bottom:16px;">🎉</div>
      <h1 style="font-size:24px;color:#333;margin:0 0 8px;">Your pet's 3D bust is ready!</h1>
      <p style="color:#888;font-size:14px;margin:0 0 24px;">Our AI sculptor has finished working its magic.</p>
      ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="3D Preview" style="width:200px;height:200px;object-fit:cover;border-radius:12px;margin-bottom:24px;" />` : ""}
      <a href="${viewUrl}" style="display:inline-block;background:#E5A000;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:bold;font-size:16px;">
        View Your 3D Model ✨
      </a>
      <p style="color:#aaa;font-size:12px;margin-top:24px;">Or copy this link: ${viewUrl}</p>
    </div>
    <p style="text-align:center;color:#ccc;font-size:11px;margin-top:24px;">
      © 2026 PetCast 3D — Every pet deserves to be immortalized 🐶
    </p>
  </div>
</body>
</html>`;
}

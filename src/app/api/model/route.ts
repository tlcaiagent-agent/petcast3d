import { NextResponse } from "next/server";
import { NodeIO } from "@gltf-transform/core";
import { dedup, quantize, weld } from "@gltf-transform/functions";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const draco3d = require("draco3dgltf");
import sharp from "sharp";

export const maxDuration = 60;
// Need higher memory for big models
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !url.startsWith("https://assets.meshy.ai/")) {
    return NextResponse.json({ error: "Invalid model URL" }, { status: 400 });
  }

  try {
    console.log("Fetching model for compression...");
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch model" }, { status: 502 });
    }

    const originalBuffer = new Uint8Array(await res.arrayBuffer());
    const origMB = (originalBuffer.length / 1024 / 1024).toFixed(1);
    console.log(`Original size: ${origMB}MB`);

    const io = new NodeIO()
      .registerExtensions([KHRDracoMeshCompression])
      .registerDependencies({
        "draco3d.decoder": await draco3d.createDecoderModule(),
        "draco3d.encoder": await draco3d.createEncoderModule(),
      });

    const document = await io.readBinary(originalBuffer);

    // Resize all textures to max 512px — biggest size savings
    const textures = document.getRoot().listTextures();
    for (const texture of textures) {
      const image = texture.getImage();
      if (!image) continue;
      try {
        const resized = await sharp(Buffer.from(image))
          .resize(512, 512, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 75 })
          .toBuffer();
        texture.setImage(new Uint8Array(resized));
        texture.setMimeType("image/jpeg");
      } catch (e) {
        console.log("Texture resize skip:", e);
      }
    }

    await document.transform(weld(), dedup(), quantize());
    document.createExtension(KHRDracoMeshCompression).setRequired(true);

    const compressedBuffer = await io.writeBinary(document);
    const compMB = (compressedBuffer.length / 1024 / 1024).toFixed(1);
    console.log(`Compressed: ${origMB}MB → ${compMB}MB`);

    // Stream the response to avoid Vercel body size limits
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(compressedBuffer);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": String(compressedBuffer.length),
        "Cache-Control": "public, max-age=3600",
        "X-Original-Size": origMB + "MB",
        "X-Compressed-Size": compMB + "MB",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Compression error:", msg);
    // Fallback: redirect to original
    return NextResponse.redirect(url);
  }
}

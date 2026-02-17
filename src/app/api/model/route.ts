import { NextResponse } from "next/server";
import { NodeIO } from "@gltf-transform/core";
import { dedup, quantize, weld } from "@gltf-transform/functions";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const draco3d = require("draco3dgltf");

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !url.startsWith("https://assets.meshy.ai/")) {
    return NextResponse.json({ error: "Invalid model URL" }, { status: 400 });
  }

  try {
    console.log("Fetching model...");
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch model" }, { status: 502 });
    }

    const originalBuffer = new Uint8Array(await res.arrayBuffer());
    console.log(`Original: ${(originalBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    const io = new NodeIO()
      .registerExtensions([KHRDracoMeshCompression])
      .registerDependencies({
        "draco3d.decoder": await draco3d.createDecoderModule(),
        "draco3d.encoder": await draco3d.createEncoderModule(),
      });

    const document = await io.readBinary(originalBuffer);

    // Strip ALL textures and materials — just keep the geometry
    for (const texture of document.getRoot().listTextures()) {
      texture.dispose();
    }
    for (const material of document.getRoot().listMaterials()) {
      material.dispose();
    }

    // Optimize geometry
    await document.transform(weld(), dedup(), quantize());
    document.createExtension(KHRDracoMeshCompression).setRequired(true);

    const compressed = await io.writeBinary(document);
    console.log(`Stripped + compressed: ${(compressed.length / 1024).toFixed(0)}KB`);

    return new Response(compressed, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": String(compressed.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Compression error:", msg);
    return NextResponse.redirect(url);
  }
}

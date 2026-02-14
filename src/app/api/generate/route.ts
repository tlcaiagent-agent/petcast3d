import { NextResponse } from "next/server";

const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_BASE = "https://api.meshy.ai/openapi/v2";

async function pollTask(taskId: string): Promise<{ modelUrl: string | null; error?: string }> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${MESHY_API_KEY}` },
    });
    const data = await res.json();
    if (data.status === "SUCCEEDED") {
      const glb = data.model_urls?.glb || data.model_urls?.obj;
      return { modelUrl: glb || null };
    }
    if (data.status === "FAILED") {
      return { modelUrl: null, error: "3D generation failed" };
    }
  }
  return { modelUrl: null, error: "Timed out waiting for 3D model" };
}

export async function POST(request: Request) {
  try {
    // Demo mode if no API key
    if (!MESHY_API_KEY) {
      await new Promise((r) => setTimeout(r, 2000)); // fake delay
      return NextResponse.json({
        modelUrl: "demo",
        demo: true,
        message: "Demo mode — no Meshy API key configured",
      });
    }

    const formData = await request.formData();
    const images = formData.getAll("images") as File[];
    if (images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Use the first image for Meshy (it accepts one image)
    const image = images[0];
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${image.type};base64,${base64}`;

    // Create task
    const createRes = await fetch(`${MESHY_BASE}/image-to-3d`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: dataUrl,
        enable_pbr: true,
        should_remesh: true,
      }),
    });

    const createData = await createRes.json();
    if (!createData.result) {
      return NextResponse.json({ error: createData.message || "Failed to create task" }, { status: 500 });
    }

    // Poll for completion
    const result = await pollTask(createData.result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Generate error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

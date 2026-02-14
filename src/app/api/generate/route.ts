import { NextResponse } from "next/server";

const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

async function pollTask(taskId: string): Promise<{ modelUrl: string | null; error?: string }> {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${MESHY_API_KEY}` },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Poll error:", res.status, text);
      continue;
    }
    const data = await res.json();
    console.log("Poll status:", data.status, "progress:", data.progress);
    if (data.status === "SUCCEEDED") {
      const glb = data.model_urls?.glb || data.model_urls?.obj;
      return { modelUrl: glb || null };
    }
    if (data.status === "FAILED") {
      return { modelUrl: null, error: data.task_error?.message || "3D generation failed" };
    }
  }
  return { modelUrl: null, error: "Timed out waiting for 3D model" };
}

export async function POST(request: Request) {
  try {
    // Demo mode if no API key
    if (!MESHY_API_KEY) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        modelUrl: "demo",
        demo: true,
        message: "Demo mode — no Meshy API key configured",
      });
    }

    const formData = await request.formData();
    const imageData = formData.get("image") as string | null;
    
    if (!imageData) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // imageData is already a base64 data URL from the client (after crop)
    const createRes = await fetch(`${MESHY_BASE}/image-to-3d`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageData,
        enable_pbr: true,
      }),
    });

    const createData = await createRes.json();
    console.log("Meshy create response:", JSON.stringify(createData));
    
    if (!createRes.ok || !createData.result) {
      return NextResponse.json(
        { error: createData.message || createData.error || "Failed to create 3D task" },
        { status: 500 }
      );
    }

    // Poll for completion
    const result = await pollTask(createData.result);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

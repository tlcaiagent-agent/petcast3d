import { NextResponse } from "next/server";

const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

// POST: Start a new generation task (returns task ID immediately)
export async function POST(request: Request) {
  try {
    if (!MESHY_API_KEY) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({ taskId: "demo", demo: true });
    }

    const formData = await request.formData();
    const imageData = formData.get("image") as string | null;
    const email = formData.get("email") as string | null;

    if (!imageData) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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

    // Return the task ID immediately — client will poll /api/generate?taskId=xxx
    return NextResponse.json({ taskId: createData.result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

// GET: Poll task status (client calls this every few seconds)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    if (taskId === "demo") {
      return NextResponse.json({
        status: "SUCCEEDED",
        modelUrl: "demo",
        demo: true,
        progress: 100,
      });
    }

    if (!MESHY_API_KEY) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const res = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${MESHY_API_KEY}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Poll error:", res.status, text);
      return NextResponse.json({ status: "POLLING", progress: 0, message: "Checking..." });
    }

    const data = await res.json();
    console.log("Poll:", data.status, "progress:", data.progress);

    if (data.status === "SUCCEEDED") {
      const glb = data.model_urls?.glb || data.model_urls?.obj;
      return NextResponse.json({ status: "SUCCEEDED", modelUrl: glb || null, progress: 100 });
    }

    if (data.status === "FAILED") {
      return NextResponse.json({
        status: "FAILED",
        error: data.task_error?.message || "3D generation failed",
      });
    }

    // Still in progress
    return NextResponse.json({
      status: "IN_PROGRESS",
      progress: data.progress || 0,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Poll error:", msg);
    return NextResponse.json({ status: "POLLING", progress: 0, message: "Retrying..." });
  }
}

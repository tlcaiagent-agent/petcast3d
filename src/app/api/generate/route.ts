import { NextResponse } from "next/server";

const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_BASE = "https://api.meshy.ai/openapi/v1";
const MAX_RETRIES = 2;

// In-memory job store (persists for the life of the serverless instance)
// For production, swap with a database
const jobs = new Map<string, {
  email: string;
  imageData: string;
  meshyTaskId: string;
  retries: number;
  status: string;
}>();

async function submitToMeshy(imageData: string): Promise<{ taskId?: string; error?: string }> {
  const createRes = await fetch(`${MESHY_BASE}/image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_url: imageData, enable_pbr: true }),
  });
  const createData = await createRes.json();
  console.log("Meshy create response:", JSON.stringify(createData));
  if (!createRes.ok || !createData.result) {
    return { error: createData.message || createData.error || "Failed to create 3D task" };
  }
  return { taskId: createData.result };
}

// POST: Start a new generation task
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

    // Submit to Meshy
    const result = await submitToMeshy(imageData);
    if (result.error || !result.taskId) {
      return NextResponse.json({ error: result.error || "Failed to create 3D task" }, { status: 500 });
    }

    // Store job with image data so we can retry if Meshy fails
    const jobId = result.taskId;
    jobs.set(jobId, {
      email,
      imageData,
      meshyTaskId: result.taskId,
      retries: 0,
      status: "IN_PROGRESS",
    });

    return NextResponse.json({ taskId: jobId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Generate error:", msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

// GET: Poll task status with auto-retry on failure
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    if (taskId === "demo") {
      return NextResponse.json({ status: "SUCCEEDED", modelUrl: "demo", demo: true, progress: 100 });
    }

    if (!MESHY_API_KEY) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const job = jobs.get(taskId);
    const meshyTaskId = job?.meshyTaskId || taskId;

    const res = await fetch(`${MESHY_BASE}/image-to-3d/${meshyTaskId}`, {
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
      // Auto-retry if we have the stored image data
      if (job && job.retries < MAX_RETRIES) {
        console.log(`Task ${meshyTaskId} failed. Auto-retrying (attempt ${job.retries + 1}/${MAX_RETRIES})...`);
        const retry = await submitToMeshy(job.imageData);
        if (retry.taskId) {
          job.meshyTaskId = retry.taskId;
          job.retries += 1;
          job.status = "RETRYING";
          return NextResponse.json({
            status: "IN_PROGRESS",
            progress: 0,
            message: `Retrying generation (attempt ${job.retries})...`,
          });
        }
      }

      return NextResponse.json({
        status: "FAILED",
        error: data.task_error?.message || "3D generation failed",
      });
    }

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

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface TaskState {
  status: "loading" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED";
  modelUrl?: string;
  progress: number;
  error?: string;
}

function ViewContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");
  const [task, setTask] = useState<TaskState>({ status: "loading", progress: 0 });

  const poll = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/generate?taskId=${taskId}`);
      const data = await res.json();
      if (data.status === "SUCCEEDED") {
        setTask({ status: "SUCCEEDED", modelUrl: data.modelUrl, progress: 100 });
      } else if (data.status === "FAILED") {
        setTask({ status: "FAILED", progress: 0, error: data.error || "Generation failed" });
      } else {
        setTask({ status: "IN_PROGRESS", progress: data.progress || 0 });
      }
    } catch {
      // keep current state on network error
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    poll();
    const interval = setInterval(() => {
      setTask((t) => {
        if (t.status === "SUCCEEDED" || t.status === "FAILED") return t;
        poll();
        return t;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [taskId, poll]);

  if (!taskId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">❓</div>
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Fredoka" }}>No Task ID</h1>
        <p className="text-[var(--color-soft-gray)]">This link seems incomplete.</p>
        <a href="/create" className="inline-block mt-6 text-[var(--color-amber-accent)] font-semibold hover:underline">← Create a new bust</a>
      </div>
    );
  }

  if (task.status === "loading" || task.status === "IN_PROGRESS") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6 animate-bounce">🎨</div>
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Fredoka" }}>
          {task.status === "loading" ? "Loading..." : "Still working on it..."}
        </h1>
        <p className="text-[var(--color-soft-gray)] mb-8">Your pet&apos;s 3D bust is being sculpted. This usually takes 3-5 minutes.</p>
        <div className="w-64 mx-auto">
          <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-amber-accent)] rounded-full transition-all duration-1000" style={{ width: `${Math.max(task.progress, 5)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{task.progress}% complete</p>
        </div>
        <p className="text-xs text-gray-400 mt-6">This page auto-refreshes. You can also close it and come back later.</p>
      </div>
    );
  }

  if (task.status === "FAILED") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">😿</div>
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Fredoka" }}>Something Went Wrong</h1>
        <p className="text-[var(--color-soft-gray)] mb-2">{task.error}</p>
        <a href="/create" className="inline-block mt-6 bg-[var(--color-amber-accent)] text-white font-semibold px-8 py-3 rounded-full hover:bg-[var(--color-amber-dark)]">
          Try Again 🔄
        </a>
      </div>
    );
  }

  // SUCCEEDED
  const handleCheckout = () => {
    if (task.modelUrl) localStorage.setItem("petcast_model", task.modelUrl);
    window.location.href = "/checkout";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: "Fredoka" }}>Your 3D Bust is Ready! 🎉</h1>
      <p className="text-center text-[var(--color-soft-gray)] mb-8">Interact with your pet&apos;s 3D model below</p>

      <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
        <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          {task.modelUrl && task.modelUrl !== "demo" && task.modelUrl.startsWith("http") ? (
            <div className="w-full h-full" dangerouslySetInnerHTML={{
              __html: `<model-viewer src="${task.modelUrl}" auto-rotate camera-controls touch-action="pan-y" style="width:100%;height:100%" exposure="1" shadow-intensity="1" environment-image="neutral" ar></model-viewer>`
            }} />
          ) : (
            <div className="text-center p-8">
              <div className="text-8xl mb-4">🗿</div>
              <p className="font-semibold text-lg" style={{ fontFamily: "Fredoka" }}>Your Pet&apos;s 3D Bust</p>
              <p className="text-sm text-[var(--color-soft-gray)] mt-2">Demo mode — connect Meshy API for real 3D models</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={handleCheckout} className="w-full bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold py-4 rounded-full text-lg transition-all">
        Proceed to Checkout 🛒
      </button>
    </div>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20"><div className="text-4xl animate-bounce">🎨</div><p className="mt-4">Loading...</p></div>}>
      <ViewContent />
    </Suspense>
  );
}

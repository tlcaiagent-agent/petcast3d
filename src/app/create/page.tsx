"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Stage = "upload" | "crop" | "generating" | "preview";

interface PhotoScore {
  score: number;
  rating: string;
  emoji: string;
  tips: string[];
}

const FUN_MESSAGES = [
  "Sculpting your pet... 🎨",
  "Measuring those adorable ears... 📏",
  "Adding the finishing touches... ✨",
  "Buffing to a perfect shine... 💎",
  "Almost there, just fluffing the fur... 🐕",
  "Teaching the clay to sit... 🐾",
  "Polishing the nose... 👃",
];

function analyzeImage(img: HTMLImageElement, file: File): Promise<PhotoScore> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const size = 100; // sample at low res for speed
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    let totalBrightness = 0;
    const brightnesses: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const b = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      totalBrightness += b;
      brightnesses.push(b);
    }
    const avgBrightness = totalBrightness / (size * size);
    const variance = brightnesses.reduce((s, b) => s + (b - avgBrightness) ** 2, 0) / brightnesses.length;
    const contrast = Math.sqrt(variance);

    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSize: file.size,
        brightness: avgBrightness,
        contrast,
        sharpness: 50,
      }),
    })
      .then((r) => r.json())
      .then((score) => resolve(score))
      .catch(() => resolve({ score: 50, rating: "Unknown", emoji: "🤷", tips: ["Could not analyze"] }));
  });
}

// Simple crop component
function CropTool({ imageUrl, onCrop, onCancel }: { imageUrl: string; onCrop: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const maxW = Math.min(600, window.innerWidth - 40);
      const maxH = 500;
      const s = Math.min(maxW / img.width, maxH / img.height, 1);
      setScale(s);
      const cw = Math.round(img.width * s);
      const ch = Math.round(img.height * s);
      setCanvasSize({ w: cw, h: ch });
      // Default crop: centered square
      const side = Math.min(cw, ch) * 0.8;
      setCropRect({ x: (cw - side) / 2, y: (ch - side) / 2, w: side, h: side });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    ctx.drawImage(imgRef.current, 0, 0, canvasSize.w, canvasSize.h);
    // Dim outside crop
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    // Clear crop area
    ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    ctx.drawImage(
      imgRef.current,
      cropRect.x / scale, cropRect.y / scale, cropRect.w / scale, cropRect.h / scale,
      cropRect.x, cropRect.y, cropRect.w, cropRect.h
    );
    // Border
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    // Corner handles
    const hs = 8;
    ctx.fillStyle = "#f59e0b";
    [[cropRect.x, cropRect.y], [cropRect.x + cropRect.w, cropRect.y], [cropRect.x, cropRect.y + cropRect.h], [cropRect.x + cropRect.w, cropRect.y + cropRect.h]].forEach(([cx, cy]) => {
      ctx.fillRect(cx - hs/2, cy - hs/2, hs, hs);
    });
  }, [imgLoaded, cropRect, canvasSize, scale]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setDragging(true);
    setDragStart(pos);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const pos = getPos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    setCropRect((r) => ({
      ...r,
      x: Math.max(0, Math.min(canvasSize.w - r.w, r.x + dx)),
      y: Math.max(0, Math.min(canvasSize.h - r.h, r.y + dy)),
    }));
    setDragStart(pos);
  };

  const handleEnd = () => setDragging(false);

  const handleCropConfirm = () => {
    if (!imgRef.current) return;
    const out = document.createElement("canvas");
    const srcX = cropRect.x / scale;
    const srcY = cropRect.y / scale;
    const srcW = cropRect.w / scale;
    const srcH = cropRect.h / scale;
    // Output at original resolution (capped at 2048)
    const maxOut = 2048;
    const outScale = Math.min(1, maxOut / Math.max(srcW, srcH));
    out.width = Math.round(srcW * outScale);
    out.height = Math.round(srcH * outScale);
    const ctx = out.getContext("2d")!;
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height);
    onCrop(out.toDataURL("image/jpeg", 0.92));
  };

  // Resize handles via buttons
  const adjustSize = (delta: number) => {
    setCropRect((r) => {
      const newW = Math.max(50, Math.min(canvasSize.w, r.w + delta));
      const newH = Math.max(50, Math.min(canvasSize.h, r.h + delta));
      const newX = Math.max(0, Math.min(canvasSize.w - newW, r.x - delta / 2));
      const newY = Math.max(0, Math.min(canvasSize.h - newH, r.y - delta / 2));
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  return (
    <div className="text-center">
      <p className="mb-3 text-sm text-gray-600">Drag to move crop area. Use buttons to resize.</p>
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="mx-auto rounded-lg cursor-move touch-none border border-gray-200"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      <div className="flex justify-center gap-3 mt-4">
        <button onClick={() => adjustSize(-30)} className="px-4 py-2 bg-gray-200 rounded-full font-semibold">➖ Smaller</button>
        <button onClick={() => adjustSize(30)} className="px-4 py-2 bg-gray-200 rounded-full font-semibold">➕ Larger</button>
      </div>
      <div className="flex justify-center gap-3 mt-4">
        <button onClick={onCancel} className="px-6 py-3 border-2 border-gray-300 text-gray-500 rounded-full font-semibold">Cancel</button>
        <button onClick={handleCropConfirm} className="px-6 py-3 bg-[var(--color-amber-accent)] text-white rounded-full font-semibold hover:bg-[var(--color-amber-dark)]">
          Use This Crop ✂️
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [photoScore, setPhotoScore] = useState<PhotoScore | null>(null);
  const [scoring, setScoring] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(FUN_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [reuploadCount, setReuploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setRawFile(file);
    const url = URL.createObjectURL(file);
    setRawPreview(url);
    setCroppedImage(null);
    setPhotoScore(null);
    setError(null);
    setStage("crop");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleCropDone = useCallback(async (dataUrl: string) => {
    setCroppedImage(dataUrl);
    setStage("upload");
    setScoring(true);
    // Score the cropped image
    const img = new Image();
    img.onload = async () => {
      if (rawFile) {
        const score = await analyzeImage(img, rawFile);
        setPhotoScore(score);
      }
      setScoring(false);
    };
    img.src = dataUrl;
  }, [rawFile]);

  const handleGenerate = async () => {
    if (!croppedImage) {
      setError("Please upload and crop a photo first.");
      return;
    }
    if (photoScore && photoScore.score < 30) {
      const confirmed = window.confirm("This photo scored low for 3D generation. Try anyway?");
      if (!confirmed) return;
    }
    setStage("generating");
    setError(null);
    setProgress(0);
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % FUN_MESSAGES.length;
      setLoadingMsg(FUN_MESSAGES[msgIdx]);
    }, 3000);

    try {
      // Step 1: Start the task (fast — returns task ID)
      const formData = new FormData();
      formData.append("image", croppedImage);
      const startRes = await fetch("/api/generate", { method: "POST", body: formData });
      const startData = await startRes.json();

      if (startData.error) {
        clearInterval(msgInterval);
        setError(startData.error);
        setStage("upload");
        return;
      }

      if (startData.demo) {
        clearInterval(msgInterval);
        setModelUrl("demo");
        setStage("preview");
        return;
      }

      const taskId = startData.taskId;

      // Step 2: Poll from the client (no server timeout issue)
      const poll = async (): Promise<boolean> => {
        try {
          const res = await fetch(`/api/generate?taskId=${taskId}`);
          const data = await res.json();
          setProgress(data.progress || 0);

          if (data.status === "SUCCEEDED" && data.modelUrl) {
            setModelUrl(data.modelUrl);
            setStage("preview");
            return true;
          }
          if (data.status === "FAILED") {
            setError(data.error || "3D generation failed. Try a different photo.");
            setStage("upload");
            return true;
          }
          return false; // still in progress
        } catch {
          return false; // network blip, keep polling
        }
      };

      // Poll every 5 seconds for up to 10 minutes
      for (let i = 0; i < 120; i++) {
        const done = await poll();
        if (done) {
          clearInterval(msgInterval);
          return;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }

      // Timed out after 10 min
      clearInterval(msgInterval);
      setError("Generation is taking longer than expected. Please try again with a simpler photo.");
      setStage("upload");
    } catch {
      clearInterval(msgInterval);
      setError("Something went wrong. Please try again.");
      setStage("upload");
    }
  };

  const handleRegenerate = () => {
    if (regenerateCount >= 2) return;
    setRegenerateCount((c) => c + 1);
    handleGenerate();
  };

  const handleReupload = () => {
    if (reuploadCount >= 2) return;
    setReuploadCount((c) => c + 1);
    setRawFile(null);
    setRawPreview(null);
    setCroppedImage(null);
    setPhotoScore(null);
    setModelUrl(null);
    setStage("upload");
  };

  const exhausted = regenerateCount >= 2 && reuploadCount >= 2;

  const handleCheckout = () => {
    if (modelUrl) localStorage.setItem("petcast_model", modelUrl);
    window.location.href = "/checkout";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: "Fredoka" }}>
        Create Your Pet&apos;s 3D Bust
      </h1>
      <p className="text-center text-[var(--color-soft-gray)] mb-10">
        Upload a photo, crop it, and our AI sculptor will work its magic ✨
      </p>

      {/* Crop stage */}
      {stage === "crop" && rawPreview && (
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold text-center mb-4" style={{ fontFamily: "Fredoka" }}>
            ✂️ Crop Your Photo
          </h2>
          <p className="text-center text-sm text-gray-500 mb-4">
            Center your pet&apos;s face in the crop area for the best 3D result
          </p>
          <CropTool
            imageUrl={rawPreview}
            onCrop={handleCropDone}
            onCancel={() => { setStage("upload"); setRawFile(null); setRawPreview(null); }}
          />
        </div>
      )}

      {/* Upload stage */}
      {stage === "upload" && (
        <div>
          <div className="bg-white rounded-2xl p-8 shadow-md mb-6">
            {!croppedImage ? (
              <div
                className="border-2 border-dashed border-amber-300 rounded-xl p-10 text-center cursor-pointer hover:border-[var(--color-amber-accent)] transition-colors"
                onClick={() => document.getElementById("file-input")?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="text-5xl mb-3">📸</div>
                <p className="font-semibold mb-1">Drop a photo here or click to browse</p>
                <p className="text-sm text-[var(--color-soft-gray)]">Upload a clear photo of your pet (front-facing works best)</p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-4">
                  <img src={croppedImage} alt="Cropped pet" className="w-40 h-40 object-cover rounded-xl border-2 border-amber-200" />
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Cropped & Ready!</p>
                    {scoring && <p className="text-sm text-gray-500 animate-pulse">Analyzing photo quality...</p>}
                    {photoScore && (
                      <div className={`rounded-xl p-4 ${photoScore.score >= 60 ? "bg-green-50" : photoScore.score >= 40 ? "bg-yellow-50" : "bg-red-50"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{photoScore.emoji}</span>
                          <span className="font-semibold">{photoScore.rating}</span>
                          <span className="text-sm text-gray-500">({photoScore.score}/100)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${photoScore.score >= 60 ? "bg-green-500" : photoScore.score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${photoScore.score}%` }}
                          />
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {photoScore.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setStage("crop"); }}
                        className="text-sm px-3 py-1.5 border border-amber-300 text-amber-600 rounded-full hover:bg-amber-50"
                      >
                        ✂️ Re-crop
                      </button>
                      <button
                        onClick={() => { setRawFile(null); setRawPreview(null); setCroppedImage(null); setPhotoScore(null); }}
                        className="text-sm px-3 py-1.5 border border-gray-300 text-gray-500 rounded-full hover:bg-gray-50"
                      >
                        📸 Different Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-3" style={{ fontFamily: "Fredoka" }}>📋 Tips for the Best Results</h3>
            <ul className="space-y-2 text-sm text-[var(--color-soft-gray)]">
              <li>✅ Use well-lit photos (natural light is best)</li>
              <li>✅ Show your pet&apos;s face clearly — front or 3/4 view</li>
              <li>✅ Crop tight around your pet&apos;s head/shoulders</li>
              <li>❌ Avoid blurry or dark photos</li>
              <li>❌ Avoid photos with multiple pets</li>
            </ul>
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={!croppedImage}
            className="w-full bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] disabled:opacity-40 text-white font-semibold py-4 rounded-full text-lg transition-all"
          >
            Generate 3D Bust 🎨
          </button>
        </div>
      )}

      {/* Generating stage */}
      {stage === "generating" && (
        <div className="text-center py-20">
          <div className="text-6xl mb-6 animate-bounce">🎨</div>
          <p className="text-xl font-semibold mb-2" style={{ fontFamily: "Fredoka" }}>{loadingMsg}</p>
          <p className="text-sm text-[var(--color-soft-gray)]">This can take 2-5 minutes — hang tight!</p>
          <div className="mt-8 w-64 mx-auto">
            <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-amber-accent)] rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress}% complete</p>
          </div>
        </div>
      )}

      {/* Preview stage */}
      {stage === "preview" && (
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
              {modelUrl && modelUrl.endsWith(".glb") ? (
                <div className="w-full h-full" dangerouslySetInnerHTML={{
                  __html: `<model-viewer src="${modelUrl}" auto-rotate camera-controls touch-action="pan-y" style="width:100%;height:100%" exposure="1" shadow-intensity="1" environment-image="neutral"></model-viewer>`
                }} />
              ) : (
                <div className="text-center p-8">
                  <div className="text-8xl mb-4">🗿</div>
                  <p className="font-semibold text-lg" style={{ fontFamily: "Fredoka" }}>Your Pet&apos;s 3D Bust</p>
                  {modelUrl === "demo" ? (
                    <p className="text-sm text-[var(--color-soft-gray)] mt-2">Demo mode — connect Meshy API for real 3D models</p>
                  ) : (
                    <p className="text-sm text-[var(--color-soft-gray)] mt-2">3D model generated! Rotate • Zoom • Pan</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={handleCheckout} className="w-full bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold py-4 rounded-full text-lg transition-all">
              Love It! Proceed to Checkout 🛒
            </button>

            {!exhausted ? (
              <div className="flex gap-3">
                {regenerateCount < 2 && (
                  <button onClick={handleRegenerate} className="flex-1 border-2 border-[var(--color-amber-accent)] text-[var(--color-amber-accent)] font-semibold py-3 rounded-full hover:bg-amber-50 transition-colors">
                    🔄 Regenerate ({2 - regenerateCount} left)
                  </button>
                )}
                {reuploadCount < 2 && (
                  <button onClick={handleReupload} className="flex-1 border-2 border-[var(--color-soft-gray)] text-[var(--color-soft-gray)] font-semibold py-3 rounded-full hover:bg-gray-50 transition-colors">
                    📸 New Photos ({2 - reuploadCount} left)
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center bg-amber-50 rounded-2xl p-6">
                <p className="font-semibold mb-2" style={{ fontFamily: "Fredoka" }}>Not quite right? Our artists can help! 🎨</p>
                <p className="text-sm text-[var(--color-soft-gray)] mb-4">A human sculptor will review your photos and work with you directly.</p>
                <a href="/contact" className="inline-block bg-[var(--color-charcoal)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                  Contact Our Team
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* model-viewer script */}
      <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js" />
    </div>
  );
}

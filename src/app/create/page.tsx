"use client";

import { useState, useCallback } from "react";

type Stage = "upload" | "generating" | "preview";

const FUN_MESSAGES = [
  "Sculpting your pet... 🎨",
  "Measuring those adorable ears... 📏",
  "Adding the finishing touches... ✨",
  "Buffing to a perfect shine... 💎",
  "Almost there, just fluffing the fur... 🐕",
];

export default function CreatePage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(FUN_MESSAGES[0]);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [reuploadCount, setReuploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, 5);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
    setError(null);
  }, []);

  const handleGenerate = async () => {
    if (files.length < 1) {
      setError("Please upload at least one photo of your pet.");
      return;
    }
    setStage("generating");
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % FUN_MESSAGES.length;
      setLoadingMsg(FUN_MESSAGES[msgIdx]);
    }, 2500);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      clearInterval(interval);
      if (data.modelUrl) {
        setModelUrl(data.modelUrl);
        setStage("preview");
      } else {
        setError(data.error || "Generation failed. Please try again.");
        setStage("upload");
      }
    } catch {
      clearInterval(interval);
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
    setFiles([]);
    setPreviews([]);
    setModelUrl(null);
    setStage("upload");
  };

  const exhausted = regenerateCount >= 2 && reuploadCount >= 2;

  const handleCheckout = () => {
    if (modelUrl) {
      localStorage.setItem("petcast_model", modelUrl);
    }
    window.location.href = "/checkout";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: "Fredoka" }}>
        Create Your Pet&apos;s 3D Bust
      </h1>
      <p className="text-center text-[var(--color-soft-gray)] mb-10">
        Upload photos, and our AI sculptor will work its magic ✨
      </p>

      {/* Upload stage */}
      {stage === "upload" && (
        <div>
          <div className="bg-white rounded-2xl p-8 shadow-md mb-6">
            <div
              className="border-2 border-dashed border-amber-300 rounded-xl p-10 text-center cursor-pointer hover:border-[var(--color-amber-accent)] transition-colors"
              onClick={() => document.getElementById("file-input")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <div className="text-5xl mb-3">📸</div>
              <p className="font-semibold mb-1">Drop photos here or click to browse</p>
              <p className="text-sm text-[var(--color-soft-gray)]">Upload 1-5 photos of your pet (different angles work best)</p>
              <input id="file-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>

            {previews.length > 0 && (
              <div className="mt-6 grid grid-cols-5 gap-3">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt={`Pet photo ${i+1}`} className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-3" style={{ fontFamily: "Fredoka" }}>📋 Tips for the Best Results</h3>
            <ul className="space-y-2 text-sm text-[var(--color-soft-gray)]">
              <li>✅ Use well-lit photos (natural light is best)</li>
              <li>✅ Show your pet&apos;s face from multiple angles</li>
              <li>✅ Include front, side, and 3/4 views</li>
              <li>❌ Avoid blurry or dark photos</li>
              <li>❌ Avoid photos with multiple pets</li>
            </ul>
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={files.length === 0}
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
          <p className="text-sm text-[var(--color-soft-gray)]">This usually takes about 30 seconds...</p>
          <div className="mt-8 w-64 mx-auto h-2 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-amber-accent)] rounded-full animate-pulse" style={{ width: "70%" }} />
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
                  <p className="text-sm text-[var(--color-soft-gray)] mt-2">Demo mode — connect Meshy API key for real 3D models</p>
                  <p className="text-xs text-[var(--color-soft-gray)] mt-1">Rotate • Zoom • Pan</p>
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

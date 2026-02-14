"use client";

import { useState } from "react";

const SIZES = [
  { id: "small", name: "Petite Paw", size: '3" tall', price: 49, emoji: "🐾" },
  { id: "medium", name: "Classic Companion", size: '5" tall', price: 79, emoji: "⭐" },
  { id: "large", name: "Majestic Mutt", size: '8" tall', price: 129, emoji: "👑" },
];

const MATERIALS = [
  { id: "pla", name: "PLA Standard", extra: 0 },
  { id: "resin", name: "Resin Premium", extra: 20 },
];

const COLORS = ["White", "Black", "Gold", "Bronze", "Natural"];

export default function CheckoutPage() {
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedMaterial, setSelectedMaterial] = useState("pla");
  const [selectedColor, setSelectedColor] = useState("White");
  const [ordered, setOrdered] = useState(false);
  const [orderNumber] = useState(() => `PC-${Date.now().toString(36).toUpperCase()}`);

  const size = SIZES.find((s) => s.id === selectedSize)!;
  const material = MATERIALS.find((m) => m.id === selectedMaterial)!;
  const total = size.price + material.extra;

  if (ordered) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Fredoka" }}>Order Confirmed!</h1>
        <p className="text-lg text-[var(--color-soft-gray)] mb-2">Your pet&apos;s bust is being prepared.</p>
        <p className="text-sm text-[var(--color-soft-gray)] mb-8">Order number: <span className="font-mono font-bold">{orderNumber}</span></p>
        <div className="bg-white rounded-2xl p-6 shadow-md inline-block">
          <p className="font-semibold">{size.name} • {material.name} • {selectedColor}</p>
          <p className="text-2xl font-bold mt-2">${total}</p>
        </div>
        <div className="mt-8">
          <a href="/" className="text-[var(--color-amber-accent)] font-semibold hover:underline">← Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10" style={{ fontFamily: "Fredoka" }}>Checkout 🛒</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Size */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: "Fredoka" }}>Size</h2>
            <div className="grid grid-cols-3 gap-3">
              {SIZES.map((s) => (
                <button key={s.id} onClick={() => setSelectedSize(s.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${selectedSize === s.id ? "border-[var(--color-amber-accent)] bg-amber-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-[var(--color-soft-gray)]">{s.size}</div>
                  <div className="font-bold mt-1">${s.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Material */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: "Fredoka" }}>Material</h2>
            <div className="flex gap-3">
              {MATERIALS.map((m) => (
                <button key={m.id} onClick={() => setSelectedMaterial(m.id)}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${selectedMaterial === m.id ? "border-[var(--color-amber-accent)] bg-amber-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-sm text-[var(--color-soft-gray)]">{m.extra ? `+$${m.extra}` : "Included"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: "Fredoka" }}>Color</h2>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setSelectedColor(c)}
                  className={`px-5 py-2 rounded-full border-2 font-medium text-sm transition-all ${selectedColor === c ? "border-[var(--color-amber-accent)] bg-amber-50" : "border-gray-200 hover:border-gray-300"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: "Fredoka" }}>Shipping Address</h2>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First Name" className="col-span-1 border rounded-lg px-4 py-3 text-sm" />
              <input placeholder="Last Name" className="col-span-1 border rounded-lg px-4 py-3 text-sm" />
              <input placeholder="Address" className="col-span-2 border rounded-lg px-4 py-3 text-sm" />
              <input placeholder="City" className="border rounded-lg px-4 py-3 text-sm" />
              <input placeholder="State" className="border rounded-lg px-4 py-3 text-sm" />
              <input placeholder="ZIP Code" className="border rounded-lg px-4 py-3 text-sm" />
              <input placeholder="Country" className="border rounded-lg px-4 py-3 text-sm" defaultValue="United States" />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-md sticky top-20">
            <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: "Fredoka" }}>Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>{size.name} ({size.size})</span><span>${size.price}</span></div>
              <div className="flex justify-between"><span>{material.name}</span><span>{material.extra ? `+$${material.extra}` : "—"}</span></div>
              <div className="flex justify-between"><span>Color: {selectedColor}</span><span></span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-green-600 font-medium">Free</span></div>
              <hr />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${total}</span></div>
            </div>
            <button onClick={() => setOrdered(true)}
              className="w-full mt-6 bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold py-4 rounded-full text-lg transition-all">
              Place Order 🎉
            </button>
            <p className="text-xs text-center text-[var(--color-soft-gray)] mt-3">Stripe checkout coming soon — demo mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}

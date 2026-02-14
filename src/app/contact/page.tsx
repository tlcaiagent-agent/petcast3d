"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">💌</div>
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Fredoka" }}>Message Sent!</h1>
        <p className="text-[var(--color-soft-gray)] mb-8">A human sculptor will review your request and get back to you within 24 hours.</p>
        <a href="/" className="text-[var(--color-amber-accent)] font-semibold hover:underline">← Back to Home</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: "Fredoka" }}>Need Help? 🤝</h1>
      <p className="text-center text-[var(--color-soft-gray)] mb-10">
        Our team of human sculptors is here to help create the perfect bust of your pet.
      </p>

      <div className="bg-white rounded-2xl p-8 shadow-md">
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input required placeholder="Your name" className="w-full border rounded-lg px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required type="email" placeholder="you@example.com" className="w-full border rounded-lg px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">What can we help with?</label>
            <textarea required rows={4} placeholder="Describe what you need — e.g., the AI model didn't capture my pet's markings correctly..." className="w-full border rounded-lg px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attach Photos (optional)</label>
            <input type="file" accept="image/*" multiple className="w-full text-sm" />
          </div>
          <button type="submit" className="w-full bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold py-4 rounded-full text-lg transition-all">
            Send Message 💌
          </button>
        </form>
      </div>
    </div>
  );
}

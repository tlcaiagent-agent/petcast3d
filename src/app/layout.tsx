import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetCast 3D — Turn Your Pet Into a Masterpiece",
  description: "Upload photos of your pet and get an AI-generated 3D bust sculpture, then order a physical print delivered to your door.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
      </head>
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 bg-[var(--color-cream)]/90 backdrop-blur border-b border-[var(--color-warm)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-[var(--font-heading)] text-2xl font-bold text-[var(--color-amber-accent)]" style={{fontFamily:'Fredoka'}}>
              🐾 PetCast 3D
            </a>
            <div className="flex gap-6 text-sm font-medium">
              <a href="/create" className="hover:text-[var(--color-amber-accent)] transition-colors">Create</a>
              <a href="/contact" className="hover:text-[var(--color-amber-accent)] transition-colors">Help</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-[var(--color-warm)] py-8 text-center text-sm text-[var(--color-soft-gray)]">
          © 2026 PetCast 3D — Every pet deserves to be immortalized 🐶
        </footer>
      </body>
    </html>
  );
}

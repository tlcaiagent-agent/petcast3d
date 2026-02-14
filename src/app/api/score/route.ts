import { NextResponse } from "next/server";

// Client-side scoring criteria hints (no AI needed — heuristic based on image properties)
// The actual scoring logic runs client-side via canvas analysis, but this endpoint
// can be used for server-side validation if needed.

export async function POST(request: Request) {
  try {
    const { width, height, fileSize, brightness, contrast, sharpness } = await request.json();

    let score = 50; // base score
    const tips: string[] = [];

    // Resolution check
    if (width >= 1024 && height >= 1024) {
      score += 15;
    } else if (width >= 512 && height >= 512) {
      score += 8;
    } else {
      score -= 10;
      tips.push("Use a higher resolution photo (at least 1024x1024)");
    }

    // Aspect ratio — close to square is best for 3D
    const ratio = Math.max(width, height) / Math.min(width, height);
    if (ratio <= 1.3) {
      score += 10;
    } else if (ratio <= 1.8) {
      score += 5;
    } else {
      score -= 5;
      tips.push("Crop to a more square aspect ratio for best results");
    }

    // File size (proxy for detail/compression)
    if (fileSize > 500000) {
      score += 10;
    } else if (fileSize > 100000) {
      score += 5;
    } else {
      tips.push("Photo may be too compressed — use a higher quality image");
    }

    // Brightness (0-255 scale)
    if (brightness >= 80 && brightness <= 200) {
      score += 10;
    } else if (brightness < 80) {
      score -= 10;
      tips.push("Photo is too dark — try better lighting");
    } else {
      score -= 5;
      tips.push("Photo may be overexposed — try softer lighting");
    }

    // Contrast
    if (contrast >= 40 && contrast <= 120) {
      score += 5;
    } else if (contrast < 40) {
      tips.push("Photo has low contrast — make sure pet stands out from background");
    }

    // Clamp score
    score = Math.max(10, Math.min(100, score));

    let rating: string;
    let emoji: string;
    if (score >= 80) {
      rating = "Excellent";
      emoji = "🌟";
    } else if (score >= 60) {
      rating = "Good";
      emoji = "👍";
    } else if (score >= 40) {
      rating = "Fair";
      emoji = "😐";
    } else {
      rating = "Poor";
      emoji = "😬";
    }

    if (tips.length === 0) {
      tips.push("Great photo! This should work well for 3D generation.");
    }

    return NextResponse.json({ score, rating, emoji, tips });
  } catch {
    return NextResponse.json({ score: 50, rating: "Unknown", emoji: "🤷", tips: ["Could not analyze photo"] });
  }
}

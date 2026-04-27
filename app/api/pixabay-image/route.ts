import { NextRequest, NextResponse } from "next/server";

// app/api/pixabay-image/route.ts
// Proxy Pixabay image supaya bisa di-load di canvas (bypass CORS)
// Usage: /api/pixabay-image?url=https://cdn.pixabay.com/...

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (!url.includes("pixabay.com")) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = process.env.NEXT_PUBLIC_PIXALAB_API_KEY;
  const baseUrl =
    process.env.NEXT_PUBLIC_PIXALAB_API_URL || "https://pixabay.com/api/";
  if (!apiKey || !baseUrl)
    return NextResponse.json({ error: "Missing API config" }, { status: 500 });
  if (!apiKey)
    return NextResponse.json({ error: "No API key" }, { status: 500 });

  const params = new URLSearchParams(searchParams);
  params.set("key", apiKey);

  // Defaults only if not provided
  if (!params.has("safesearch")) params.set("safesearch", "true");

  const url = `${baseUrl}?${params.toString()}`;
  const res = await fetch(url);
  const data = await res.json();

  return NextResponse.json(data);
}

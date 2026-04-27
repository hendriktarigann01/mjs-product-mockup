import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "No API key" }, { status: 500 });

    // Forward ke remove.bg
    const rbFormData = new FormData();
    rbFormData.append("image_file", file);
    rbFormData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: rbFormData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("remove.bg error:", err);
      return NextResponse.json(
        { error: "remove.bg failed" },
        { status: response.status },
      );
    }

    // Return PNG langsung sebagai base64
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ result: dataUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

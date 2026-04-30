// Tujuan      : Server-side proxy untuk Binderbyte API /v1/cost agar request tidak diblokir CORS
// Caller      : components/checkouts/ShippingMethod.tsx (fetchOngkir)
// Dependensi  : BINDERBYTE_API_KEY, BINDERBYTE_API_URL (dari env server, bukan NEXT_PUBLIC)
// Main Exports: POST /api/ongkir
// Side Effects: HTTP call ke api.binderbyte.com

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body_json = await req.json();
    const { origin, destination, weight, courier } = body_json;

    const apiKey = process.env.BINDERBYTE_API_KEY ?? "";
    const apiUrl = (process.env.BINDERBYTE_API_URL ?? "https://api.binderbyte.com/").replace(/\/?$/, "/");
    const fullUrl = `${apiUrl}v1/cost`;

    // Pakai URLSearchParams — lebih reliable di Node.js server-side
    const params = new URLSearchParams();
    params.append("api_key", apiKey);
    params.append("origin", origin ?? process.env.ORIGIN_DISTRICT_ID ?? "");
    params.append("destination", destination);
    params.append("weight", String(weight ?? 1));
    params.append("courier", courier ?? "lion");

    console.log("[/api/ongkir] →", fullUrl);
    console.log("[/api/ongkir] params:", params.toString().replace(apiKey, "***"));

    const res = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    console.log("[/api/ongkir] status:", res.status);

    const rawText = await res.text();
    console.log("[/api/ongkir] raw:", rawText.slice(0, 500));

    if (!rawText) {
      return NextResponse.json(
        { code: "500", message: "Binderbyte returned empty response" },
        { status: 500 }
      );
    }

    const json = JSON.parse(rawText);
    return NextResponse.json(json, { status: res.ok ? 200 : res.status });
  } catch (err: any) {
    console.error("[/api/ongkir] ERROR:", err?.message ?? err);
    return NextResponse.json({ code: "500", message: err?.message ?? "Proxy error" }, { status: 500 });
  }
}

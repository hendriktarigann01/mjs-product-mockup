// Tujuan      : Kalkulasi & pilih metode pengiriman via Binderbyte API
// Caller      : ShippingSection.tsx → CheckoutPage (app/checkouts/page.tsx)
// Dependensi  : Binderbyte API (NEXT_PUBLIC_BINDERBYTE_API_URL / API_KEY)
// Main Exports: ShippingMethod (default), ShippingService (interface)
// Side Effects: HTTP POST ke Binderbyte /v1/cost saat tombol "Cek Ongkir" ditekan
"use client";

import { useState, useCallback } from "react";
import { Loader2, MapPin } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ShippingService {
  courierCode: string;
  courierName: string;
  service: string;
  type: string;
  price: number;
  estimated: string;
  name: string;
}

interface ApiCostResult {
  code: string;
  name: string;
  costs: {
    code: string;
    name: string;
    service: string;
    type: string;
    price: string;
    estimated: string;
  }[];
}

interface Props {
  /** ID kecamatan tujuan, e.g. "32.16.08" — tanpa prefix "dist_" */
  kecamatanId: string;
  kecamatanName: string;
  kabupatenName: string;
  selected: ShippingService | null;
  onSelect: (service: ShippingService) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COURIERS = [
  "jne",
  "pos",
  "tiki",
  "sicepat",
  "anteraja",
  "lion",
  "ninja",
  "sap",
  "ide",
  "jnt",
  "wahana",
];

const ORIGIN_DISTRICT_ID =
  process.env.NEXT_PUBLIC_ORIGIN_DISTRICT_ID ?? "";

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")},00`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShippingMethod({
  kecamatanId,
  kecamatanName,
  kabupatenName,
  selected,
  onSelect,
}: Props) {
  const [options, setOptions] = useState<ShippingService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard: store which kecamatanId was last successfully fetched
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const alreadyFetched = fetchedFor === kecamatanId && kecamatanId !== "";

  const fetchOngkir = useCallback(async () => {
    if (!kecamatanId || alreadyFetched) return;

    setLoading(true);
    setError(null);

    try {
      const body = new URLSearchParams({
        api_key: process.env.NEXT_PUBLIC_BINDERBYTE_API_KEY ?? "",
        origin: ORIGIN_DISTRICT_ID,
        destination: `dist_${kecamatanId}`,
        weight: String(process.env.NEXT_PUBLIC_PACKAGE_WEIGHT_KG ?? "1"),
        courier: "lion",
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BINDERBYTE_API_URL}/v1/cost`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        },
      );

      const json = await res.json();

      if (json.code !== "200") {
        setError(json.message ?? "Gagal mengambil ongkos kirim.");
        return;
      }

      const services: ShippingService[] = [];
      (json.data.results as ApiCostResult[]).forEach((courier) => {
        courier.costs.forEach((cost) => {
          services.push({
            courierCode: courier.code,
            courierName: courier.name,
            service: cost.service,
            type: cost.type,
            price: parseInt(cost.price, 10),
            estimated: cost.estimated,
            name: `${courier.name} (${cost.service})`,
          });
        });
      });

      setOptions(services);
      if (services.length > 0) onSelect(services[0]);
      setFetchedFor(kecamatanId); // ← mark fetched, no duplicate requests
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [kecamatanId, alreadyFetched, onSelect]);

  // ── Reset when parent changes kecamatan ──
  // (parent should pass a new kecamatanId which makes alreadyFetched false)

  // ── No kecamatan selected ──
  if (!kecamatanId) {
    return (
      <div className="border border-stone-200 bg-white/40 px-4 py-4">
        <p className="font-mono text-xs text-stone-400">
          Pilih kecamatan tujuan untuk melihat opsi pengiriman.
        </p>
      </div>
    );
  }

  // ── Kecamatan selected, not yet fetched ──
  if (!alreadyFetched && !loading && !error) {
    return (
      <div className="border border-stone-200 bg-white/40 px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={13} className="text-stone-400 flex-shrink-0" />
          <p className="font-mono text-xs text-stone-500 truncate">
            <span className="text-stone-700">{kecamatanName}</span>
            {kabupatenName ? `, ${kabupatenName}` : ""}
          </p>
        </div>
        <button
          onClick={fetchOngkir}
          className="flex-shrink-0 border border-stone-500 px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-stone-700 hover:bg-stone-200 transition-colors"
        >
          Cek Ongkir
        </button>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="border border-stone-200 bg-white/40 px-4 py-4 flex items-center gap-2">
        <Loader2 size={13} className="animate-spin text-stone-400" />
        <p className="font-mono text-xs text-stone-400">
          Menghitung ongkos kirim…
        </p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="border border-red-200 bg-red-50/60 px-4 py-4 flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-red-500">{error}</p>
        <button
          onClick={() => {
            setFetchedFor(null);
            setError(null);
            fetchOngkir();
          }}
          className="font-mono text-[10px] text-stone-500 underline underline-offset-2 whitespace-nowrap"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  // ── No results ──
  if (options.length === 0) {
    return (
      <div className="border border-stone-200 bg-white/40 px-4 py-4">
        <p className="font-mono text-xs text-stone-400">
          Tidak ada layanan pengiriman tersedia untuk kecamatan ini.
        </p>
      </div>
    );
  }

  // ── Options list ──
  return (
    <div className="border border-stone-300 bg-white/70 divide-y divide-stone-200 max-h-72 overflow-y-auto">
      {options.map((opt, idx) => (
        <label
          key={idx}
          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${selected === opt ? "bg-stone-100" : "hover:bg-stone-50"
            }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="shipping"
              checked={selected === opt}
              onChange={() => onSelect(opt)}
              className="accent-stone-700"
            />
            <div>
              <p className="font-mono text-xs text-stone-700">
                {opt.courierName} ({opt.service})
              </p>
              <p className="font-mono text-[10px] text-stone-400">
                {opt.type}
                {opt.estimated && opt.estimated !== "- hari"
                  ? ` · ${opt.estimated}`
                  : ""}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-stone-700 whitespace-nowrap ml-4">
            {formatRp(opt.price)}
          </span>
        </label>
      ))}
    </div>
  );
}

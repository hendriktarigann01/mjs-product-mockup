"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WilayahItem {
  id: string;
  name: string;
}

export interface WilayahValue {
  provinsiId: string;
  provinsiName: string;
  kabupatenId: string;
  kabupatenName: string;
  kecamatanId: string;
  kecamatanName: string;
  kelurahanId: string;
  kelurahanName: string;
}

interface Props {
  value: WilayahValue;
  onChange: (val: WilayahValue) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API_KEY = process.env.NEXT_PUBLIC_BINDERBYTE_API_KEY ?? "";
const BASE = "https://api.binderbyte.com/wilayah";

async function fetchWilayah(path: string): Promise<WilayahItem[]> {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json();
  if (json.code !== "200")
    throw new Error(json.messages ?? "Gagal memuat data wilayah");
  return json.value as WilayahItem[];
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const selectCls =
  "w-full border border-stone-300 bg-white/70 px-4 py-3 font-mono text-xs text-stone-700 appearance-none focus:outline-none focus:border-stone-500 transition-colors pr-10 disabled:opacity-40 disabled:cursor-not-allowed";

interface SelectRowProps {
  placeholder: string;
  value: string;
  options: WilayahItem[];
  disabled?: boolean;
  loading?: boolean;
  onChange: (id: string, name: string) => void;
}

function SelectRow({
  placeholder,
  value,
  options,
  disabled,
  loading,
  onChange,
}: SelectRowProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          const selected = options.find((o) => o.id === e.target.value);
          onChange(e.target.value, selected?.name ?? "");
        }}
        disabled={disabled || loading}
        className={selectCls}
      >
        <option value="">{loading ? "Memuat data…" : placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ChevronDown size={12} />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WilayahSelect({ value, onChange }: Props) {
  const [provinsiList, setProvinsiList] = useState<WilayahItem[]>([]);
  const [kabupatenList, setKabupatenList] = useState<WilayahItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahItem[]>([]);
  const [kelurahanList, setKelurahanList] = useState<WilayahItem[]>([]);

  const [loadingProvinsi, setLoadingProvinsi] = useState(true);
  const [loadingKabupaten, setLoadingKabupaten] = useState(false);
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [loadingKelurahan, setLoadingKelurahan] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch provinsi on mount
  useEffect(() => {
    fetchWilayah(`/provinsi?api_key=${API_KEY}`)
      .then(setProvinsiList)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProvinsi(false));
  }, []);

  // Fetch kabupaten when provinsi changes
  useEffect(() => {
    if (!value.provinsiId) return;
    setLoadingKabupaten(true);
    setKabupatenList([]);
    fetchWilayah(
      `/kabupaten?api_key=${API_KEY}&id_provinsi=${value.provinsiId}`,
    )
      .then(setKabupatenList)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingKabupaten(false));
  }, [value.provinsiId]);

  // Fetch kecamatan when kabupaten changes
  useEffect(() => {
    if (!value.kabupatenId) return;
    setLoadingKecamatan(true);
    setKecamatanList([]);
    fetchWilayah(
      `/kecamatan?api_key=${API_KEY}&id_kabupaten=${value.kabupatenId}`,
    )
      .then(setKecamatanList)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingKecamatan(false));
  }, [value.kabupatenId]);

  // Fetch kelurahan when kecamatan changes
  useEffect(() => {
    if (!value.kecamatanId) return;
    setLoadingKelurahan(true);
    setKelurahanList([]);
    fetchWilayah(
      `/kelurahan?api_key=${API_KEY}&id_kecamatan=${value.kecamatanId}`,
    )
      .then(setKelurahanList)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingKelurahan(false));
  }, [value.kecamatanId]);

  // ── Handlers ──
  function handleProvinsi(id: string, name: string) {
    onChange({
      provinsiId: id,
      provinsiName: name,
      kabupatenId: "",
      kabupatenName: "",
      kecamatanId: "",
      kecamatanName: "",
      kelurahanId: "",
      kelurahanName: "",
    });
    setKabupatenList([]);
    setKecamatanList([]);
    setKelurahanList([]);
  }

  function handleKabupaten(id: string, name: string) {
    onChange({
      ...value,
      kabupatenId: id,
      kabupatenName: name,
      kecamatanId: "",
      kecamatanName: "",
      kelurahanId: "",
      kelurahanName: "",
    });
    setKecamatanList([]);
    setKelurahanList([]);
  }

  function handleKecamatan(id: string, name: string) {
    onChange({
      ...value,
      kecamatanId: id,
      kecamatanName: name,
      kelurahanId: "",
      kelurahanName: "",
    });
    setKelurahanList([]);
  }

  function handleKelurahan(id: string, name: string) {
    onChange({ ...value, kelurahanId: id, kelurahanName: name });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="font-mono text-[10px] text-red-500 px-1">{error}</p>
      )}

      <SelectRow
        placeholder="Pilih Provinsi"
        value={value.provinsiId}
        options={provinsiList}
        loading={loadingProvinsi}
        onChange={handleProvinsi}
      />

      <SelectRow
        placeholder="Pilih Kabupaten / Kota"
        value={value.kabupatenId}
        options={kabupatenList}
        disabled={!value.provinsiId}
        loading={loadingKabupaten}
        onChange={handleKabupaten}
      />

      <SelectRow
        placeholder="Pilih Kecamatan"
        value={value.kecamatanId}
        options={kecamatanList}
        disabled={!value.kabupatenId}
        loading={loadingKecamatan}
        onChange={handleKecamatan}
      />

      <SelectRow
        placeholder="Pilih Kelurahan / Desa"
        value={value.kelurahanId}
        options={kelurahanList}
        disabled={!value.kecamatanId}
        loading={loadingKelurahan}
        onChange={handleKelurahan}
      />
    </div>
  );
}

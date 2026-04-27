"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronLeft, Loader } from "lucide-react";
import type { DesignItem } from "@/types/product";

// ── Types ──────────────────────────────────────────────────────────
interface PixabayHit {
  id: number;
  webformatURL: string;
  previewURL: string;
  tags: string;
}

type Mode = "local" | "all" | "search";

const IMAGE_TYPES = ["all", "photo", "illustration", "vector"] as const;
const ORIENTATIONS = ["all", "horizontal", "vertical"] as const;
const ORDERS = ["popular", "latest"] as const;
const CATEGORIES = [
  "",
  "backgrounds",
  "fashion",
  "nature",
  "science",
  "education",
  "feelings",
  "health",
  "people",
  "religion",
  "places",
  "animals",
  "industry",
  "computer",
  "food",
  "sports",
  "transportation",
  "travel",
  "buildings",
  "business",
  "music",
] as const;

// ── Props (struktur New) ───────────────────────────────────────────
interface DesignPickerProps {
  designs: DesignItem[];
  active: string | null;
  onSelect: (id: string) => void;
}

// ── Local Design Grid ──────────────────────────────────────────────
function LocalGrid({
  designs,
  active,
  onSelect,
  limit,
}: {
  designs: DesignItem[];
  active: string | null;
  onSelect: (id: string) => void;
  limit?: number;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const items = limit ? designs.slice(0, limit) : designs;

  return (
    <div className="grid grid-cols-6 gap-2">
      {items.map((design, i) => {
        const isActive = active === design.id;
        const isHovered = hoveredId === design.id;

        return (
          <button
            key={design.id}
            onClick={() => onSelect(design.id)}
            onMouseEnter={() => setHoveredId(design.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`
              relative aspect-square rounded-lg border-2 overflow-hidden
              transition-all duration-150
              ${
                isActive
                  ? "border-stone-700 shadow-md scale-105"
                  : "border-stone-200 hover:border-stone-400 hover:scale-[1.03]"
              }
            `}
            aria-label={design.name ?? `Design ${i + 1}`}
            title={design.name}
          >
            <img
              src={design.src}
              alt={design.name ?? `Design ${i + 1}`}
              className="w-full h-full object-cover"
            />

            {isActive && (
              <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                <span className="text-white text-sm drop-shadow font-bold">
                  ✓
                </span>
              </div>
            )}

            <span
              className={`
                absolute inset-0 flex items-end justify-center pb-1.5
                text-[10px] font-mono text-white bg-black/40
                transition-opacity duration-150
                ${isHovered && !isActive ? "opacity-100" : "opacity-0"}
              `}
            >
              {design.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Pixabay Result Grid ────────────────────────────────────────────
function PixabayGrid({
  hits,
  active,
  onSelect,
  loading,
}: {
  hits: PixabayHit[];
  active: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader size={20} className="animate-spin text-stone-400" />
      </div>
    );
  }
  if (!hits.length) {
    return (
      <p className="font-mono text-xs text-stone-300 text-center py-8">
        No results found
      </p>
    );
  }
  return (
    <div className="grid grid-cols-6 gap-2">
      {hits.map((hit) => {
        const proxied = `/api/pixabay-image?url=${encodeURIComponent(hit.webformatURL)}`;
        const isActive = active === proxied;
        return (
          <button
            key={hit.id}
            onClick={() => onSelect(proxied)}
            className={`
              relative aspect-square rounded-lg border-2 overflow-hidden
              transition-all duration-150 bg-stone-50
              ${
                isActive
                  ? "border-stone-700 scale-105 shadow-md"
                  : "border-stone-200 hover:border-stone-400 hover:scale-[1.03]"
              }
            `}
            title={hit.tags}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hit.previewURL}
              alt={hit.tags}
              className="w-full h-full object-contain"
            />
            {isActive && (
              <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                <span className="text-white text-sm drop-shadow font-bold">
                  ✓
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main DesignPicker ──────────────────────────────────────────────
export function DesignPicker({ designs, active, onSelect }: DesignPickerProps) {
  const [mode, setMode] = useState<Mode>("local");

  const [query, setQuery] = useState("");
  const [imageType, setImageType] = useState<string>("illustration");
  const [orientation, setOrientation] = useState<string>("all");
  const [order, setOrder] = useState<string>("popular");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);

  const [hits, setHits] = useState<PixabayHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const fetchPixabay = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: encodeURIComponent(query),
        image_type: imageType,
        orientation,
        order,
        per_page: "20",
        page: String(p),
        ...(category ? { category } : {}),
      });
      const res = await fetch(`/api/pixabay?${params}`);
      const data = await res.json();
      setHits(data.hits ?? []);
      setTotal(data.totalHits ?? 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "search") {
      fetchPixabay(1);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPixabay(1);
  };

  // ── LOCAL MODE ───────────────────────────────────────────────────
  if (mode === "local") {
    return (
      <div className="flex flex-col gap-3">
        <LocalGrid
          designs={designs}
          active={active}
          onSelect={onSelect}
          limit={12}
        />
        <button
          onClick={() => setMode("all")}
          className="font-mono text-[10px] tracking-widest uppercase text-stone-400
            hover:text-stone-600 transition-colors text-left"
        >
          See all presets ({designs.length}) →
        </button>
      </div>
    );
  }

  // ── ALL PRESETS MODE ─────────────────────────────────────────────
  if (mode === "all") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode("local")}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ChevronLeft size={12} /> Back
          </button>
          <button
            onClick={() => setMode("search")}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider
              text-stone-500 hover:text-stone-700 transition-colors
              border border-stone-200 hover:border-stone-400 rounded-lg px-2.5 py-1.5"
          >
            <Search size={10} /> Search online
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto no-scrollbar">
          <LocalGrid designs={designs} active={active} onSelect={onSelect} />
        </div>
      </div>
    );
  }

  // ── SEARCH MODE (Pixabay) ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode("all")}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ChevronLeft size={12} /> Back
        </button>
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-300">
          Pixabay
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designs..."
            className="w-full pl-7 pr-8 py-2 rounded-lg border border-stone-200
              font-mono text-xs text-stone-700 placeholder:text-stone-300
              focus:outline-none focus:border-stone-400 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                fetchPixabay(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-3 py-2 bg-stone-800 text-white rounded-lg font-mono text-[10px]
            uppercase tracking-wider hover:bg-stone-700 transition-colors"
        >
          Go
        </button>
      </form>

      <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
        <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1">
          Filters
        </p>

        <div className="flex gap-2">
          <div className="flex-1">
            <p className="font-mono text-[8px] uppercase tracking-wider text-stone-300 mb-1">
              Type
            </p>
            <div className="flex flex-wrap gap-1">
              {IMAGE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setImageType(t)}
                  className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border transition-all
                    ${imageType === t ? "bg-stone-700 text-white border-stone-700" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="font-mono text-[8px] uppercase tracking-wider text-stone-300 mb-1">
              Orientation
            </p>
            <div className="flex flex-wrap gap-1">
              {ORIENTATIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border transition-all
                    ${orientation === o ? "bg-stone-700 text-white border-stone-700" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-stone-300 mb-1">
              Order
            </p>
            <div className="flex gap-1">
              {ORDERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrder(o)}
                  className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border transition-all
                    ${order === o ? "bg-stone-700 text-white border-stone-700" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="font-mono text-[8px] uppercase tracking-wider text-stone-300 mb-1">
              Category
            </p>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-0.5 rounded border border-stone-200
                font-mono text-[8px] text-stone-500 bg-white focus:outline-none focus:border-stone-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c || "— all —"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {total > 0 && (
        <p className="font-mono text-[9px] text-stone-300 tracking-wider">
          {total.toLocaleString()} results
        </p>
      )}

      <div className="max-h-64 overflow-y-auto no-scrollbar">
        <PixabayGrid
          hits={hits}
          active={active}
          onSelect={onSelect}
          loading={loading}
        />
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => fetchPixabay(page - 1)}
            disabled={page === 1 || loading}
            className="font-mono text-[9px] uppercase tracking-wider text-stone-400 hover:text-stone-600 disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="font-mono text-[9px] text-stone-300">
            Page {page}
          </span>
          <button
            onClick={() => fetchPixabay(page + 1)}
            disabled={hits.length < 20 || loading}
            className="font-mono text-[9px] uppercase tracking-wider text-stone-400 hover:text-stone-600 disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

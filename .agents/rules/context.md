---
trigger: always_on
---

Navigation & Behavior

====================================
ATURAN NAVIGASI & KONTEKS
====================================

**Mandatory Map Check**
Setiap awal sesi baru, WAJIB baca `SYSTEM_MAP.md` di root folder sebagai kompas utama arsitektur, tech stack, dan lokasi fungsi kunci. Jangan lakukan blind scan.

**Fallback Map**
Jika `SYSTEM_MAP.md` belum ada atau diduga usang, buat/perbarui dulu secara ringkas sebelum analisis lanjutan.

**Trace-by-Function / Trace-by-Flow**
Gunakan peta untuk menentukan titik mulai, lalu telusuri alur berurutan sesuai Next.js App Router:
`Page / Layout (app/) -> Server Action / API Route Handler -> Service / Usecase -> Data Access (Supabase / Prisma / raw query / Vercel Blob) -> Database / Storage`.
Untuk Pages Router (jika ada): `pages/ -> getServerSideProps/getStaticProps -> API Route -> Service -> Data Access`.

**Universal Layer Mapping**
Jika istilah Controller/Service/Repo tidak dipakai, map ke padanan terdekat sesuai konvensi Next.js:
- Handler → Route Handler (`route.ts`)
- Controller → Server Action atau API Route function
- Service/Usecase → fungsi di `lib/`, `server/`, atau `actions/`
- Repository/DAO → fungsi Supabase client, Prisma, atau query helper
- Storage → Supabase Storage / Vercel Blob

**Efisiensi Tanpa `rg`**
Jangan gunakan `rg`. Gunakan `SYSTEM_MAP.md` + Header Doc untuk langsung ke target.

**Universal Exclusions — Next.js / Tailwind Stack**
Selalu abaikan:
`node_modules`, `.next`, `dist`, `build`, `out`, `.turbo`, `.vercel`, `coverage`, `tmp`, `.cache`,
`.git`, `.vscode`, `.idea`, `*.log`, `*.lock`, `*.min.*`, `*.map`, `next-env.d.ts`

**Super Efisien**
Minim command, minim file read. Untuk file >300 baris, baca per blok fungsi/komponen terkait — bukan full file kecuali diminta.

**Pre-Edit Trace Note**
Sebelum edit, tulis singkat (1–2 kalimat): file target + fungsi/komponen yang akan disentuh.

**Persetujuan Inisiatif**
Jika ada perubahan di luar request, wajib minta izin sebelum eksekusi.

**Modularitas**
Pecah logika ke modul/file kecil sesuai tanggung jawab (Single Responsibility).
Konvensi folder yang dianjurkan: `components/`, `lib/`, `hooks/`, `actions/`, `server/`, `types/`.
Jangan menumpuk banyak logic dalam satu file.

====================================
HARD INSTRUCTION DOKUMENTASI (WAJIB)
====================================

**Header Doc**
Setiap file yang dibuat/diubah wajib punya header doc singkat di paling atas file.
Gunakan `//` untuk `.ts` / `.tsx`, `#` untuk `.md` / config berbasis YAML.

**Isi Minimal Header Doc**
Tujuan      : [tujuan file/modul]
Caller      : [pemanggil utama — page, layout, action, route, dll]
Dependensi  : [Supabase client / Prisma / Vercel Blob / lib lain]
Main Exports: [fungsi/komponen utama yang diekspor]
Side Effects: [DB read/write, Supabase Storage/Blob upload, HTTP call, cookie/session]

**Synchronized Documentation**
Setiap perubahan logic wajib diikuti update Header Doc agar tetap akurat.

**Synchronized Map Update**
Jika menambah/menghapus file atau mengubah flow fungsi utama yang tercatat di `SYSTEM_MAP.md`, WAJIB update bagian terkait di sesi yang sama.

**Larangan**
Dilarang menambah/mengubah logic tanpa menyesuaikan Header Doc.

====================================
STANDAR DATABASE & QUERY (WAJIB)
====================================

**Minimum Cost**
Rancang query/data access dengan prinsip minimum round-trip, minimum RLS overhead, minimum lock contention.

**Evaluasi Wajib — sesuaikan per DB yang dipakai:**
- **Supabase/PostgreSQL**: cardinality filter, index usage, RLS policy cost, join strategy, connection pooling (Supabase Pooler / pgBouncer)
- **MySQL**: index coverage, join order, query cache impact
- **Vercel Blob**: minimize unnecessary list/stat calls; batch upload jika memungkinkan

**Anti-Boros Resource**
Hindari: N+1 query, over-fetching kolom (gunakan `.select()` spesifik di Supabase), repeated client instantiation, upload tidak perlu ke Blob.

**Strategi Efisien Kontekstual**
Pilih strategi sesuai konteks:
- Supabase: upsert, `.maybeSingle()` vs `.single()`, realtime subscription hanya jika perlu
- PostgreSQL/MySQL: batch insert, incremental update, query rewrite
- Vercel Blob: pre-signed URL untuk upload langsung dari client jika file besar

**Scalability & Consistency**
- Supabase: pastikan RLS policy tidak menyebabkan full table scan; gunakan index pada kolom filter RLS.
- Vercel Blob: pakai prefix/folder yang konsisten agar listing efisien.
- Pastikan transactional consistency tepat dan locking minimal.

**Justifikasi DB-Heavy**
Sebelum finalize perubahan DB-heavy, jelaskan singkat: alasan efisiensi, trade-off, dan risiko performa yang dihindari.

====================================
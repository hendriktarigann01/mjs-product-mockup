# SYSTEM_MAP — Happify Indonesia (mjs-product-mockup)

> Dibuat: 2026-04-23 | Diperbarui: 2026-04-29 | Bahasa: Indonesia

---

## Project Summary

**Tujuan Aplikasi**
Platform e-commerce kustomisasi produk (kaos, kaos kaki, tote bag, gift card) dengan fitur desain interaktif berbasis canvas, pembayaran online via Midtrans Snap, manajemen pesanan via Supabase, cross-device checkout via QR code, dan notifikasi email/WhatsApp.

**Tech Stack Utama**

| Layer | Teknologi |
|---|---|
| Framework | Next.js ^16.2.1 (App Router) |
| UI Library | React ^19.2.5 + TypeScript ^6.0.2 |
| Styling | Tailwind CSS v4.2.2 (PostCSS) |
| Animasi | Framer Motion ^12.38.0 |
| Icons | Lucide React ^1.8.0 |
| Canvas AI | @imgly/background-removal ^1.7.0, @mediapipe/selfie_segmentation, face-api.js |
| Payment | Midtrans Snap (sandbox) |
| Email | Resend ^6.12.0 |
| Backend | Express.js ^5.2.1 (server terpisah, port 3001) |
| Data Store | **Supabase** (PostgreSQL) — orders + checkout_sessions |
| Google Sheets | Legacy — tetap ada untuk `notify-resi` backward compat |
| QR Code | react-qr-code ^2.0.18 |
| Notif WA | Fonnte API |
| Desain Stok | Pixabay API (proxy via Next.js route) |
| Ongkir | Binderbyte API |

**Pola Arsitektur**
- **App Router** (Next.js) — semua halaman di `app/`
- **Client Components** (`"use client"`) untuk semua halaman interaktif (cart, checkout, order pages)
- **Tidak ada Server Actions** — checkout memanggil Express backend eksternal (`localhost:3001`)
- **Storage State**: Cart disimpan di `localStorage` (`happify_cart`); order sementara di `currentOrder`; checkout_sessions di Supabase untuk QR flow
- **Backend Terpisah**: `backend/index.js` — Express server mandiri (bukan Next.js API routes) yang mengurus Midtrans, Supabase, Resend, Fonnte
- **Cross-device QR Flow**: Cart → `QRCheckoutModal` → Supabase `checkout_sessions` → QR link `/checkouts?session_id={id}` → mobile browser prefill

---

## Core Logic Flow (Function-Level Flowchart)

### Flow 1 — Kustomisasi Produk & Add to Cart
```
app/page.tsx [Home]
  └─> Customizer.tsx [handleProductChange, handleAddToCart]
        ├─> useCustomizer.ts [activeDesign, shirtColor, photos, giftCardUrl]
        ├─> Canvas.tsx         [render produk + desain + foto]
        ├─> DesignPicker.tsx   [pilih desain preset / Pixabay]
        │     └─> GET /api/pixabay/route.ts  [proxy ke Pixabay API]
        ├─> PhotoUploadSection.tsx  [upload foto + background removal]
        │     └─> useFaceSegmentation.ts   [@imgly/background-removal]
        ├─> GiftCardEditor.tsx  [editor gift card via canvas]
        │     └─> useGiftCardEditor.ts
        └─> addToCart(product, qty, customization)  [utils/cart-service.ts]
              └─> localStorage.setItem("happify_cart", ...)
```

### Flow 2 — Cart
```
app/cart/page.tsx [CartPage]
  ├─> getCart()              [utils/cart-service.ts → localStorage]
  ├─> CartList.tsx           [daftar item]
  │     └─> CartItemRow.tsx  [update qty / remove]
  ├─> CartOrderSummary.tsx   [subtotal + tombol ke checkout]
  ├─> CartEmptyState.tsx / TrustBadges.tsx
  └─> QRCheckoutModal.tsx    ["Continue on Mobile" → Supabase checkout_sessions insert → QR]
```

### Flow 2b — Cross-Device QR Checkout
```
[Kiosk] app/cart/page.tsx
  └─> QRCheckoutModal.tsx
        ├─> form: name, email, phone
        └─> supabase.from("checkout_sessions").insert()
              └─> QR Code: /checkouts?session_id={uuid}

[Mobile] app/checkouts/page.tsx?session_id={uuid}
  └─> supabase.from("checkout_sessions").select()  [fetch prefill data]
        ├─> setFirstName / setEmail / setPhone
        └─> setCartItems (dari session.cart_items)
```

### Flow 3 — Checkout & Pembayaran (FLOW UTAMA)
```
app/checkouts/page.tsx [CheckoutPage]
  ├─> useSearchParams()           [deteksi session_id dari QR atau undefined]
  ├─> [jika session_id] supabase.from("checkout_sessions").select()  [prefill form + cart]
  ├─> [jika tidak] getCart() / getBuyNowItem()   [localStorage flow — tidak berubah]
  ├─> useCheckoutForm.ts          [state form: email, nama, alamat, wilayah, shipping]
  ├─> WilayahSelect.tsx           [provinsi → kabupaten → kecamatan via Binderbyte API]
  ├─> ShippingMethod.tsx          [kalkulasi ongkir via Binderbyte API]
  ├─> initMidtrans(clientKey)     [utils/midtrans-service.ts → inject snap.js]
  └─> handleCheckout()
        ├─> generatePatternPDFSafe()      [utils/generate-pdf.ts → base64 PDF]
        ├─> POST /api/pdf                 [Next.js route → simpan {orderId}.pdf + {orderId}.json ke public/temp/]
        ├─> createTransactionToken(paymentData)
        │     └─> POST http://localhost:3001/api/midtrans/create-token
        │           ├─> snap.createTransaction({ enabled_payments: ["qris"] })  [Midtrans SDK — QRIS only]
        │           └─> insertOrder(orderData)            [Supabase orders insert]
        ├─> openMidtransPayment(snapToken)   [window.snap.pay()]
        │     ├─> onSuccess → update checkout_sessions.status = 'paid' (jika QR flow)
        │     └─> onPending → update checkout_sessions.status = 'waiting_payment' (jika QR flow)
        └─> localStorage "currentOrder" disimpan
```

### Flow 4 — Notifikasi Setelah Pembayaran
```
Midtrans Webhook → POST /api/midtrans/callback (backend)
  ├─> updateOrderByOrderId(orderId, { status })  [Supabase orders update]
  └─> (jika paid) readTempOrderFiles(orderId)    [baca public/temp/{orderId}.json + .pdf dari disk]
        ├─> sendOrderEmails(orderSummary, pdfBase64)  [Resend → customer + pabrik]
        └─> deleteTempOrderFiles(orderId)             [hapus file PDF + JSON dari public/temp/]

Midtrans redirect → app/order-success/page.tsx
  └─> clearCart() + tampilkan ringkasan dari localStorage

Admin (legacy — notify resi)
  └─> POST /api/notify-resi (backend)
        └─> sendWAResi() [Fonnte WhatsApp API]
```

---

## Clean Tree

```
mjs-product-mockup/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    ← Home / Customizer
│   ├── globals.css
│   ├── cart/
│   │   └── page.tsx                ← + QR "Continue on Mobile" button
│   ├── checkouts/
│   │   └── page.tsx                ← + session_id QR flow (conditional)
│   ├── admin/
│   │   ├── page.tsx                ← Admin login
│   │   └── dashboard/
│   │       └── page.tsx            ← Order dashboard
│   ├── order-success/
│   │   └── page.tsx
│   ├── order-pending/
│   │   └── page.tsx
│   ├── order-error/
│   │   └── page.tsx
│   └── api/
│       ├── pixabay/
│       │   └── route.ts
│       ├── pixabay-image/
│       │   └── route.ts            ← (proxy gambar Pixabay)
│       ├── pdf/
│       │   └── route.ts            ← POST (save PDF+JSON ke temp) | DELETE (hapus)
│       └── remove-bg/
│           └── route.ts            ← (proxy remove background)
├── lib/
│   └── supabase.ts                 ← Frontend Supabase client (anon key, singleton)
├── backend/
│   ├── index.js                    ← Express server (port 3001)
│   ├── .env
│   └── data/
│       └── happify-service-account.json  ← Google Service Account (tidak di-commit)
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Divider.tsx
│   ├── customizer/
│   │   ├── Customizer.tsx
│   │   ├── Canvas.tsx
│   │   ├── DesignPicker.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── PhotoUploadSection.tsx
│   │   ├── ProductSidebar.tsx
│   │   └── ProductSidebarNew.tsx
│   ├── cart/
│   │   ├── CartList.tsx
│   │   ├── CartItemRow.tsx
│   │   ├── CartOrderSummary.tsx
│   │   ├── CartEmptyState.tsx
│   │   ├── TrustBadges.tsx
│   │   └── QRCheckoutModal.tsx     ← (NEW) QR cross-device checkout modal
│   ├── checkouts/
│   │   ├── ContactSection.tsx
│   │   ├── DeliverySection.tsx
│   │   ├── ShippingSection.tsx
│   │   ├── ShippingMethod.tsx
│   │   ├── WilayahSelect.tsx
│   │   ├── OrderSummary.tsx
│   │   └── PaymentSection.tsx
│   └── giftcard/
│       ├── GiftCardEditor.tsx
│       └── GiftCardTemplatePicker.tsx
├── hooks/
│   ├── useCart.ts
│   ├── useCheckoutForm.ts
│   ├── useCustomizer.ts
│   ├── useFaceSegmentation.ts
│   └── useGiftCardEditor.ts
├── utils/
│   ├── cart-service.ts
│   ├── midtrans-service.ts
│   ├── canvas.ts
│   ├── format.ts
│   └── validation.ts
├── constants/
│   ├── mockup.ts
│   ├── cart.ts
│   ├── checkout.ts
│   ├── giftcard.ts
│   ├── mck.ts
│   └── ui.ts
├── types/
│   ├── cart.ts
│   ├── cart/          ← (subfolder)
│   ├── checkout.ts
│   ├── checkouts/     ← (subfolder)
│   ├── common.ts
│   ├── giftcard.ts
│   └── product.ts
├── public/
│   ├── products/      ← aset produk (shirt.png, socks.png, dll)
│   ├── mockup/        ← desain preset (50+ file .png)
│   ├── temp/          ← file PDF + JSON sementara per order (di-ignore git, dihapus setelah email)
│   └── fonts/
├── fonts/             ← font local
├── cart.ts            ← (file root, kemungkinan draft/legacy)
├── .env.local
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Module Map (The Chapters)

### Pages (`app/`)

| File | Fungsi/Export Utama | Peran |
|---|---|---|
| `app/layout.tsx` | `RootLayout` | Root layout, metadata SEO, inject globals.css |
| `app/page.tsx` | `Home` | Halaman utama, render `<Customizer />` |
| `app/cart/page.tsx` | `CartPage` | Halaman keranjang, CRUD cart via cart-service |
| `app/checkouts/page.tsx` | `CheckoutPage` | Form checkout + integrasi Midtrans Snap |
| `app/order-success/page.tsx` | `OrderSuccessPage` | Konfirmasi pembayaran + auto-redirect 10 detik |
| `app/order-pending/page.tsx` | `OrderPendingPage` | Status pembayaran pending |
| `app/order-error/page.tsx` | `OrderErrorPage` | Status pembayaran gagal |

### API Routes (`app/api/`)

| File | Handler | Peran |
|---|---|---|
| `app/api/pixabay/route.ts` | `GET` | Proxy Pixabay API (tambahkan API key server-side) |
| `app/api/pixabay-image/route.ts` | `GET` | Proxy gambar dari Pixabay (hindari CORS) |
| `app/api/remove-bg/route.ts` | `POST`/`GET` | Proxy Remove.bg API (background removal) |

### Components

| File | Komponen Utama | Peran |
|---|---|---|
| `components/customizer/Customizer.tsx` | `Customizer` | Orchestrator: pilih produk, desain, warna, foto, add to cart |
| `components/customizer/Canvas.tsx` | `Canvas` | Render canvas HTML5 — komposit produk + desain + foto |
| `components/customizer/DesignPicker.tsx` | `DesignPicker` | Grid preset desain + search Pixabay |
| `components/customizer/PhotoUploadSection.tsx` | `PhotoUploadSection` | Upload foto + hapus background (AI) |
| `components/customizer/ColorPicker.tsx` | `ColorPicker` | Pilih warna produk dari 30 opsi |
| `components/customizer/ProductSidebar.tsx` | `ProductSidebar` | Sidebar pilih jenis produk |
| `components/giftcard/GiftCardEditor.tsx` | `GiftCardEditor` | Editor teks gift card di atas canvas template |
| `components/giftcard/GiftCardTemplatePicker.tsx` | `GiftCardTemplatePicker` | Pilih template gift card |
| `components/cart/CartList.tsx` | `CartList` | Daftar item di keranjang |
| `components/cart/CartItemRow.tsx` | `CartItemRow` | Baris item: qty +/-, hapus, thumbnail |
| `components/cart/CartOrderSummary.tsx` | `CartOrderSummary` | Subtotal + tombol checkout |
| `components/checkouts/WilayahSelect.tsx` | `WilayahSelect` | Dropdown wilayah Indonesia (provinsi→kabupaten→kecamatan) |
| `components/checkouts/ShippingMethod.tsx` | `ShippingMethod` | Kalkulasi + pilih metode pengiriman via Binderbyte |
| `components/checkouts/OrderSummary.tsx` | `OrderSummary` | Panel ringkasan order di halaman checkout |
| `components/common/Header.tsx` | `Header` | Header dengan breadcrumb dan judul halaman |
| `components/common/Button.tsx` | `Button` | Komponen tombol dengan variant (primary, secondary) |

### Hooks

| File | Hook Utama | Peran |
|---|---|---|
| `hooks/useCustomizer.ts` | `useCustomizer` | State desain aktif, warna, foto, gift card URL |
| `hooks/useCheckoutForm.ts` | `useCheckoutForm` | State seluruh form checkout + validasi alamat |
| `hooks/useCart.ts` | `useCart` | Wrapper cart state (opsional, cart-service lebih banyak dipakai langsung) |
| `hooks/useFaceSegmentation.ts` | `useFaceSegmentation` | AI segmentasi wajah (MediaPipe / face-api.js) |
| `hooks/useGiftCardEditor.ts` | `useGiftCardEditor` | State teks dan rendering gift card |

### Utils

| File | Fungsi Utama | Peran |
|---|---|---|
| `utils/cart-service.ts` | `getCart, addToCart, removeFromCart, updateCartItemQuantity, clearCart, getCartTotal, getCartWeight` | CRUD cart di localStorage |
| `utils/midtrans-service.ts` | `initMidtrans, createTransactionToken, openMidtransPayment, verifyPaymentStatus` | Integrasi Midtrans Snap (load script, create token, buka popup) |
| `utils/canvas.ts` | (fungsi canvas helper) | Helper utilitas operasi canvas HTML5 |
| `utils/format.ts` | `formatRp` | Format angka ke Rupiah |
| `utils/validation.ts` | `isAddressComplete` | Validasi kelengkapan alamat |

### Constants

| File | Export Utama | Peran |
|---|---|---|
| `constants/mockup.ts` | `PRODUCTS, GIFT_CARD_TEMPLATES, PREDEFINED_DESIGNS, DESIGN_PAIRS, SHIRT_COLORS` | Data master: produk (4 item), desain preset (55+), warna kaos (30 warna) |
| `constants/checkout.ts` | `EMPTY_WILAYAH` | Nilai awal wilayah kosong |
| `constants/cart.ts` | — | Konstanta cart |
| `constants/giftcard.ts` | — | Konstanta gift card |
| `constants/mck.ts` | — | Konstanta (kemungkinan mock data lama) |
| `constants/ui.ts` | — | Konstanta UI |

### Types

| File | Interface/Type Utama | Peran |
|---|---|---|
| `types/product.ts` | `Product, DesignItem` | Tipe data produk dan item desain |
| `types/cart.ts` | `CartItem` | Tipe item keranjang |
| `types/checkout.ts` | `WilayahValue, ShippingService, BillingOption` | Tipe form checkout dan data wilayah |
| `types/giftcard.ts` | `GiftCardTemplate` | Tipe template gift card |
| `types/common.ts` | — | Tipe umum bersama |

### Backend (`backend/`)

Struktur modular setelah separation of concern:

```
backend/
├── index.js                  ← Entry point: middleware, mount routes, listen
├── config.js                 ← Inisialisasi Snap, Supabase admin, Resend, env vars
├── routes/
│   └── midtrans.js           ← POST /api/midtrans/create-token (QRIS only) + /callback
├── services/
│   ├── supabase.js           ← (NEW) insertOrder, getOrderByOrderId, updateOrderByOrderId, updateCheckoutSessionStatus
│   ├── sheets.js             ← (LEGACY) logOrderToSheets — tidak lagi dipakai di order flow
│   ├── email.js              ← sendOrderEmails (Resend)
│   ├── whatsapp.js           ← sendWAResi (Fonnte)
│   └── orderCache.js         ← (DEPRECATED — tidak dipakai, dapat dihapus)
└── templates/
    ├── emailCustomer.js      ← HTML template email konfirmasi customer
    └── emailPabrik.js        ← HTML template email order untuk pabrik
```

| Endpoint | Method | Handler | Peran |
|---|---|---|---|
| `/api/midtrans/create-token` | `POST` | `routes/midtrans.js` | Buat Midtrans Snap token (QRIS only) + insert ke Supabase orders (Routed via vercel.json) |
| `/api/midtrans/callback` | `POST` | `routes/midtrans.js` | Webhook Midtrans — update Supabase status, baca file temp, kirim email, hapus file (Routed via vercel.json) |
| `/api/notify-resi` | `POST` | `index.js` | Kirim notif WhatsApp resi via Fonnte (Routed via vercel.json) |
| `/api/orders/:orderId` | `GET` | `index.js` | Ambil data order dari Supabase (Routed via vercel.json) |
| `/health` | `GET` | `index.js` | Health check |

---

## Data & Config

### Environment Variables

**Frontend** (`.env.local`):
| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_BINDERBYTE_API_URL` | Base URL Binderbyte (ongkir/wilayah) |
| `NEXT_PUBLIC_BINDERBYTE_API_KEY` | API key Binderbyte |
| `NEXT_PUBLIC_ORIGIN_DISTRICT_ID` | ID kecamatan asal pengiriman |
| `NEXT_PUBLIC_PACKAGE_WEIGHT_KG` | Berat paket default |
| `NEXT_PUBLIC_PIXALAB_API_URL` | Base URL Pixabay |
| `NEXT_PUBLIC_PIXALAB_API_KEY` | API key Pixabay |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans (dipakai backend, bocor ke frontend — perlu dipindah) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key Midtrans Snap |
| `NEXT_PUBLIC_API_URL` | URL backend Express (`http://localhost:3001`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase (untuk frontend client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase (aman di browser) |
| `REMOVE_BG_API_KEY` | API key Remove.bg (deprecated) |
| `KIRIMIN_AJA_API_URL` | URL KiriminAja (deprecated) |

**Backend** (`backend/.env`):
| Variable | Keterangan |
|---|---|
| `PORT` | Port Express server (default 3001) |
| `APP_URL` | URL frontend untuk Midtrans redirect callbacks |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans |
| `MIDTRANS_CLIENT_KEY` | Client key Midtrans |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_KEY` | service_role key Supabase (full DB access — RAHASIA) |
| `GOOGLE_SHEETS_ID` | ID spreadsheet Google Sheets (legacy) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Path ke file service account JSON (legacy) |
| `RESEND_API_KEY` | API key Resend (email) |
| `EMAIL_FROM` | Alamat pengirim email |
| `EMAIL_PABRIK` | Email penerima order (pabrik/produksi) |
| `FONNTE_TOKEN` | Token Fonnte (WhatsApp) |

### Skema Data

1. **localStorage (browser)**:
   - `happify_cart` → `CartItemWithCustomization[]` (keranjang belanja — tetap dipakai)
   - `currentOrder` → data order sementara untuk halaman order-success

2. **Supabase (primary database)**:

**Tabel `orders`**:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `order_id` | text UNIQUE | Midtrans order ID |
| `created_at` | timestamptz | Auto |
| `customer_name` | text | firstName + lastName |
| `payment_method` | text | Default: "qris" |
| `subtotal` | numeric | Total produk (tanpa ongkir) |
| `shipping_cost` | numeric | Ongkir |
| `total_price` | numeric | subtotal + shipping_cost |
| `email` | text | |
| `phone` | text | |
| `address` | text | |
| `postal_code` | text | |
| `region_tag` | text | Merge dari Jabodetabek/Jawa-Bali/Luar Jawa |
| `shipping_courier` | text | Nama ekspedisi |
| `tracking_number` | text | Resi (admin isi) |
| `shipped_at` | timestamptz | Tanggal kirim |
| `status` | text | pending / paid / shipped / failed |
| `pdf_url` | text | Path ke file PDF (opsional) |
| `cart_items` | jsonb | Full cart item detail |

**Tabel `checkout_sessions`**:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | ID sesi (dipakai di QR link) |
| `name` | text | Nama customer (dari kiosk) |
| `email` | text | |
| `phone` | text | |
| `cart_items` | jsonb | Snapshot cart saat QR dibuat |
| `status` | text | pending / waiting_payment / paid |
| `created_at` | timestamptz | Auto |

3. **Google Sheets** (legacy — tidak lagi dipakai untuk order flow):
   - Masih diinisialisasi di `config.js` untuk backward compat
   - `sheets.js` service masih ada tapi tidak dipanggil dari midtrans.js

**Produk** (hardcoded di `constants/mockup.ts`):

| id | Nama | Harga | Berat |
|---|---|---|---|
| `shirt` | T-Shirt | Rp 308.000 | 240g |
| `socks` | Socks | Rp 159.000 | 98g |
| `totebag` | Tote Bag | Rp 98.000 | 167g |
| `gift-card` | Gift Card | Rp 20.000 | 20g |

**Migration/Seed**: Tidak ada. Tidak menggunakan Prisma/Supabase/Sequelize.

---

## External Integrations

| Service | Kegunaan | Dipanggil oleh |
|---|---|---|
| **Midtrans Snap** | Payment gateway (sandbox) | `backend/index.js` (token) + `utils/midtrans-service.ts` (popup) |
| **Google Sheets API v4** | Penyimpanan data order | `backend/index.js` → `logOrderToSheets`, `getOrderFromSheets`, `updateOrderStatus` |
| **Resend** | Kirim email konfirmasi (customer + pabrik) | `backend/index.js` → `sendOrderEmails` |
| **Fonnte (WhatsApp)** | Notifikasi resi ke customer via WA | `backend/index.js` → `sendWAResi` |
| **Pixabay API** | Pencarian gambar desain stok | `app/api/pixabay/route.ts` (proxy) + `components/customizer/DesignPicker.tsx` |
| **Binderbyte API** | Data wilayah Indonesia + kalkulasi ongkir | `components/checkouts/WilayahSelect.tsx` + `components/checkouts/ShippingMethod.tsx` |
| **@imgly/background-removal** | Hapus background foto (client-side AI) | `hooks/useFaceSegmentation.ts` + `components/customizer/PhotoUploadSection.tsx` |
| **MediaPipe Selfie Segmentation** | Segmentasi wajah (AI, devDependency) | `hooks/useFaceSegmentation.ts` |
| **Remove.bg API** | Hapus background via API (deprecated) | `app/api/remove-bg/route.ts` |

---

## Risks / Blind Spots

1. **`MIDTRANS_SERVER_KEY` ada di `.env.local` frontend** — server key tidak seharusnya di-expose ke client bundle. Hanya `NEXT_PUBLIC_*` yang aman; non-prefixed tidak bocor ke client, tetapi sebaiknya dipindah sepenuhnya ke `backend/.env` saja.

2. **`app/api/pixabay-image/` dan `app/api/remove-bg/`** — isi `route.ts` belum dibaca; fungsi pasti belum terkonfirmasi. Diasumsikan proxy gambar dan proxy remove-bg berdasarkan nama folder.

3. **`cart.ts` di root proyek** — file ini keberadaannya di root (bukan `utils/` atau `types/`) mencurigakan; kemungkinan draft/legacy yang belum dihapus.

4. **`constants/mck.ts`** (9KB) dan **`constants/mockup copy.ts`** — file `mck.ts` tidak dibaca penuh; `mockup copy.ts` kemungkinan duplikat lama dari `mockup.ts`. Perlu audit.

5. **`components/customizer/ProductSidebarNew.tsx`** — ada dua versi sidebar (`ProductSidebar` + `ProductSidebarNew`); yang dipakai di `Customizer.tsx` adalah versi lama. Versi baru kemungkinan WIP.

6. **Backend tidak ada autentikasi** — endpoint `/api/midtrans/create-token` dan `/api/notify-resi` tidak diproteksi; siapapun bisa memanggil untuk membuat transaksi Midtrans.

7. **Tidak ada middleware autentikasi Next.js** — tidak ada `middleware.ts`; seluruh halaman bersifat publik.

8. **`backend/data/happify-service-account.json`** — file credential Google tidak boleh di-commit ke repo. Pastikan ada di `.gitignore` backend.

9. **`NEXT_PUBLIC_API_URL=http://localhost:3001`** — frontend hardcode ke localhost; perlu diubah ke URL production saat deploy.

10. **`FONNTE_TOKEN=xxxxxxxxxxxxxxxxxxxx`** — token placeholder di `backend/.env`; integrasi WhatsApp belum terkonfigurasi.

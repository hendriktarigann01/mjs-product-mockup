# SYSTEM_MAP — Happify Indonesia (mjs-product-mockup)

> Dibuat: 2026-04-23 | Bahasa: Indonesia

---

## Project Summary

**Tujuan Aplikasi**
Platform e-commerce kustomisasi produk (kaos, kaos kaki, tote bag, gift card) dengan fitur desain interaktif berbasis canvas, pembayaran online via Midtrans Snap, dan manajemen pesanan via Google Sheets + notifikasi email/WhatsApp.

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
| Data Store | Google Sheets API v4 (via googleapis ^171.4.0) |
| Notif WA | Fonnte API |
| Desain Stok | Pixabay API (proxy via Next.js route) |
| Ongkir | Binderbyte API |

**Pola Arsitektur**
- **App Router** (Next.js) — semua halaman di `app/`
- **Client Components** (`"use client"`) untuk semua halaman interaktif (cart, checkout, order pages)
- **Tidak ada Server Actions** — checkout memanggil Express backend eksternal (`localhost:3001`)
- **Storage State**: Cart disimpan di `localStorage` (`happify_cart`); order sementara di `currentOrder`
- **Backend Terpisah**: `backend/index.js` — Express server mandiri (bukan Next.js API routes) yang mengurus Midtrans, Google Sheets, Resend, Fonnte

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
  └─> CartEmptyState.tsx / TrustBadges.tsx
```

### Flow 3 — Checkout & Pembayaran (FLOW UTAMA)
```
app/checkouts/page.tsx [CheckoutPage]
  ├─> useCheckoutForm.ts         [state form: email, nama, alamat, wilayah, shipping]
  ├─> WilayahSelect.tsx          [provinsi → kabupaten → kecamatan via Binderbyte API]
  ├─> ShippingMethod.tsx         [kalkulasi ongkir via Binderbyte API]
  ├─> getCart() / getCartTotal() [utils/cart-service.ts]
  ├─> initMidtrans(clientKey)    [utils/midtrans-service.ts → inject snap.js]
  └─> handleCheckout()
        ├─> createTransactionToken(paymentData)
        │     └─> POST http://localhost:3001/api/midtrans/create-token
        │           ├─> snap.createTransaction(payload)   [Midtrans SDK]
        │           ├─> logOrderToSheets(orderData)       [Google Sheets API]
        │           └─> sendOrderEmails(order, pdfBase64) [Resend → customer + pabrik]
        ├─> openMidtransPayment(snapToken)  [window.snap.pay()]
        └─> localStorage "currentOrder" disimpan
```

### Flow 4 — Notifikasi Setelah Pembayaran
```
Midtrans Webhook → POST /api/midtrans/callback (backend)
  └─> updateOrderStatus(orderId) [update Google Sheets]

Midtrans redirect → app/order-success/page.tsx
  └─> clearCart() + tampilkan ringkasan dari localStorage

Admin input resi di Google Sheets
  └─> Google Apps Script → POST /api/notify-resi (backend)
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
│   │   └── page.tsx
│   ├── checkouts/
│   │   └── page.tsx
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
│       │   └── route.ts            ← (diduga proxy gambar Pixabay)
│       └── remove-bg/
│           └── route.ts            ← (diduga proxy remove background)
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
│   │   └── TrustBadges.tsx
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
├── config.js                 ← Inisialisasi Snap, Google Auth, Resend, env vars
├── routes/
│   ├── midtrans.js           ← POST /api/midtrans/create-token + /callback
│   └── notify.js             ← POST /api/notify-resi + GET /api/orders/:orderId
├── services/
│   ├── sheets.js             ← logOrderToSheets, getOrderFromSheets, updateOrderStatus
│   ├── email.js              ← sendOrderEmails (Resend)
│   └── whatsapp.js           ← sendWAResi (Fonnte)
└── templates/
    ├── emailCustomer.js      ← HTML template email konfirmasi customer
    └── emailPabrik.js        ← HTML template email order untuk pabrik
```

| Endpoint | Method | Handler | Peran |
|---|---|---|---|
| `/api/midtrans/create-token` | `POST` | `routes/midtrans.js` | Buat Midtrans Snap token + log ke Sheets + kirim email |
| `/api/midtrans/callback` | `POST` | `routes/midtrans.js` | Webhook Midtrans — update status order di Sheets |
| `/api/notify-resi` | `POST` | `routes/notify.js` | Kirim notif WhatsApp resi via Fonnte (dipanggil Google Apps Script) |
| `/api/orders/:orderId` | `GET` | `routes/notify.js` | Ambil data order dari Google Sheets |
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
| `REMOVE_BG_API_KEY` | API key Remove.bg (deprecated) |
| `KIRIMIN_AJA_API_URL` | URL KiriminAja (deprecated) |

**Backend** (`backend/.env`):
| Variable | Keterangan |
|---|---|
| `PORT` | Port Express server (default 3001) |
| `APP_URL` | URL frontend untuk Midtrans redirect callbacks |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans |
| `MIDTRANS_CLIENT_KEY` | Client key Midtrans |
| `GOOGLE_SHEETS_ID` | ID spreadsheet Google Sheets |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Path ke file service account JSON |
| `RESEND_API_KEY` | API key Resend (email) |
| `EMAIL_FROM` | Alamat pengirim email |
| `EMAIL_PABRIK` | Email penerima order (pabrik/produksi) |
| `FONNTE_TOKEN` | Token Fonnte (WhatsApp) |

### Skema Data

**Tidak ada database relasional / ORM.** Semua persistensi data menggunakan:

1. **localStorage (browser)**:
   - `happify_cart` → `CartItemWithCustomization[]` (keranjang belanja)
   - `currentOrder` → data order sementara untuk halaman order-success

2. **Google Sheets** (sheet `Orders`, kolom A–O):

| Kolom | Field |
|---|---|
| A | Tanggal |
| B | No Order |
| C | Nama Pembeli |
| D | Payment Method |
| E | Total Harga (tanpa ongkir) |
| F | Ongkir |
| G | Email |
| H | Nomor Telp |
| I | Alamat |
| J | Kode Pos |
| K | Jabodetabek (Yes/No) |
| L | Jawa-Bali (Yes/No) |
| M | Tanggal Kirim ← admin isi |
| N | Resi ← admin isi (trigger WA) |
| O | Ekspedisi |

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

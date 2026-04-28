# Fix Email Observability & PDF Timeout

- [x] Create TODO.md
- [x] Increase PDF timeout in `app/checkouts/page.tsx` (8000ms → 15000ms)
- [x] Clean redundant log in `utils/generate-pdf.ts`
- [x] Add Resend response/error logging in `backend/services/email.js`
- [x] Add PDF presence logging in `backend/routes/midtrans.js` webhook

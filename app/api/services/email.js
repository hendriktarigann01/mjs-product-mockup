// Tujuan      : Kirim email konfirmasi order via Resend
// Caller      : backend/routes/midtrans.js (callback webhook)
// Dependensi  : resend (config), templates/emailCustomer, templates/emailPabrik
// Main Exports: sendOrderEmails, sendOrderEmailCustomerOnly
// Side Effects: HTTP call ke Resend API

const { resend, EMAIL_FROM, EMAIL_PABRIK } = require("../config");
const { emailCustomerConfirmation } = require("../templates/emailCustomer");
const { emailPabrik } = require("../templates/emailPabrik");

const formatRp = (n) => `Rp ${Number(n).toLocaleString("id-ID")},00`;

async function sendOrderEmails(order, canvasPdfBase64) {
  // ── Email 1: Customer Confirmation
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.email,
      subject: `Order Confirmed – ${order.orderId}`,
      html: emailCustomerConfirmation(order, formatRp),
    });
    if (error) {
      console.error(`❌ Email 1 failed to ${order.email}:`, error);
    } else {
      console.log(
        `✅ Email 1 sent to customer: ${order.email} | id=${data?.id}`,
      );
    }
  } catch (err) {
    console.error(`❌ Email 1 exception to ${order.email}:`, err.message);
  }

  // ── Email 2: Pabrik (dengan PDF canvas jika ada)
  const pabrikMail = {
    from: EMAIL_FROM,
    to: EMAIL_PABRIK,
    subject: `New Order – ${order.orderId} | ${order.customerName}`,
    html: emailPabrik(order, formatRp),
  };

  if (canvasPdfBase64) {
    pabrikMail.attachments = [
      {
        filename: `order-${order.orderId}.pdf`,
        content: canvasPdfBase64, // base64 string
      },
    ];
  }

  try {
    const { data, error } = await resend.emails.send(pabrikMail);
    if (error) {
      console.error(`❌ Email 2 failed to ${EMAIL_PABRIK}:`, error);
    } else {
      console.log(
        `✅ Email 2 sent to pabrik: ${EMAIL_PABRIK} | id=${data?.id} | pdf=${!!canvasPdfBase64}`,
      );
    }
  } catch (err) {
    console.error(`❌ Email 2 exception to ${EMAIL_PABRIK}:`, err.message);
  }
}

/**
 * Kirim hanya email konfirmasi ke customer (pabrik email di-hold).
 * Dipakai sementara selama fitur PDF ke pabrik diganti Cloudinary PNG.
 */
async function sendOrderEmailCustomerOnly(order) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.email,
      subject: `Order Confirmed – ${order.orderId}`,
      html: emailCustomerConfirmation(order, formatRp),
    });
    if (error) {
      console.error(`❌ Email customer failed to ${order.email}:`, error);
    } else {
      console.log(`✅ Email customer sent: ${order.email} | id=${data?.id}`);
    }
  } catch (err) {
    console.error(`❌ Email customer exception to ${order.email}:`, err.message);
  }
  console.log(`[⏸ HOLD] Email pabrik ditunda — Cloudinary PNG flow belum aktif`);
}

module.exports = { sendOrderEmails, sendOrderEmailCustomerOnly };

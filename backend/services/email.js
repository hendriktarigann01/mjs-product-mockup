const { resend, EMAIL_FROM, EMAIL_PABRIK } = require("../config");
const { emailCustomerConfirmation } = require("../templates/emailCustomer");
const { emailPabrik } = require("../templates/emailPabrik");

const formatRp = (n) => `Rp ${Number(n).toLocaleString("id-ID")},00`;

async function sendOrderEmails(order, canvasPdfBase64) {
  // ── Email 1: Customer Confirmation
  await resend.emails.send({
    from: EMAIL_FROM,
    to: order.email,
    subject: `Order Confirmed – ${order.orderId}`,
    html: emailCustomerConfirmation(order, formatRp),
  });
  console.log(`Email 1 sent to customer: ${order.email}`);

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

  await resend.emails.send(pabrikMail);
  console.log(`Email 2 sent to pabrik: ${EMAIL_PABRIK}`);
}

module.exports = { sendOrderEmails };

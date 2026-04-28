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

module.exports = { sendOrderEmails };

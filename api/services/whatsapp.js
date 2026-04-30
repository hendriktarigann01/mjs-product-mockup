const { FONNTE_TOKEN } = require("../config");

async function sendWAResi({ phone, customerName, orderId, resi, ekspedisi }) {
  const message =
    `Halo *${customerName}*! 👋\n\n` +
    `Pesanan kamu *${orderId}* sudah dikirim! 🚀\n\n` +
    `📦 Ekspedisi: *${ekspedisi}*\n` +
    `🔢 No. Resi: *${resi}*\n\n` +
    `Kamu bisa lacak paketmu di website ${ekspedisi.toLowerCase()}.com\n\n` +
    `Terima kasih sudah belanja di Happify! 🎉`;

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: FONNTE_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target: phone,
      message,
      countryCode: "62",
    }),
  });

  const result = await response.json();
  console.log(`📱 WA sent to ${phone}:`, result);
  return result;
}

module.exports = { sendWAResi };

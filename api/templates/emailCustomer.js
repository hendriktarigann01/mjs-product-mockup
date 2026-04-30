function emailCustomerConfirmation(order, formatRp) {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece6;font-family:monospace;color:#555;font-size:13px">${item.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece6;text-align:center;color:#555;font-size:13px">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece6;text-align:right;font-family:monospace;color:#333;font-size:13px">${formatRp(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body style="margin:0;padding:0;background:#F5F2ED;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2ED;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <tr>
            <td style="background:#f5f2ed;padding:36px 40px;text-align:center">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <h1 style="margin:12px 0 0;font-size:28px;color:#000;font-weight:normal">
                    Order Confirmed!
                  </h1>
                </div>

                <div>
                  <img src="https://res.cloudinary.com/duoqao4ay/image/upload/v1777001745/happify-text_ieoksq.webp"
                    alt="Happify Logo" style="height:60px;display:block;">
                </div>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px">

              <p
                style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:2px">
                Order ID</p>
              <p
                style="margin:0 0 32px;font-size:15px;font-family:monospace;color:#1c1917;background:#f5f2ed;padding:12px 16px;border-radius:4px;word-break:break-all">
                ${order.orderId}</p>

              <p style="margin:0 0 4px;color:#555;font-size:14px">Hi <strong>${order.customerName}</strong>,</p>
              <p style="margin:0 0 32px;color:#777;font-size:14px;line-height:1.6">
                Terima kasih sudah berbelanja di Happify! Pesanan kamu sudah kami terima dan sedang diproses. Kami akan
                mengirimkan notifikasi ketika pesanan dikirim.
              </p>

              <!-- Items table -->
              <p
                style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:3px;color:#a8a29e;text-transform:uppercase">
                Items</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th
                    style="text-align:left;font-family:monospace;font-size:10px;color:#a8a29e;padding-bottom:8px;border-bottom:2px solid #f0ece6">
                    Produk</th>
                  <th
                    style="text-align:center;font-family:monospace;font-size:10px;color:#a8a29e;padding-bottom:8px;border-bottom:2px solid #f0ece6">
                    Qty</th>
                  <th
                    style="text-align:right;font-family:monospace;font-size:10px;color:#a8a29e;padding-bottom:8px;border-bottom:2px solid #f0ece6">
                    Harga</th>
                </tr>
                ${itemRows}
                <!-- Ongkir -->
                <tr>
                  <td colspan="2"
                    style="padding:10px 0 4px;font-family:monospace;font-size:12px;color:#888;text-align:right">Ongkir
                    (${order.shippingName})</td>
                  <td style="padding:10px 0 4px;text-align:right;font-family:monospace;font-size:12px;color:#888">
                    ${formatRp(order.ongkir)}</td>
                </tr>
                <!-- Total -->
                <tr>
                  <td colspan="2"
                    style="padding:12px 0 0;font-family:monospace;font-size:14px;font-weight:bold;color:#1c1917;text-align:right;border-top:2px solid #1c1917">
                    Total</td>
                  <td
                    style="padding:12px 0 0;text-align:right;font-family:monospace;font-size:18px;font-weight:bold;color:#1c1917;border-top:2px solid #1c1917">
                    ${formatRp(order.grossAmount)}</td>
                </tr>
              </table>

              <!-- Shipping info -->
              <div style="margin:32px 0 0;padding:20px;background:#f5f2ed;border-radius:6px">
                <p
                  style="margin:0 0 12px;font-family:monospace;font-size:10px;letter-spacing:3px;color:#a8a29e;text-transform:uppercase">
                  Dikirim ke</p>
                <p style="margin:0;font-size:14px;color:#333;line-height:1.7">
                  ${order.address}<br>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f2ed;padding:24px 40px;text-align:center">
              <p style="margin:0;font-family:monospace;font-size:11px;color:#a8a29e">Butuh bantuan? Email kami di <a
                  href="mailto:support@happify.id" style="color:#1c1917">support@happify.id</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>

</html>`;
}

module.exports = { emailCustomerConfirmation };


function emailPabrik(order, formatRp) {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-size:13px">${item.name}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-size:13px">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-size:13px;font-family:monospace">${formatRp(item.price)}</td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>

<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">

  <div style="box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:#f5f2ed;padding:20px;border-radius:4px 4px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <!-- Left: Text -->
          <td style="text-align:left;">
            <h2 style="margin:0;font-size:18px;color:#000;">
              New Order – ${order.orderId}
            </h2>
            <p style="margin:4px 0 0;font-size:12px;color:#a8a29e;">
              ${new Date().toLocaleString("id-ID")}
            </p>
          </td>

          <!-- Right: Logo -->
          <td style="text-align:right;">
            <img src="https://res.cloudinary.com/duoqao4ay/image/upload/v1777001745/happify-text_ieoksq.webp"
              alt="Happify" style="height:60px;display:block;margin-left:auto;" />
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:24px;border-radius:0 0 4px 4px">
      <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888">Customer</h3>
      <table cellpadding="4" cellspacing="0" style="font-size:13px;margin-bottom:24px">
        <tr>
          <td style="color:#888;width:120px">Nama</td>
          <td><strong>${order.customerName}</strong></td>
        </tr>
        <tr>
          <td style="color:#888">Email</td>
          <td>${order.email}</td>
        </tr>
        <tr>
          <td style="color:#888">Telp</td>
          <td>${order.phone}</td>
        </tr>
        <tr>
          <td style="color:#888">Alamat</td>
          <td>${order.address}, ${order.zip}</td>
        </tr>
        <tr>
          <td style="color:#888">Ekspedisi</td>
          <td><strong>${order.shippingName}</strong></td>
        </tr>
      </table>

      <h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#888">Items</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
        <tr style="background:#f5f5f5">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;font-size:12px">Produk</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center;font-size:12px">Qty</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right;font-size:12px">Harga</th>
        </tr>
        ${itemRows}
      </table>

      <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px">
        <tr>
          <td style="color:#888;text-align:right">Ongkir (${order.shippingName})</td>
          <td style="text-align:right;width:140px;font-family:monospace">${formatRp(order.ongkir)}</td>
        </tr>
        <tr style="border-top:2px solid #333">
          <td style="text-align:right;font-weight:bold;font-size:15px;padding-top:8px">Total</td>
          <td style="text-align:right;font-weight:bold;font-size:15px;padding-top:8px;font-family:monospace">
            ${formatRp(order.grossAmount)}</td>
        </tr>
      </table>

      ${order.items.length ? `<p
        style="margin:24px 0 0;font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px">Detail desain
        terlampir dalam file PDF.</p>` : ""}

    </div>
  </div>

</body>

</html>`;
}

module.exports = { emailPabrik };

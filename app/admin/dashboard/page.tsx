"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AdminOrder = {
  dbId: number;
  orderId: string;
  namaPembeli: string;
  totalHarga: number;
  ongkir: number;
  email: string;
  phone: string;
  address: string;
  zip: string;
  jabodetabek: string;
  jawaBali: string;
  tanggalKirim: string;
  tracking_number: string;
  shippingName: string;
  createdAt: Date;
  paymentMethod: string;
  status: string;
  cartItems: any[];
  productUrl: string;
  pdfUrl: string;
  regionTag: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const statusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === "shipped" || s === "completed") {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-semibold tracking-wide whitespace-nowrap bg-green-100 text-green-700 border border-green-200">
        {status}
      </span>
    );
  }
  if (s === "paid") {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-semibold tracking-wide whitespace-nowrap bg-blue-100 text-blue-700 border border-blue-200">
        Paid
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-semibold tracking-wide whitespace-nowrap bg-yellow-50 text-yellow-700 border border-yellow-200">
      {status || "Pending"}
    </span>
  );
};

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCards({ orders }: { orders: AdminOrder[] }) {
  const totalRevenue = orders.reduce((s, o) => s + o.totalHarga + o.ongkir, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const paid = orders.filter((o) => o.status === "paid").length;
  const shipped = orders.filter((o) => o.status === "shipped" || o.status === "completed").length;
  const jabodetabek = orders.filter((o) => o.jabodetabek).length;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-7">
      {[
        { label: "Total Order", value: orders.length, cls: "text-[1.75rem] font-bold text-stone-900 leading-none" },
        { label: "Total Revenue", value: rupiah(totalRevenue), cls: "text-[1.3rem] font-bold text-stone-900 leading-none" },
        { label: "Pending", value: pending, cls: "text-[1.75rem] font-bold text-amber-600 leading-none" },
        { label: "Paid", value: paid, cls: "text-[1.75rem] font-bold text-amber-600 leading-none" },
        { label: "Terkirim", value: shipped, cls: "text-[1.75rem] font-bold text-green-600 leading-none" },
      ].map(({ label, value, cls }) => (
        <div key={label} className="bg-[#FAFAF8] border border-[#E7E4DF] rounded-lg px-5 py-[1.1rem]">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-1.5">{label}</p>
          <p className={cls}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [data, setData] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; onConfirm: () => void } | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[] | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersData) {
      const mappedOrders: AdminOrder[] = ordersData.map((o: any) => ({
        dbId: o.id,
        orderId: o.order_id,
        namaPembeli: o.customer_name || "-",
        totalHarga: o.subtotal || 0,
        ongkir: o.shipping_cost || 0,
        email: o.email || "-",
        phone: o.phone || "-",
        address: o.address || "-",
        zip: o.postal_code || "-",
        regionTag: o.region_tag || "",
        jabodetabek: o.region_tag === "jabodetabek" ? "Ya" : "",
        jawaBali: o.region_tag === "jawabali" ? "Ya" : "",
        tanggalKirim: "",
        tracking_number: o.tracking_number || "",
        shippingName: o.shipping_courier || "-",
        createdAt: new Date(o.created_at),
        paymentMethod: o.payment_method || "-",
        status: o.status || "pending",
        cartItems: o.cart_items || [],
        productUrl: o.product_url,
        pdfUrl: o.pdf_url,
      }));
      setData(mappedOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEditClick = (order: AdminOrder) => {
    setEditingOrder(order);
    setEditFormData({
      customer_name: order.namaPembeli !== "-" ? order.namaPembeli : "",
      email: order.email !== "-" ? order.email : "",
      phone: order.phone !== "-" ? order.phone : "",
      address: order.address !== "-" ? order.address : "",
      postal_code: order.zip !== "-" ? order.zip : "",
      shipping_courier: order.shippingName !== "-" ? order.shippingName : "",
      tracking_number: order.tracking_number,
      status: order.status,
      payment_method: order.paymentMethod !== "-" ? order.paymentMethod : "",
      region_tag: order.regionTag,
    });
  };

  const handleSaveEdit = () => {
    if (!editingOrder) return;
    setConfirmModal({
      isOpen: true,
      onConfirm: async () => {
        const isBecomingPaid = editFormData.status === "paid" && editingOrder.status !== "paid";
        const orderId = editingOrder.orderId;

        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from("orders")
            .update({
              customer_name: editFormData.customer_name,
              email: editFormData.email,
              phone: editFormData.phone,
              address: editFormData.address,
              postal_code: editFormData.postal_code,
              shipping_courier: editFormData.shipping_courier,
              tracking_number: editFormData.tracking_number,
              status: editFormData.status,
              payment_method: editFormData.payment_method,
              region_tag: editFormData.region_tag,
            })
            .eq("id", editingOrder.dbId);

          if (error) {
            alert("Gagal menyimpan data: " + error.message);
          } else {
            // Trigger email jika status berubah menjadi PAID (Cashier flow)
            if (isBecomingPaid) {
              console.log("Triggering email for paid order:", orderId);
              fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/orders/${encodeURIComponent(orderId)}/notify-paid`, {
                method: "POST"
              }).catch(e => console.error("Failed to notify paid email", e));
            }

            setEditingOrder(null);
            fetchOrders();
          }
        } catch (e: any) {
          alert("Error: " + e.message);
        }
      },
    });
  };

  const columns = useMemo<ColumnDef<AdminOrder>[]>(() => [
    {
      id: "action",
      header: "Aksi",
      cell: (info) => (
        <button
          onClick={() => handleEditClick(info.row.original)}
          className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100 transition-colors"
        >
          Edit
        </button>
      ),
    },
    {
      id: "col-a",
      header: "Tanggal",
      accessorFn: (row) => row.createdAt.toLocaleDateString("id-ID"),
      cell: (info) => <span className="text-stone-500">{info.getValue<string>()}</span>,
    },
    {
      id: "col-b",
      header: "No Order",
      accessorKey: "orderId",
      cell: (info) => <span className="font-mono text-[0.72rem] tracking-wide">{info.getValue<string>()}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (info) => statusBadge(info.getValue<string>()),
    },
    {
      id: "col-c",
      header: "Nama Pembeli",
      accessorKey: "namaPembeli",
      cell: (info) => <span className="font-semibold">{info.getValue<string>()}</span>,
    },
    {
      id: "items",
      header: "Items",
      accessorKey: "cartItems",
      cell: (info) => {
        const items = info.getValue<any[]>();
        if (!items || !items.length) return <span className="text-stone-400">-</span>;
        return (
          <button
            onClick={() => setSelectedItems(items)}
            className="text-blue-500 hover:underline text-[0.65rem] text-left"
          >
            Lihat ({items.length})
          </button>
        );
      },
    },
    {
      id: "photo",
      header: "Photo",
      accessorKey: "productUrl",
      cell: (info) => {
        const url = info.getValue<string>();
        if (!url) return <span className="text-stone-400">-</span>;

        const urls = url.split(",").filter(Boolean);
        return (
          <button
            onClick={() => setSelectedPhotos(urls)}
            className="text-blue-500 hover:underline text-[0.65rem] text-left"
          >
            Lihat ({urls.length})
          </button>
        );
      },
    },
    {
      id: "col-d",
      header: "Payment",
      accessorKey: "paymentMethod",
      cell: (info) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-semibold tracking-wide whitespace-nowrap bg-sky-50 text-sky-700 border border-sky-200">
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      id: "col-e",
      header: "Total Harga",
      accessorKey: "totalHarga",
      cell: (info) => <span className="font-mono text-[0.75rem] block text-right">{rupiah(info.getValue<number>())}</span>,
    },
    {
      id: "col-g",
      header: "Email",
      accessorKey: "email",
      cell: (info) => <span className="text-stone-500">{info.getValue<string>()}</span>,
    },
    {
      id: "col-h",
      header: "No Telp",
      accessorKey: "phone",
      cell: (info) => <span className="font-mono text-[0.72rem] tracking-wide">{info.getValue<string>()}</span>,
    },
    {
      id: "col-i",
      header: "Alamat",
      accessorKey: "address",
      cell: (info) => (
        <span className="block max-w-[200px] overflow-hidden text-ellipsis text-stone-600 text-[0.75rem]" title={info.getValue<string>()}>
          {info.getValue<string>() || "–"}
        </span>
      ),
    },
    {
      id: "col-n",
      header: "Resi",
      accessorKey: "tracking_number",
      cell: (info) =>
        info.getValue<string>() ? (
          <span className="font-mono text-[0.7rem] text-blue-600">{info.getValue<string>()}</span>
        ) : (
          <span className="text-stone-500">–</span>
        ),
    },
    {
      id: "col-o",
      header: "Ekspedisi",
      accessorKey: "shippingName",
      cell: (info) => <span className="text-stone-500">{info.getValue<string>() || "–"}</span>,
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleLogout = () => {
    router.push("/admin");
  };

  return (
    <div
      className="min-h-screen bg-[#F5F2ED] text-stone-900 py-10 px-8"
      style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
    >
      <div className="max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1
              className="text-[2rem] font-bold tracking-tight text-stone-900 leading-[1.1]"

            >
              Order Dashboard
            </h1>
            <p className="text-[0.75rem] text-stone-500 mt-1 tracking-[0.05em] uppercase">
              Happify · Data Penjualan
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-[0.75rem] font-semibold tracking-wide uppercase border border-stone-300 rounded-lg text-stone-600 bg-[#FAFAF8] hover:bg-[#F0EDE8] hover:border-stone-400 hover:text-stone-900 transition-all duration-150 cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* ── Summary ── */}
        {loading ? (
          <div className="mb-7 text-stone-500 animate-pulse">Loading data...</div>
        ) : (
          <SummaryCards orders={data} />
        )}

        {/* ── Toolbar ── */}
        <div className="flex items-center flex-wrap gap-3 mb-4">
          <input
            className="flex-1 min-w-[200px] max-w-[360px] border border-[#D6D3CD] bg-[#FAFAF8] rounded-md px-3.5 py-2 text-[0.8rem] text-stone-900 outline-none transition-colors duration-150 focus:border-stone-500 placeholder:text-stone-400"
            placeholder="Cari nama, order ID, email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          <span className="text-[0.7rem] text-stone-500 tracking-[0.04em] uppercase whitespace-nowrap">
            {table.getFilteredRowModel().rows.length} order
          </span>
          <select
            className="border border-[#D6D3CD] bg-[#FAFAF8] rounded-md text-[0.75rem] text-stone-900 px-2 py-1.5 outline-none cursor-pointer"
            style={{ fontFamily: "inherit" }}
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / halaman
              </option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        <div className="bg-[#FAFAF8] border border-[#E7E4DF] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full border-collapse text-[0.78rem] whitespace-nowrap">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-[#F0EDE8] border-b border-[#E7E4DF]">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-4 py-[0.65rem] text-left text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-stone-600 cursor-pointer select-none whitespace-nowrap hover:text-stone-900 transition-colors duration-100"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="inline-block ml-1 opacity-40 text-[0.6rem]">
                          {header.column.getIsSorted() === "asc"
                            ? "▲"
                            : header.column.getIsSorted() === "desc"
                              ? "▼"
                              : "⇅"}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8 text-stone-500">
                      Tidak ada data.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#F0EDE8] last:border-b-0 hover:bg-[#F5F2ED] transition-colors duration-100"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-[0.7rem] text-stone-900 max-w-[220px] overflow-hidden text-ellipsis"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-t border-[#E7E4DF]">
            <span className="text-[0.72rem] text-stone-500">
              Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { label: "«", action: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
                  { label: "‹", action: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
                ] as const
              ).map(({ label, action, disabled }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={disabled}
                  className="min-w-[30px] h-[30px] border border-[#D6D3CD] bg-[#FAFAF8] rounded-[5px] text-[0.75rem] text-stone-900 flex items-center justify-center px-2 cursor-pointer transition-all duration-100 hover:enabled:bg-[#F0EDE8] hover:enabled:border-stone-400 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}

              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`min-w-[30px] h-[30px] border rounded-[5px] text-[0.75rem] flex items-center justify-center px-2 cursor-pointer transition-all duration-100 ${table.getState().pagination.pageIndex === i
                    ? "bg-stone-900 text-[#F5F2ED] border-stone-900"
                    : "border-[#D6D3CD] bg-[#FAFAF8] text-stone-900 hover:bg-[#F0EDE8] hover:border-stone-400"
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              {(
                [
                  { label: "›", action: () => table.nextPage(), disabled: !table.getCanNextPage() },
                  { label: "»", action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
                ] as const
              ).map(({ label, action, disabled }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={disabled}
                  className="min-w-[30px] h-[30px] border border-[#D6D3CD] bg-[#FAFAF8] rounded-[5px] text-[0.75rem] text-stone-900 flex items-center justify-center px-2 cursor-pointer transition-all duration-100 hover:enabled:bg-[#F0EDE8] hover:enabled:border-stone-400 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] w-full max-w-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-stone-800 mb-6 border-b pb-4">
              Edit Order {editingOrder.orderId}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Nama Pembeli</label>
                <input
                  value={editFormData.customer_name}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Email</label>
                <input
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">No Telp</label>
                <input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Metode Pembayaran</label>
                <input
                  value={editFormData.payment_method}
                  onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-500 mb-1">Alamat Lengkap</label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Kode Pos</label>
                <input
                  value={editFormData.postal_code}
                  onChange={(e) => setEditFormData({ ...editFormData, postal_code: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Region Tag (ex: jabodetabek)</label>
                <input
                  value={editFormData.region_tag}
                  onChange={(e) => setEditFormData({ ...editFormData, region_tag: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Ekspedisi</label>
                <input
                  value={editFormData.shipping_courier}
                  onChange={(e) => setEditFormData({ ...editFormData, shipping_courier: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">No Resi</label>
                <input
                  value={editFormData.tracking_number}
                  onChange={(e) => setEditFormData({ ...editFormData, tracking_number: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Masukkan No Resi"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-500 mb-1">Status Pesanan</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="pending_cashier">Pending Cashier</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped (Terkirim)</option>
                  <option value="completed">Completed (Selesai)</option>
                  <option value="cancelled">Cancelled (Batal)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-4 border-t">
              <button
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] w-full max-sm p-6 text-center shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Konfirmasi Simpan</h3>
            <p className="text-sm text-stone-500 mb-6">Apakah Anda yakin ingin menyimpan perubahan data pesanan ini?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-stone-600 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Items Popup Modal ── */}
      {selectedItems && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedItems(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItems(null)}
              className="absolute -top-12 right-0 text-white flex items-center gap-2 hover:text-stone-300 transition-colors"
            >
              <span className="text-sm font-semibold">Tutup</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                ✕
              </div>
            </button>

            <h3 className="text-xl font-bold text-stone-800 mb-6 border-b pb-4">
              Order Items ({selectedItems.length})
            </h3>

            <div className="max-h-[60vh] overflow-y-auto pr-2 no-scrollbar space-y-4">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-stone-100 bg-stone-50/50">
                  <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 border border-stone-200 p-1">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-stone-800 text-sm">{item.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">Qty: {item.quantity} · {item.color || "Default"}</p>
                      </div>
                      <span className="text-sm font-mono font-bold text-stone-700">
                        {rupiah(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.customization && (
                      <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap gap-2">
                        {item.customization.size && (
                          <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[10px] font-bold uppercase">Size: {item.customization.size}</span>
                        )}
                        {item.customization.giftCardUrl && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Gift Card</span>
                        )}
                        {item.customization.designImageUrl && (
                          <a href={item.customization.designImageUrl} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase hover:bg-blue-200">View Design</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t flex justify-between items-center">
              <div className="text-stone-500 text-xs font-mono">
                Total Item: {selectedItems.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <button
                onClick={() => setSelectedItems(null)}
                className="px-8 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Popup Modal ── */}
      {selectedPhotos && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhotos(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhotos(null)}
              className="absolute -top-12 right-0 text-white flex items-center gap-2 hover:text-stone-300 transition-colors"
            >
              <span className="text-sm font-semibold">Tutup</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                ✕
              </div>
            </button>

            <h3 className="text-xl font-bold text-stone-800 mb-6 border-b pb-4">
              Customer Photos ({selectedPhotos.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
              {selectedPhotos.map((url, idx) => (
                <div key={idx} className="group relative aspect-square bg-stone-100 rounded-xl overflow-hidden border border-stone-200 shadow-sm transition-transform hover:scale-[1.02]">
                  <img
                    src={url}
                    alt={`Customer photo ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-stone-600 shadow-sm">
                    PHOTO {idx + 1}
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Buka original"
                  >
                    ↗
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setSelectedPhotos(null)}
                className="px-10 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg"
              >
                Tutup Galeri
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
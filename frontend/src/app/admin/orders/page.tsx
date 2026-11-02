"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type CustomerOrder,
  type OrderStatus,
  getOrders,
  updateOrderStatus,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";

import { useLanguage } from "@/app/components/LanguageProvider";
import AdminPageLayout from "../../components/AdminPageLayout";

const statuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CONNECTED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const t = {
    title: isBn ? "কাস্টমার অর্ডার" : "Customer Orders",
    subtitle: isBn
      ? "সব কাস্টমার অর্ডার দেখুন এবং স্ট্যাটাস পরিবর্তন করুন।"
      : "View customer orders and update their statuses.",
    total: isBn ? "মোট অর্ডার" : "Total Orders",
    pending: isBn ? "অপেক্ষমাণ" : "Pending",
    confirmed: isBn ? "নিশ্চিত" : "Confirmed",
    connected: isBn ? "সংযোগ সম্পন্ন" : "Connected",
    customer: isBn ? "কাস্টমার" : "Customer",
    contact: isBn ? "যোগাযোগ" : "Contact",
    location: isBn ? "ঠিকানা" : "Address",
    package: isBn ? "প্যাকেজ" : "Package",
    price: isBn ? "মাসিক মূল্য" : "Monthly Price",
    status: isBn ? "স্ট্যাটাস" : "Status",
    action: isBn ? "স্ট্যাটাস পরিবর্তন" : "Update Status",
    loading: isBn ? "লোড হচ্ছে..." : "Loading...",
    empty: isBn ? "কোনো অর্ডার পাওয়া যায়নি।" : "No orders found.",
    error: isBn ? "অর্ডার লোড করা যায়নি।" : "Failed to load orders.",
    updateError: isBn
      ? "স্ট্যাটাস পরিবর্তন করা যায়নি।"
      : "Failed to update status.",
    search: isBn
      ? "কাস্টমার, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
      : "Search customer, phone or address...",
    found: isBn ? "টি অর্ডার পাওয়া গেছে" : "orders found",
    updating: isBn ? "আপডেট হচ্ছে..." : "Updating...",
  };

  async function loadOrders(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser || storedUser.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        await loadOrders();
      } catch {
        logout();
        router.replace("/login");
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    try {
      setUpdatingId(orderId);
      setError("");

      await updateOrderStatus(orderId, newStatus);

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.updateError);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) =>
      [
        order.customer_name,
        order.phone,
        order.city,
        order.area,
        order.address,
        order.package_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [orders, search]);

  function statusLabel(status: OrderStatus) {
    const labels: Record<OrderStatus, string> = {
      PENDING: isBn ? "অপেক্ষমাণ" : "Pending",
      CONFIRMED: isBn ? "নিশ্চিত" : "Confirmed",
      CONNECTED: isBn ? "সংযোগ সম্পন্ন" : "Connected",
      CANCELLED: isBn ? "বাতিল" : "Cancelled",
    };

    return labels[status];
  }

  function statusStyle(status: OrderStatus) {
    const styles: Record<OrderStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      CONNECTED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };

    return styles[status];
  }

  const stats = [
    {
      label: t.total,
      value: orders.length,
      color: "text-gray-900",
      bg: "bg-white",
    },
    {
      label: t.pending,
      value: orders.filter((o) => o.status === "PENDING").length,
      color: "text-yellow-700",
      bg: "bg-white",
    },
    {
      label: t.confirmed,
      value: orders.filter((o) => o.status === "CONFIRMED").length,
      color: "text-blue-700",
      bg: "bg-white",
    },
    {
      label: t.connected,
      value: orders.filter((o) => o.status === "CONNECTED").length,
      color: "text-green-700",
      bg: "bg-white",
    },
  ];

  return (
    <AdminPageLayout
      title={t.title}
      subtitle={t.subtitle}
      isBn={isBn}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => loadOrders(false)}
      onLogout={() => {
        logout();
        router.replace("/login");
      }}
      error={error}
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t.search}
      totalCount={filteredOrders.length}
      foundText={t.found}
    >
      {loading ? (
        <div className="rounded-xl border border-[#ebd69b] bg-white p-12 text-center text-[#756b58]">
          {t.loading}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-[#ebd69b] bg-white p-8 text-center text-sm text-[#756b58] sm:p-12">
          {t.empty}
        </div>
      ) : (
        <>
          {/* Mobile Order Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="min-w-0 overflow-hidden rounded-xl border border-[#ebd69b] bg-white p-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[#f0e5c8] pb-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-[#292319]">
                      {order.customer_name}
                    </h3>
                    <p className="mt-1 break-all text-sm text-[#756b58]">
                      {order.phone}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[#756b58]">{t.package}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#292319]">
                      {order.package_name}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-[#756b58]">{t.price}</p>
                    <p className="mt-1 break-words text-sm font-bold text-[#292319]">
                      ৳{Number(order.monthly_price).toLocaleString("en-BD")}
                    </p>
                  </div>

                  <div className="col-span-2 min-w-0">
                    <p className="text-xs text-[#756b58]">{t.location}</p>
                    <p className="mt-1 break-words text-sm text-[#292319]">
                      {order.city}, {order.area}
                    </p>
                    <p className="mt-1 break-words text-xs text-[#756b58]">
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#f0e5c8] pt-3">
                  <label className="mb-2 block text-xs font-semibold text-[#756b58]">
                    {t.action}
                  </label>

                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) =>
                      handleStatusChange(
                        order.id,
                        e.target.value as OrderStatus,
                      )
                    }
                    className="w-full rounded-lg border border-[#ebd69b] bg-white px-3 py-2.5 text-sm text-[#292319] outline-none focus:border-[#e19112] disabled:opacity-50"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>

                  {updatingId === order.id && (
                    <p className="mt-2 text-xs text-[#756b58]">{t.updating}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Orders Table */}
          <div className="hidden overflow-hidden rounded-xl border border-[#ebd69b] bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-[#fff3cf] text-[#292319]">
                  <tr>
                    <th className="px-5 py-4">{t.customer}</th>
                    <th className="px-5 py-4">{t.contact}</th>
                    <th className="px-5 py-4">{t.location}</th>
                    <th className="px-5 py-4">{t.package}</th>
                    <th className="px-5 py-4">{t.price}</th>
                    <th className="px-5 py-4">{t.status}</th>
                    <th className="px-5 py-4">{t.action}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e5c8]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        {order.customer_name}
                      </td>

                      <td className="px-5 py-4 text-[#756b58]">
                        {order.phone}
                      </td>

                      <td className="max-w-[240px] px-5 py-4 text-[#756b58]">
                        <p>
                          {order.city}, {order.area}
                        </p>
                        <p className="mt-1 text-xs">{order.address}</p>
                      </td>

                      <td className="px-5 py-4 font-medium text-[#292319]">
                        {order.package_name}
                      </td>

                      <td className="px-5 py-4 text-[#292319]">
                        ৳{Number(order.monthly_price).toLocaleString("en-BD")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className="rounded-lg border border-[#ebd69b] bg-white px-3 py-2 text-sm text-[#292319] disabled:opacity-50"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>

                        {updatingId === order.id && (
                          <p className="mt-1 text-xs text-[#756b58]">
                            {t.updating}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminPageLayout>
  );
}

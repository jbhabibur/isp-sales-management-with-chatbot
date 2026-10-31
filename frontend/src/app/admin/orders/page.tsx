"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CustomerOrder,
  OrderStatus,
  getOrders,
  updateOrderStatus,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

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
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("ALL");

  const t = {
    title: isBn ? "কাস্টমার অর্ডার" : "Customer Orders",
    subtitle: isBn
      ? "সব কাস্টমার অর্ডার দেখুন এবং স্ট্যাটাস পরিবর্তন করুন।"
      : "View customer orders and update their statuses.",
    dashboard: isBn ? "ড্যাশবোর্ড" : "Dashboard",
    total: isBn ? "মোট অর্ডার" : "Total Orders",
    pending: isBn ? "অপেক্ষমাণ" : "Pending",
    confirmed: isBn ? "নিশ্চিত" : "Confirmed",
    connected: isBn ? "সংযোগ সম্পন্ন" : "Connected",
    cancelled: isBn ? "বাতিল" : "Cancelled",
    customer: isBn ? "কাস্টমার" : "Customer",
    contact: isBn ? "যোগাযোগ" : "Contact",
    location: isBn ? "ঠিকানা" : "Address",
    package: isBn ? "প্যাকেজ" : "Package",
    price: isBn ? "মাসিক মূল্য" : "Monthly Price",
    status: isBn ? "স্ট্যাটাস" : "Status",
    action: isBn ? "স্ট্যাটাস পরিবর্তন" : "Update Status",
    all: isBn ? "সব অর্ডার" : "All Orders",
    loading: isBn ? "লোড হচ্ছে..." : "Loading...",
    empty: isBn ? "কোনো অর্ডার পাওয়া যায়নি।" : "No orders found.",
    error: isBn ? "অর্ডার লোড করা যায়নি।" : "Failed to load orders.",
    updateError: isBn
      ? "স্ট্যাটাস পরিবর্তন করা যায়নি।"
      : "Failed to update status.",
    logout: isBn ? "লগআউট" : "Logout",
    refresh: isBn ? "রিফ্রেশ" : "Refresh",
  };

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
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
    if (filter === "ALL") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

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
    { label: t.total, value: orders.length, color: "text-gray-900" },
    {
      label: t.pending,
      value: orders.filter((o) => o.status === "PENDING").length,
      color: "text-yellow-700",
    },
    {
      label: t.confirmed,
      value: orders.filter((o) => o.status === "CONFIRMED").length,
      color: "text-blue-700",
    },
    {
      label: t.connected,
      value: orders.filter((o) => o.status === "CONNECTED").length,
      color: "text-green-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fffcf3]">
      <header className="sticky top-0 z-30 border-b border-[#ebd69b] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/admin/dashboard"
            className="text-xl font-extrabold text-[#292319]"
          >
            Circle <span className="text-[#e9a900]">Network</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-[#ebd69b] px-3 py-2 text-sm font-semibold hover:bg-[#fff3cf]"
            >
              {t.dashboard}
            </Link>

            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg bg-[#292319] px-3 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#292319] sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-sm text-[#756b58]">{t.subtitle}</p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="rounded-lg bg-[#f5b91b] px-5 py-2.5 font-bold text-[#292319] hover:bg-[#e9a900] disabled:opacity-60"
          >
            {loading ? t.loading : t.refresh}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#ebd69b] bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-[#756b58]">{stat.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { value: "ALL", label: t.all },
            { value: "PENDING", label: t.pending },
            { value: "CONFIRMED", label: t.confirmed },
            { value: "CONNECTED", label: t.connected },
            { value: "CANCELLED", label: t.cancelled },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === item.value
                  ? "bg-[#292319] text-white"
                  : "border border-[#ebd69b] bg-white text-[#292319] hover:bg-[#fff3cf]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#ebd69b] bg-white p-12 text-center text-[#756b58]">
            {t.loading}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-[#ebd69b] bg-white p-12 text-center text-[#756b58]">
            {t.empty}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#ebd69b] bg-white shadow-sm">
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
                            {isBn ? "আপডেট হচ্ছে..." : "Updating..."}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

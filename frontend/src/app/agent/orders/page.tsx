"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import AgentPageLayout from "@/app/components/AgentPageLayout";

const statuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CONNECTED",
  "CANCELLED",
];

export default function AgentOrdersPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Load Orders
  const loadOrders = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setSuccess("");

        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isBn
              ? "Order লোড করা যায়নি"
              : "Could not load orders",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isBn],
  );

  // Verify Agent Authentication
  useEffect(() => {
    let active = true;

    async function verifyAgent() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser || storedUser.role !== "SALES_AGENT") {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "SALES_AGENT") {
          logout();
          router.replace("/login");
          return;
        }

        await loadOrders();
      } catch {
        if (active) {
          logout();
          router.replace("/login");
        }
      }
    }

    verifyAgent();

    return () => {
      active = false;
    };
  }, [router, loadOrders]);

  // Logout
  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // Update Order Status
  async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    setError("");
    setSuccess("");

    try {
      await updateOrderStatus(orderId, newStatus);

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );

      setSuccess(
        isBn
          ? `Order #${orderId}-এর Status পরিবর্তন হয়েছে`
          : `Order #${orderId} status updated`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Status পরিবর্তন করা যায়নি"
            : "Could not update status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // Status Labels
  const statusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      PENDING: isBn ? "অপেক্ষমাণ" : "Pending",
      CONFIRMED: isBn ? "নিশ্চিত" : "Confirmed",
      CONNECTED: isBn ? "সংযোগ সম্পন্ন" : "Connected",
      CANCELLED: isBn ? "বাতিল" : "Cancelled",
    };

    return labels[status];
  };

  // Status Styles
  const statusStyle = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      CONNECTED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };

    return styles[status];
  };

  // Statistics
  const pendingCount = orders.filter(
    (order) => order.status === "PENDING",
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.status === "CONFIRMED",
  ).length;

  const connectedCount = orders.filter(
    (order) => order.status === "CONNECTED",
  ).length;

  const stats = [
    {
      label: isBn ? "মোট Order" : "Total Orders",
      value: orders.length,
      color: "text-[#292319]",
      bg: "bg-white",
    },
    {
      label: isBn ? "অপেক্ষমাণ" : "Pending",
      value: pendingCount,
      color: "text-yellow-600",
      bg: "bg-white",
    },
    {
      label: isBn ? "নিশ্চিত" : "Confirmed",
      value: confirmedCount,
      color: "text-blue-600",
      bg: "bg-white",
    },
    {
      label: isBn ? "সংযোগ সম্পন্ন" : "Connected",
      value: connectedCount,
      color: "text-green-600",
      bg: "bg-white",
    },
  ];

  // Search + Status Filter
  const filteredOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter = filter === "ALL" || order.status === filter;

      const matchesSearch =
        !searchTerm ||
        [
          order.id,
          order.customer_name,
          order.phone,
          order.address,
          order.area,
          order.city,
          order.package_name,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchTerm),
        );

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  // Filter Buttons
  const filterButtons = (
    <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
      {["ALL", ...statuses].map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => setFilter(status)}
          className={`rounded-full px-3 py-2 text-xs font-bold transition sm:px-4 ${
            filter === status
              ? "bg-[#f5b91b] text-[#292319]"
              : "border border-[#ebd69b] bg-white text-[#756b58] hover:bg-[#fff8e7]"
          }`}
        >
          {status === "ALL"
            ? isBn
              ? "সব Order"
              : "All Orders"
            : statusLabel(status as OrderStatus)}
        </button>
      ))}
    </div>
  );

  return (
    <AgentPageLayout
      title={isBn ? "Customer Orders" : "Customer Orders"}
      subtitle={
        isBn
          ? "গ্রাহকদের নতুন সংযোগের অনুরোধ দেখুন এবং Status আপডেট করুন।"
          : "View customer connection requests and update their status."
      }
      isBn={isBn}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => loadOrders(true)}
      onLogout={handleLogout}
      error={error}
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={
        isBn
          ? "Order ID, Customer, Phone বা Address খুঁজুন..."
          : "Search Order ID, Customer, Phone or Address..."
      }
      totalCount={filteredOrders.length}
      foundText={isBn ? "টি Order পাওয়া গেছে" : "orders found"}
      filters={filterButtons}
    >
      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ORDER LIST */}
      <section className="rounded-xl border border-[#eee3c9] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#292319] sm:text-xl">
            {isBn ? "Order তালিকা" : "Order List"}
          </h2>

          <span className="rounded-lg bg-[#fff8e7] px-3 py-1.5 text-xs font-semibold text-[#805900]">
            {filteredOrders.length} {isBn ? "টি Order" : "Orders"}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-xl bg-[#fffcf3] px-4 py-12 text-center text-sm text-[#756b58]">
            {isBn ? "কোনো Order পাওয়া যায়নি।" : "No orders found."}
          </div>
        ) : (
          <>
            {/* MOBILE ORDER CARDS */}
            <div className="space-y-3 md:hidden">
              {filteredOrders.map((order) => (
                <details
                  key={order.id}
                  className="group overflow-hidden rounded-xl border border-[#ebd69b] bg-[#fffcf3]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#a47712]">
                        {isBn ? "অর্ডার" : "Order"} #{order.id}
                      </p>

                      <p className="mt-1 truncate font-bold text-[#292319]">
                        {order.customer_name}
                      </p>

                      <p className="mt-1 text-xs text-[#756b58]">
                        {order.phone}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle(order.status)}`}
                      >
                        {statusLabel(order.status)}
                      </span>

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff3cf] text-[#a77a00] transition-transform group-open:rotate-180">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19 9-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </div>
                  </summary>

                  {/* ORDER DETAILS */}
                  <div className="space-y-4 border-t border-[#ebd69b] bg-white p-4 text-sm">
                    {/* PHONE */}
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">
                        {isBn ? "ফোন নম্বর" : "Phone"}
                      </span>

                      <a
                        href={`tel:${order.phone}`}
                        className="font-semibold text-blue-600 underline"
                      >
                        {order.phone}
                      </a>
                    </div>

                    {/* ADDRESS */}
                    <div className="flex justify-between gap-3">
                      <span className="shrink-0 text-gray-500">
                        {isBn ? "ঠিকানা" : "Address"}
                      </span>

                      <div className="max-w-[70%] text-right font-medium">
                        <p>{order.address}</p>
                        <p className="mt-1 text-xs text-[#756b58]">
                          {order.area}, {order.city}
                        </p>
                      </div>
                    </div>

                    {/* PACKAGE */}
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">
                        {isBn ? "প্যাকেজ" : "Package"}
                      </span>

                      <div className="text-right">
                        <p className="font-bold text-[#a77a00]">
                          {order.package_name}
                        </p>
                        <p className="mt-1 text-xs text-[#756b58]">
                          ৳{Number(order.monthly_price).toLocaleString("en-BD")}
                          /{isBn ? "মাস" : "month"}
                        </p>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">
                        {isBn ? "স্ট্যাটাস" : "Status"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    {/* UPDATE STATUS */}
                    <div className="border-t border-[#eee8d9] pt-4">
                      <label
                        htmlFor={`mobile-status-${order.id}`}
                        className="mb-2 block text-sm font-semibold text-[#756b58]"
                      >
                        {isBn ? "Status পরিবর্তন করুন" : "Update Status"}
                      </label>

                      <select
                        id={`mobile-status-${order.id}`}
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                        className="w-full rounded-lg border border-[#ebd69b] bg-[#fffcf3] px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>

                      {updatingId === order.id && (
                        <p className="mt-2 text-xs text-[#756b58]">
                          {isBn ? "আপডেট হচ্ছে..." : "Updating..."}
                        </p>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto rounded-xl border border-[#ebd69b] md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-[#fff8e7] text-[#756b58]">
                  <tr>
                    <th className="px-4 py-4">Order ID</th>
                    <th className="px-4 py-4">
                      {isBn ? "গ্রাহক" : "Customer"}
                    </th>
                    <th className="px-4 py-4">{isBn ? "ফোন" : "Phone"}</th>
                    <th className="px-4 py-4">{isBn ? "ঠিকানা" : "Address"}</th>
                    <th className="px-4 py-4">
                      {isBn ? "প্যাকেজ" : "Package"}
                    </th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">
                      {isBn ? "পরিবর্তন করুন" : "Update Status"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f2e6c5]">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-[#fffcf3]"
                    >
                      <td className="px-4 py-4 font-bold">#{order.id}</td>

                      <td className="px-4 py-4 font-semibold">
                        {order.customer_name}
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={`tel:${order.phone}`}
                          className="text-blue-700 underline"
                        >
                          {order.phone}
                        </a>
                      </td>

                      <td className="max-w-xs px-4 py-4">
                        <p>{order.address}</p>
                        <p className="mt-1 text-xs text-[#756b58]">
                          {order.area}, {order.city}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold">{order.package_name}</p>
                        <p className="mt-1 text-xs text-[#756b58]">
                          ৳{Number(order.monthly_price).toLocaleString("en-BD")}
                          /{isBn ? "মাস" : "month"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className="rounded-lg border border-[#ebd69b] bg-[#fffcf3] px-3 py-2 text-xs font-semibold disabled:opacity-50"
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
          </>
        )}
      </section>
    </AgentPageLayout>
  );
}

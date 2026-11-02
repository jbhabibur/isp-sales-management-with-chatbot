"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  AgentDashboardData,
  getAgentDashboard,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";

import { useLanguage } from "@/app/components/LanguageProvider";

interface Order {
  id: string | number;
  customer_name: string;
  phone: string;
  address: string;
  package_name: string;
  status: string;
  created_at?: string;
  notes?: string;
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [menuOpen, setMenuOpen] = useState(false);

  const [dashboard, setDashboard] = useState<AgentDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  // Orders & Modal States
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load Dashboard Data
  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const data = await getAgentDashboard();

      setDashboard(data);

      // TODO: Replace demo data with actual agent orders API.
      setOrders([
        {
          id: 5,
          customer_name: "Rakib Hossain",
          phone: "01621161532",
          address: "Ashulia, Dhaka",
          package_name: "৳500/month",
          status: "Confirmed",
        },
        {
          id: 4,
          customer_name: "Emran Hossen",
          phone: "01521161532",
          address: "Chairman Bari Mor, Savar, Dhaka",
          package_name: "৳500/month",
          status: "Confirmed",
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Dashboard লোড করা যায়নি"
            : "Could not load dashboard",
      );

      throw err;
    }
  }, [isBn]);

  // Verify Agent Authentication & Load Dashboard
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

        // Load Dashboard after authentication
        await loadDashboard();

        if (active) {
          setAuthorized(true);
        }
      } catch {
        if (active) {
          // Dashboard API error should not log out the user.
          if (getStoredUser()?.role === "SALES_AGENT") {
            setError(
              isBn
                ? "Dashboard লোড করা যায়নি। আবার চেষ্টা করুন।"
                : "Could not load dashboard. Please try again.",
            );
          } else {
            logout();
            router.replace("/login");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    verifyAgent();

    return () => {
      active = false;
    };
  }, [router, loadDashboard, isBn]);

  // Retry Dashboard Loading
  const handleRetry = async () => {
    setError("");

    try {
      await loadDashboard();
    } catch {
      // Error is already handled inside loadDashboard.
    }
  };

  // Dashboard Statistics
  const stats = [
    {
      label: isBn ? "মোট অর্ডার" : "Total Orders",
      value: dashboard?.total_orders ?? 0,
      icon: "📋",
    },
    {
      label: isBn ? "অপেক্ষমাণ অর্ডার" : "Pending Orders",
      value: dashboard?.pending_orders ?? 0,
      icon: "⏳",
    },
    {
      label: isBn ? "নিশ্চিত অর্ডার" : "Confirmed Orders",
      value: dashboard?.confirmed_orders ?? 0,
      icon: "✅",
    },
    {
      label: isBn ? "সংযোগ সম্পন্ন" : "Connected Orders",
      value: dashboard?.connected_orders ?? 0,
      icon: "🌐",
    },
  ];

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Open Modal
  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Full Screen Loading
  if (!authorized && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffcf3] px-4">
        <div className="w-full max-w-sm rounded-xl border border-[#ebd69b] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#f5e8c5] border-t-[#f5b91b]" />

          <p className="text-sm font-semibold text-[#756b58]">
            {isBn ? "Dashboard লোড হচ্ছে..." : "Loading dashboard..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffcf3] text-[#292319]">
      {/* HEADER */}
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#ebd69b] bg-gradient-to-r from-[#ffe9a6] via-[#f5c542] to-[#f5b91b] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/images/logo.png"
              alt="Circle Network Logo"
              width={100}
              height={60}
              priority
              className="h-10 w-auto shrink-0 object-contain sm:h-12"
            />

            <span className="whitespace-nowrap text-lg font-extrabold text-[#292319] sm:text-xl">
              Circle <span className="text-white">Network</span>
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-semibold text-[#292319] transition hover:text-white"
            >
              {isBn ? "হোম পেজ" : "Home Page"}
            </Link>

            <span className="text-sm font-bold text-[#292319]">
              {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
            </span>

            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg bg-[#292319] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              {isBn ? "লগআউট" : "Logout"}
            </button>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={isBn ? "মেনু" : "Menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#292319]/20 bg-white/40 text-2xl text-[#292319] transition hover:bg-white/70 md:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        {menuOpen && (
          <div className="border-t border-[#292319]/10 bg-[#fff3cf] px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[#292319] hover:bg-white/60"
              >
                {isBn ? "হোম পেজ" : "Home Page"}
              </Link>

              <span className="rounded-lg bg-white/60 px-3 py-2 text-sm font-bold text-[#292319]">
                {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
              </span>

              <button
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="rounded-lg bg-[#292319] px-4 py-3 text-left text-sm font-bold text-white"
              >
                {isBn ? "লগআউট" : "Logout"}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* PAGE TITLE */}
        <section>
          <p className="text-sm font-bold uppercase tracking-wider text-[#a47712]">
            {isBn ? "সেলস এজেন্ট প্যানেল" : "Sales Agent Panel"}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Agent Dashboard
          </h1>

          <p className="mt-2 text-[#756b58]">
            {isBn
              ? "আপনার Customer Order এবং সংযোগের অগ্রগতি দেখুন।"
              : "View customer orders and connection progress."}
          </p>
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>

            <button
              onClick={handleRetry}
              className="shrink-0 font-bold underline"
            >
              {isBn ? "আবার চেষ্টা করুন" : "Try again"}
            </button>
          </div>
        )}

        {/* DASHBOARD CONTENT */}
        {!error && (
          <>
            {/* STATISTICS */}
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#ebd69b] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#756b58]">
                      {stat.label}
                    </p>

                    <span className="text-2xl">{stat.icon}</span>
                  </div>

                  <p className="mt-4 text-3xl font-extrabold">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* ORDER MANAGEMENT */}
            <section className="rounded-2xl border border-[#ebd69b] bg-white p-6 shadow-sm sm:p-8">
              {/* SECTION HEADER */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold">
                    {isBn ? "অর্ডার ম্যানেজমেন্ট" : "Order Management"}
                  </h2>

                  <p className="mt-1 text-sm text-[#756b58]">
                    {isBn
                      ? "কাস্টমারের অর্ডার এবং সংযোগের তথ্য দেখুন।"
                      : "View customer connection requests and update order statuses."}
                  </p>
                </div>

                <Link
                  href="/agent/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5b91b] px-5 py-2.5 text-sm font-extrabold text-[#292319] transition hover:bg-[#e9a900]"
                >
                  {isBn ? "সব অর্ডার দেখুন" : "View All Orders"}
                  <span>→</span>
                </Link>
              </div>

              {/* ================================= */}
              {/* MOBILE ORDER VIEW */}
              {/* ================================= */}

              <div className="space-y-3 md:hidden">
                {orders.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    {isBn ? "কোনো অর্ডার পাওয়া যায়নি।" : "No orders found."}
                  </div>
                ) : (
                  orders.map((order) => (
                    <details
                      key={order.id}
                      className="group overflow-hidden rounded-xl border border-[#ebd69b] bg-[#fffcf3]"
                    >
                      {/* DROPDOWN HEADER */}
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#a47712]">
                            {isBn ? "অর্ডার" : "Order"} #{order.id}
                          </p>

                          <p className="mt-1 truncate font-bold text-[#292319]">
                            {order.customer_name}
                          </p>
                        </div>

                        {/* DROPDOWN ICON */}
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff3cf] text-[#a77a00] transition-transform group-open:rotate-180">
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
                      </summary>

                      {/* DROPDOWN CONTENT */}
                      <div className="space-y-3 border-t border-[#ebd69b] bg-white p-4 text-sm">
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
                          <span className="text-gray-500">
                            {isBn ? "ঠিকানা" : "Address"}
                          </span>

                          <span className="max-w-[65%] text-right font-medium">
                            {order.address}
                          </span>
                        </div>

                        {/* PACKAGE */}
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">
                            {isBn ? "প্যাকেজ" : "Package"}
                          </span>

                          <span className="font-bold text-[#a77a00]">
                            {order.package_name}
                          </span>
                        </div>

                        {/* STATUS */}
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">
                            {isBn ? "স্ট্যাটাস" : "Status"}
                          </span>

                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                            {order.status}
                          </span>
                        </div>

                        {/* NOTES */}
                        {order.notes && (
                          <div className="border-t border-gray-100 pt-3">
                            <p className="mb-1 font-semibold text-gray-500">
                              {isBn ? "নোট" : "Notes"}
                            </p>

                            <p className="text-[#292319]">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  ))
                )}
              </div>

              {/* ================================= */}
              {/* DESKTOP ORDER TABLE */}
              {/* ================================= */}

              <div className="hidden overflow-x-auto rounded-xl border border-[#ebd69b] md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#ebd69b] bg-[#fff8e7] text-xs font-bold uppercase tracking-wider text-[#756b58]">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Package</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#ebd69b]/40 text-sm">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-[#fffcf3]"
                      >
                        <td className="p-4 font-bold">#{order.id}</td>

                        <td className="p-4 font-semibold">
                          {order.customer_name}
                        </td>

                        <td className="p-4">
                          <a
                            href={`tel:${order.phone}`}
                            className="text-blue-600 underline"
                          >
                            {order.phone}
                          </a>
                        </td>

                        <td className="p-4 text-[#756b58]">{order.address}</td>

                        <td className="p-4 font-medium">
                          {order.package_name}
                        </td>

                        <td className="p-4">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                            {order.status}
                          </span>
                        </td>

                        {/* EYE BUTTON */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => openModal(order)}
                            className="inline-flex items-center justify-center rounded-xl bg-[#fff3cf] p-2 text-[#a77a00] shadow-sm transition hover:bg-[#f5b91b] hover:text-[#292319]"
                            title="View Full Details"
                            aria-label={`View order ${order.id}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="h-5 w-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12c.077-.19.152-.379.232-.564C3.899 7.821 7.643 5 12 5c4.357 0 8.101 2.821 9.732 6.436.08.185.155.374.232.564-.077.19-.152.379-.232.564C20.101 16.179 16.357 19 12 19c-4.357 0-8.101-2.821-9.732-6.436a24.814 24.814 0 01-.232-.564z"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {orders.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-gray-500"
                        >
                          {isBn
                            ? "কোনো অর্ডার পাওয়া যায়নি।"
                            : "No orders found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ================================= */}
      {/* DESKTOP ORDER DETAILS MODAL */}
      {/* ================================= */}

      {isModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 hidden items-center justify-center bg-[#292319]/50 p-4 backdrop-blur-sm md:flex"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#ebd69b] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#ebd69b] bg-[#fff8e7] px-6 py-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#292319]">
                  {isBn ? "অর্ডারের বিস্তারিত" : "Order Details"}
                </h3>

                <p className="mt-1 text-sm font-semibold text-[#a47712]">
                  #{selectedOrder.id}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-lg font-bold text-[#756b58] transition hover:bg-[#f5e8c5] hover:text-[#292319]"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="space-y-0 px-6 py-3">
              {[
                {
                  label: isBn ? "কাস্টমারের নাম" : "Customer Name",
                  value: selectedOrder.customer_name,
                },
                {
                  label: isBn ? "ফোন নম্বর" : "Phone Number",
                  value: selectedOrder.phone,
                },
                {
                  label: isBn ? "ঠিকানা" : "Address",
                  value: selectedOrder.address,
                },
                {
                  label: isBn ? "প্যাকেজ" : "Package",
                  value: selectedOrder.package_name,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between gap-5 border-b border-[#eee8d9] py-4"
                >
                  <span className="shrink-0 text-sm font-medium text-[#756b58]">
                    {item.label}
                  </span>

                  <span className="break-words text-right text-sm font-bold text-[#292319]">
                    {item.value}
                  </span>
                </div>
              ))}

              {/* STATUS */}
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="text-sm font-medium text-[#756b58]">
                  {isBn ? "অর্ডারের অবস্থা" : "Order Status"}
                </span>

                <span className="rounded-full bg-[#fff3cf] px-4 py-1.5 text-xs font-bold text-[#805900]">
                  {selectedOrder.status}
                </span>
              </div>

              {/* NOTES */}
              {selectedOrder.notes && (
                <div className="border-t border-[#eee8d9] py-4">
                  <p className="mb-2 text-sm font-medium text-[#756b58]">
                    {isBn ? "অতিরিক্ত নোট" : "Additional Notes"}
                  </p>

                  <p className="text-sm leading-6 text-[#292319]">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-end border-t border-[#ebd69b] bg-[#fffcf3] px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-xl bg-[#f5b91b] px-6 py-2.5 text-sm font-bold text-[#292319] transition hover:bg-[#e9a900]"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-10 border-t border-[#ebd69b] py-6 text-center text-sm text-[#756b58]">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>
    </div>
  );
}

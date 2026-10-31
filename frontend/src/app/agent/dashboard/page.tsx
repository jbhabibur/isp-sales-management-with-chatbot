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

export default function AgentDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [dashboard, setDashboard] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAgentDashboard();
      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Dashboard লোড করা যায়নি"
            : "Could not load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [isBn]);

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

        await loadDashboard();
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
  }, [router, loadDashboard]);

  const stats = [
    {
      label: isBn ? "মোট Order" : "Total Orders",
      value: dashboard?.total_orders ?? 0,
      icon: "📋",
    },
    {
      label: isBn ? "অপেক্ষমাণ Order" : "Pending Orders",
      value: dashboard?.pending_orders ?? 0,
      icon: "⏳",
    },
    {
      label: isBn ? "নিশ্চিত Order" : "Confirmed Orders",
      value: dashboard?.confirmed_orders ?? 0,
      icon: "✅",
    },
    {
      label: isBn ? "সংযোগ সম্পন্ন" : "Connected Orders",
      value: dashboard?.connected_orders ?? 0,
      icon: "🌐",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fffcf3] text-[#292319]">
      <header className="sticky top-0 z-30 border-b border-[#ebd69b] bg-gradient-to-r from-[#f5b91b] to-[#ffe9a6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/agent/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Circle Network"
              width={100}
              height={55}
              priority
              className="h-11 w-auto object-contain"
            />
            <span className="text-lg font-extrabold sm:text-xl">
              Circle <span className="text-[#805900]">Network</span>
            </span>
          </Link>

          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="rounded-xl border border-[#292319]/20 bg-white/60 px-4 py-2 text-sm font-bold transition hover:bg-white"
          >
            {isBn ? "Logout" : "Logout"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <section>
          <p className="text-sm font-bold uppercase tracking-wider text-[#a47712]">
            {isBn ? "সেলস এজেন্ট প্যানেল" : "Sales Agent Panel"}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {isBn ? "Agent Dashboard" : "Agent Dashboard"}
          </h1>

          <p className="mt-2 text-[#756b58]">
            {isBn
              ? "আপনার Customer Order এবং সংযোগের অগ্রগতি দেখুন।"
              : "View customer orders and connection progress."}
          </p>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={loadDashboard}
              className="ml-3 font-bold underline"
            >
              {isBn ? "আবার চেষ্টা করুন" : "Try again"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#ebd69b] bg-white p-10 text-center text-[#756b58]">
            {isBn ? "Dashboard লোড হচ্ছে..." : "Loading dashboard..."}
          </div>
        ) : (
          <>
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

            <section className="rounded-2xl border border-[#ebd69b] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-extrabold">
                {isBn ? "Order Management" : "Order Management"}
              </h2>

              <p className="mt-2 text-sm text-[#756b58]">
                {isBn
                  ? "গ্রাহকদের সংযোগের অনুরোধ দেখুন এবং Order Status পরিবর্তন করুন।"
                  : "View customer connection requests and update order statuses."}
              </p>

              <Link
                href="/agent/orders"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5b91b] px-6 py-3 font-extrabold text-[#292319] transition hover:bg-[#e9a900]"
              >
                {isBn ? "Customer Orders দেখুন" : "View Customer Orders"}
                <span>→</span>
              </Link>
            </section>
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-[#ebd69b] py-6 text-center text-sm text-[#756b58]">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>
    </div>
  );
}

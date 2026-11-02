"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  getAdminDashboard,
  getCurrentUser,
  getStoredUser,
  logout,
  type AdminDashboardData,
} from "@/lib/api";

import { useLanguage } from "../../components/LanguageProvider";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const isBn = language === "bn";

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const content = {
    bn: {
      title: "অ্যাডমিন ড্যাশবোর্ড",
      subtitle: "Circle Network ব্যবস্থাপনা প্যানেল",
      welcome: "স্বাগতম",
      totalOrders: "মোট অর্ডার",
      pendingOrders: "অপেক্ষমাণ অর্ডার",
      completed: "সম্পন্ন সংযোগ",
      agents: "মোট সেলস এজেন্ট",
      management: "ম্যানেজমেন্ট",
      loading: "ড্যাশবোর্ড লোড হচ্ছে...",
      error: "ড্যাশবোর্ড লোড করা যায়নি।",
      retry: "আবার চেষ্টা করুন",
      logout: "লগআউট",
      home: "হোম পেজ",
      dashboard: "ড্যাশবোর্ড",
      manage: "পরিচালনা করুন",
      menu: "মেনু",
      packageTitle: "প্যাকেজ ম্যানেজমেন্ট",
      packageDesc: "ইন্টারনেট প্যাকেজ যোগ ও পরিচালনা করুন",
      coverageTitle: "কভারেজ এরিয়া",
      coverageDesc: "সার্ভিস এরিয়া পরিচালনা করুন",
      agentTitle: "সেলস এজেন্ট",
      agentDesc: "নতুন এজেন্ট তৈরি ও তালিকা দেখুন",
      orderTitle: "অর্ডার ম্যানেজমেন্ট",
      orderDesc: "কাস্টমার অর্ডার দেখুন ও পরিচালনা করুন",
      callbackTitle: "কলব্যাক রিকোয়েস্ট",
      callbackDesc: "কাস্টমারের কলব্যাক রিকোয়েস্ট দেখুন",
      leadTitle: "ফিউচার লিড",
      leadDesc: "ভবিষ্যৎ কাস্টমার লিড দেখুন",
    },
    en: {
      title: "Admin Dashboard",
      subtitle: "Circle Network Management Panel",
      welcome: "Welcome",
      totalOrders: "Total Orders",
      pendingOrders: "Pending Orders",
      completed: "Completed Connections",
      agents: "Total Sales Agents",
      management: "Management",
      loading: "Loading dashboard...",
      error: "Unable to load dashboard.",
      retry: "Try Again",
      logout: "Logout",
      home: "Home Page",
      dashboard: "Dashboard",
      manage: "Manage",
      menu: "Menu",
      packageTitle: "Package Management",
      packageDesc: "Add and manage internet packages",
      coverageTitle: "Coverage Areas",
      coverageDesc: "Manage service coverage areas",
      agentTitle: "Sales Agents",
      agentDesc: "Create and view sales agents",
      orderTitle: "Order Management",
      orderDesc: "View and manage customer orders",
      callbackTitle: "Callback Requests",
      callbackDesc: "View customer callback requests",
      leadTitle: "Future Leads",
      leadDesc: "View future customer leads",
    },
  };

  const t = content[language];

  const managementLinks = [
    {
      title: t.packageTitle,
      description: t.packageDesc,
      href: "/admin/packages",
      number: "01",
    },
    {
      title: t.coverageTitle,
      description: t.coverageDesc,
      href: "/admin/coverage",
      number: "02",
    },
    {
      title: t.agentTitle,
      description: t.agentDesc,
      href: "/admin/agents",
      number: "03",
    },
    {
      title: t.orderTitle,
      description: t.orderDesc,
      href: "/admin/orders",
      number: "04",
    },
    {
      title: t.callbackTitle,
      description: t.callbackDesc,
      href: "/admin/callbacks",
      number: "05",
    },
    {
      title: t.leadTitle,
      description: t.leadDesc,
      href: "/admin/future-leads",
      number: "06",
    },
  ];

  const stats = [
    { title: t.totalOrders, value: data?.total_orders ?? 0, number: "01" },
    { title: t.pendingOrders, value: data?.pending_orders ?? 0, number: "02" },
    {
      title: t.completed,
      value: data?.completed_connections ?? 0,
      number: "03",
    },
    { title: t.agents, value: data?.total_sales_agents ?? 0, number: "04" },
  ];

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser) {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "ADMIN") {
          router.replace(
            user.role === "SALES_AGENT" ? "/agent/dashboard" : "/login",
          );
          return;
        }

        setAdminName(user.full_name);

        // Dashboard data load
        const result = await getAdminDashboard();

        if (active) {
          setData(result);
          setAuthorized(true);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : t.error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  // Full Screen Loading
  if (!authorized && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffcf3] px-4">
        <div className="w-full max-w-sm rounded-xl border border-[#ebd69b] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#f5e8c5] border-t-[#f5b91b]" />

          <p className="text-sm font-semibold text-[#756b58]">
            {isBn ? "ড্যাশবোর্ড লোড হচ্ছে..." : "Loading dashboard..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8e7]">
      {/* Header */}
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

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-semibold text-[#292319] transition hover:text-white"
            >
              {t.home}
            </Link>
            <span className="text-sm font-bold text-[#292319]">
              {t.dashboard}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-[#292319] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              {t.logout}
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.menu}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#292319]/20 bg-white/40 text-2xl text-[#292319] transition hover:bg-white/70 md:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#292319]/10 bg-[#fff3cf] px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[#292319] hover:bg-white/60"
              >
                {t.home}
              </Link>
              <span className="rounded-lg bg-white/60 px-3 py-2 text-sm font-bold text-[#292319]">
                {t.dashboard}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-[#292319] px-4 py-3 text-left text-sm font-bold text-white"
              >
                {t.logout}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-7 sm:mb-9">
          <p className="text-sm font-semibold text-[#a77a00]">
            {t.welcome}
            {adminName ? `, ${adminName}` : ""}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#292319] sm:text-3xl lg:text-4xl">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-[#756b58] sm:text-base">
            {t.subtitle}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[#ebd69b] bg-white p-10 text-center text-sm text-[#756b58]">
            {t.loading}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white p-6 text-center sm:p-8">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#f5b91b] px-5 py-2.5 text-sm font-bold text-[#292319] transition hover:bg-[#e9a900]"
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.number}
                className="rounded-xl border border-[#ebd69b] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-6 text-[#756b58] sm:text-base">
                    {stat.title}
                  </p>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff3cf] text-sm font-extrabold text-[#a77a00]">
                    {stat.number}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold tabular-nums text-[#292319] sm:mt-5 sm:text-4xl">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Management Section */}
        <div className="mt-10 sm:mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-[#292319] sm:text-2xl">
              {t.management}
            </h2>
            <div className="h-1 w-12 rounded-full bg-[#f5b91b]" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {managementLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-[150px] flex-col justify-between rounded-xl border border-[#ebd69b] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#e9a900] hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold leading-6 text-[#292319] transition group-hover:text-[#a77a00] sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#756b58]">
                      {item.description}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff3cf] text-sm font-extrabold text-[#a77a00] transition group-hover:bg-[#f5b91b]">
                    {item.number}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#a77a00]">
                    {t.manage}
                  </span>
                  <span className="text-lg text-[#a77a00] transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-10 border-t border-[#ebd69b] bg-[#fff3cf] px-4 py-5 text-center text-xs text-[#756b58] sm:py-6 sm:text-sm"
        suppressHydrationWarning
      >
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
        Circle Network. All rights reserved.
      </footer>
    </main>
  );
}

function handleLogout() {
  logout();
  window.location.replace("/login");
}

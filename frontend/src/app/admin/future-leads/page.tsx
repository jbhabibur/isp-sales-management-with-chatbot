"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FutureLead,
  getFutureLeads,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminFutureLeadsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [leads, setLeads] = useState<FutureLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = {
    title: isBn ? "ফিউচার লিডস" : "Future Leads",
    subtitle: isBn
      ? "যেসব এলাকায় বর্তমানে আমাদের ইন্টারনেট কভারেজ নেই, সেসব এলাকার আগ্রহী কাস্টমারদের তালিকা।"
      : "Potential customers from areas where internet coverage is currently unavailable.",
    dashboard: isBn ? "ড্যাশবোর্ড" : "Dashboard",
    total: isBn ? "মোট ফিউচার লিড" : "Total Future Leads",
    customer: isBn ? "কাস্টমারের নাম" : "Customer Name",
    phone: isBn ? "ফোন নম্বর" : "Phone Number",
    city: isBn ? "শহর" : "City",
    area: isBn ? "এলাকা" : "Area",
    address: isBn ? "ঠিকানা" : "Address",
    status: isBn ? "স্ট্যাটাস" : "Status",
    date: isBn ? "সংগ্রহের সময়" : "Created At",
    loading: isBn ? "লোড হচ্ছে..." : "Loading...",
    empty: isBn ? "কোনো ফিউচার লিড পাওয়া যায়নি।" : "No future leads found.",
    error: isBn ? "ফিউচার লিড লোড করা যায়নি।" : "Failed to load future leads.",
    refresh: isBn ? "রিফ্রেশ" : "Refresh",
    logout: isBn ? "লগআউট" : "Logout",
    noAddress: isBn ? "ঠিকানা দেওয়া হয়নি" : "No address provided",
  };

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const data = await getFutureLeads();
      setLeads(data);
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

        await loadLeads();
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

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleString(isBn ? "bn-BD" : "en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

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
            <p className="mt-2 max-w-2xl text-sm text-[#756b58]">
              {t.subtitle}
            </p>
          </div>

          <button
            onClick={loadLeads}
            disabled={loading}
            className="rounded-lg bg-[#f5b91b] px-5 py-2.5 font-bold text-[#292319] hover:bg-[#e9a900] disabled:opacity-60"
          >
            {loading ? t.loading : t.refresh}
          </button>
        </div>

        <div className="mb-7 rounded-xl border border-[#ebd69b] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#756b58]">{t.total}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#292319]">
            {leads.length}
          </p>
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
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-[#ebd69b] bg-white p-12 text-center text-[#756b58]">
            {t.empty}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#ebd69b] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-[#fff3cf] text-[#292319]">
                  <tr>
                    <th className="px-5 py-4">{t.customer}</th>
                    <th className="px-5 py-4">{t.phone}</th>
                    <th className="px-5 py-4">{t.city}</th>
                    <th className="px-5 py-4">{t.area}</th>
                    <th className="px-5 py-4">{t.address}</th>
                    <th className="px-5 py-4">{t.status}</th>
                    <th className="px-5 py-4">{t.date}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e5c8]">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        {lead.customer_name}
                      </td>

                      <td className="px-5 py-4">
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {lead.phone}
                        </a>
                      </td>

                      <td className="px-5 py-4 text-[#756b58]">{lead.city}</td>

                      <td className="px-5 py-4 text-[#756b58]">{lead.area}</td>

                      <td className="max-w-xs px-5 py-4 text-[#756b58]">
                        {lead.address || t.noAddress}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                          {lead.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-[#756b58]">
                        {formatDate(lead.created_at)}
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

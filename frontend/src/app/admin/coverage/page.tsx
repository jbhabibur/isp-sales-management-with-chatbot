"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CoverageArea,
  getAdminCoverageAreas,
  createCoverageArea,
  updateCoverageArea,
  deleteCoverageArea,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function CoverageManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [updatingAreaId, setUpdatingAreaId] = useState<number | null>(null);
  const [deletingAreaId, setDeletingAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [areaName, setAreaName] = useState("");

  async function loadAreas() {
    try {
      setError("");
      const data = await getAdminCoverageAreas();
      setAreas(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "এলাকার তথ্য লোড করা যায়নি"
            : "Failed to load coverage areas",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser) {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        await loadAreas();
      } catch {
        if (active) {
          logout();
          router.replace("/login");
        }
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  function resetForm() {
    setEditingId(null);
    setCity("");
    setAreaName("");
  }

  function handleEdit(area: CoverageArea) {
    setEditingId(area.id);
    setCity(area.city);
    setAreaName(area.area_name);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!city.trim() || !areaName.trim()) {
      setError(
        isBn
          ? "City এবং Area দুটোই দিতে হবে"
          : "Both city and area are required",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId !== null) {
        await updateCoverageArea(editingId, {
          city: city.trim(),
          area_name: areaName.trim(),
        });

        setSuccess(isBn ? "এলাকার তথ্য আপডেট হয়েছে" : "Coverage area updated");
      } else {
        await createCoverageArea({
          city: city.trim(),
          area_name: areaName.trim(),
        });

        setSuccess(isBn ? "নতুন এলাকা যোগ হয়েছে" : "New coverage area added");
      }

      resetForm();
      await loadAreas();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "কাজটি সম্পন্ন করা যায়নি"
            : "Operation failed",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(area: CoverageArea) {
    try {
      setUpdatingAreaId(area.id);
      setError("");
      setSuccess("");

      await updateCoverageArea(area.id, {
        is_active: !area.is_active,
      });

      setSuccess(
        isBn ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated successfully",
      );

      await loadAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingAreaId(null);
    }
  }

  async function handleDelete(area: CoverageArea) {
    const confirmed = window.confirm(
      isBn
        ? `আপনি কি "${area.area_name}" এলাকা Delete করতে নিশ্চিত? এই কাজটি Undo করা যাবে না।`
        : `Are you sure you want to delete "${area.area_name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingAreaId(area.id);
      setError("");
      setSuccess("");

      await deleteCoverageArea(area.id);

      setSuccess(
        isBn ? "এলাকা সফলভাবে Delete হয়েছে" : "Area deleted successfully",
      );

      if (editingId === area.id) {
        resetForm();
      }

      await loadAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete area");
    } finally {
      setDeletingAreaId(null);
    }
  }

  const activeCount = areas.filter((area) => area.is_active).length;
  const inactiveCount = areas.length - activeCount;

  return (
    <div className="min-h-screen bg-[#fffcf3]">
      <header className="sticky top-0 z-40 border-b border-[#ebd69b] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Circle Network"
              width={100}
              height={50}
              className="h-10 w-auto object-contain"
            />
            <span className="text-lg font-extrabold text-[#292319] sm:text-xl">
              Circle <span className="text-[#e9a900]">Network</span>
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-[#ebd69b] px-3 py-2 text-sm font-semibold text-[#292319] hover:bg-[#fff3cf]"
          >
            ← {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#b88700]">
            {isBn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
          </p>
          <h1 className="text-2xl font-extrabold text-[#292319] sm:text-3xl">
            {isBn ? "Coverage Area Management" : "Coverage Area Management"}
          </h1>
          <p className="mt-2 text-sm text-[#756b58] sm:text-base">
            {isBn
              ? "যেসব এলাকায় Circle Network ইন্টারনেট সেবা প্রদান করে সেগুলো পরিচালনা করুন।"
              : "Manage the areas where Circle Network provides internet service."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "মোট এলাকা" : "Total Areas"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#292319]">
              {areas.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "সক্রিয় এলাকা" : "Active Areas"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#756b58]">
              {isBn ? "নিষ্ক্রিয় এলাকা" : "Inactive Areas"}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-[#ebd69b] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#292319]">
              {editingId !== null
                ? isBn
                  ? "এলাকা সম্পাদনা করুন"
                  : "Edit Coverage Area"
                : isBn
                  ? "নতুন এলাকা যোগ করুন"
                  : "Add New Coverage Area"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-[#9b7100] hover:underline"
              >
                {isBn ? "বাতিল করুন" : "Cancel"}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#292319]">
                  {isBn ? "City / শহর" : "City"}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={isBn ? "যেমন: Dhaka" : "e.g. Dhaka"}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#292319]">
                  {isBn ? "Area / এলাকার নাম" : "Area Name"}
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder={isBn ? "যেমন: Savar" : "e.g. Savar"}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#f5b91b] px-6 py-3 text-sm font-bold text-[#292319] shadow-sm transition hover:bg-[#e9a900] disabled:opacity-60"
            >
              {saving
                ? isBn
                  ? "অপেক্ষা করুন..."
                  : "Please wait..."
                : editingId !== null
                  ? isBn
                    ? "পরিবর্তন সংরক্ষণ করুন"
                    : "Save Changes"
                  : isBn
                    ? "এলাকা যোগ করুন"
                    : "Add Area"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ebd69b] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebd69b] px-5 py-5 sm:px-7">
            <h2 className="text-xl font-bold text-[#292319]">
              {isBn ? "সকল Coverage Area" : "All Coverage Areas"}
            </h2>

            <button
              type="button"
              onClick={loadAreas}
              className="rounded-lg border border-[#ebd69b] px-3 py-2 text-sm font-semibold text-[#292319] hover:bg-[#fff3cf]"
            >
              ↻ {isBn ? "Refresh" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#756b58]">
              {isBn ? "লোড হচ্ছে..." : "Loading coverage areas..."}
            </div>
          ) : areas.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#756b58]">
              {isBn
                ? "কোনো Coverage Area পাওয়া যায়নি।"
                : "No coverage areas found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-[#fff8e7] text-[#756b58]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">ID</th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "City" : "City"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "Area" : "Area"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "স্ট্যাটাস" : "Status"}
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      {isBn ? "অ্যাকশন" : "Actions"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1e5c4]">
                  {areas.map((area) => (
                    <tr key={area.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-medium text-[#756b58]">
                        #{area.id}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#292319]">
                        {area.city}
                      </td>
                      <td className="px-5 py-4 text-[#292319]">
                        {area.area_name}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            area.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {area.is_active
                            ? isBn
                              ? "Active"
                              : "Active"
                            : isBn
                              ? "Inactive"
                              : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(area)}
                            disabled={updatingAreaId === area.id}
                            className="flex min-w-[105px] items-center justify-center gap-2 rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold text-[#292319] hover:bg-[#fff3cf] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingAreaId === area.id ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#292319] border-t-transparent" />
                                {isBn ? "অপেক্ষা করুন..." : "Updating..."}
                              </>
                            ) : area.is_active ? (
                              isBn ? (
                                "Inactive করুন"
                              ) : (
                                "Deactivate"
                              )
                            ) : isBn ? (
                              "Active করুন"
                            ) : (
                              "Activate"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(area)}
                            disabled={deletingAreaId === area.id}
                            className="flex min-w-[90px] items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingAreaId === area.id ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                {isBn ? "Deleting..." : "Deleting..."}
                              </>
                            ) : isBn ? (
                              "Delete"
                            ) : (
                              "Delete"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type CoverageArea,
  getAdminCoverageAreas,
  createCoverageArea,
  updateCoverageArea,
  deleteCoverageArea,
  getCurrentUser,
  getStoredUser,
  logout,
} from "@/lib/api";

import { useLanguage } from "@/app/components/LanguageProvider";
import AdminPageLayout from "../../components/AdminPageLayout";

export default function CoverageManagementPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [updatingAreaId, setUpdatingAreaId] = useState<number | null>(null);
  const [deletingAreaId, setDeletingAreaId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [areaName, setAreaName] = useState("");

  const t = {
    title: "Coverage Area Management",
    subtitle: isBn
      ? "যেসব এলাকায় Circle Network ইন্টারনেট সেবা প্রদান করে সেগুলো পরিচালনা করুন।"
      : "Manage the areas where Circle Network provides internet service.",
    total: isBn ? "মোট এলাকা" : "Total Areas",
    active: isBn ? "সক্রিয় এলাকা" : "Active Areas",
    inactive: isBn ? "নিষ্ক্রিয় এলাকা" : "Inactive Areas",
    search: isBn ? "City বা Area দিয়ে খুঁজুন..." : "Search by city or area...",
    found: isBn ? "টি এলাকা পাওয়া গেছে" : "areas found",
    list: isBn ? "সকল Coverage Area" : "All Coverage Areas",
    listDescription: isBn
      ? "আপনার Internet Coverage Area পরিচালনা করুন।"
      : "Manage your internet coverage areas.",
    add: isBn ? "নতুন এলাকা যোগ করুন" : "Add New Coverage Area",
    edit: isBn ? "এলাকা সম্পাদনা করুন" : "Edit Coverage Area",
    city: isBn ? "City / শহর" : "City",
    area: isBn ? "Area / এলাকার নাম" : "Area Name",
    cityPlaceholder: isBn ? "যেমন: Dhaka" : "e.g. Dhaka",
    areaPlaceholder: isBn ? "যেমন: Savar" : "e.g. Savar",
    cancel: isBn ? "বাতিল করুন" : "Cancel",
    addButton: isBn ? "এলাকা যোগ করুন" : "Add Area",
    updateButton: isBn ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes",
    wait: isBn ? "অপেক্ষা করুন..." : "Please wait...",
    updating: isBn ? "Updating..." : "Updating...",
    deleting: isBn ? "Deleting..." : "Deleting...",
    activate: isBn ? "Active করুন" : "Activate",
    deactivate: isBn ? "Inactive করুন" : "Deactivate",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    status: isBn ? "স্ট্যাটাস" : "Status",
    actions: isBn ? "অ্যাকশন" : "Actions",
    empty: isBn
      ? "কোনো Coverage Area পাওয়া যায়নি।"
      : "No coverage areas found.",
    loading: isBn ? "লোড হচ্ছে..." : "Loading coverage areas...",
  };

  const loadAreas = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

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
        setRefreshing(false);
      }
    },
    [isBn],
  );

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const storedUser = getStoredUser();

        if (!storedUser || storedUser.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        const user = await getCurrentUser();

        if (!active) return;

        if (user.role !== "ADMIN") {
          logout();
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
  }, [router, loadAreas]);

  function resetForm() {
    setEditingId(null);
    setCity("");
    setAreaName("");
    setIsModalOpen(false);
  }

  function openCreateModal() {
    setError("");
    setSuccess("");
    setEditingId(null);
    setCity("");
    setAreaName("");
    setIsModalOpen(true);
  }

  function handleEdit(area: CoverageArea) {
    setEditingId(area.id);
    setCity(area.city);
    setAreaName(area.area_name);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
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
      await loadAreas(false);
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

      await loadAreas(false);
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

      await loadAreas(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete area");
    } finally {
      setDeletingAreaId(null);
    }
  }

  const activeCount = areas.filter((area) => area.is_active).length;
  const inactiveCount = areas.length - activeCount;

  const filteredAreas = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return areas;

    return areas.filter(
      (area) =>
        area.city.toLowerCase().includes(query) ||
        area.area_name.toLowerCase().includes(query) ||
        String(area.id).includes(query),
    );
  }, [areas, search]);

  const stats = [
    {
      label: t.total,
      value: areas.length,
      color: "text-gray-900",
      bg: "bg-white",
    },
    {
      label: t.active,
      value: activeCount,
      color: "text-green-700",
      bg: "bg-white",
    },
    {
      label: t.inactive,
      value: inactiveCount,
      color: "text-red-600",
      bg: "bg-white",
    },
  ];

  function areaActions(area: CoverageArea) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleEdit(area)}
          className="rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold text-[#292319] hover:bg-[#fff3cf]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => handleToggleStatus(area)}
          disabled={updatingAreaId === area.id || deletingAreaId === area.id}
          className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${
            area.is_active
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {updatingAreaId === area.id
            ? t.updating
            : area.is_active
              ? t.deactivate
              : t.activate}
        </button>

        <button
          type="button"
          onClick={() => handleDelete(area)}
          disabled={deletingAreaId === area.id || updatingAreaId === area.id}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deletingAreaId === area.id ? t.deleting : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title={t.title}
      subtitle={t.subtitle}
      isBn={isBn}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => loadAreas(false)}
      onLogout={() => {
        logout();
        router.replace("/login");
      }}
      error={error}
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t.search}
      totalCount={filteredAreas.length}
      foundText={t.found}
    >
      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Coverage Area List */}
      <section className="overflow-hidden rounded-2xl border border-[#ebd69b] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#ebd69b] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-extrabold text-[#292319] sm:text-xl">
              {t.list}
            </h2>
            <p className="mt-1 text-sm text-[#756b58]">{t.listDescription}</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="w-full rounded-xl bg-[#f5b91b] px-5 py-3 text-sm font-extrabold text-[#292319] transition hover:bg-[#e9a900] sm:w-auto"
          >
            + {t.add}
          </button>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#756b58] sm:p-10">
            {t.empty}
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:hidden">
              {filteredAreas.map((area) => (
                <div
                  key={area.id}
                  className="min-w-0 rounded-xl border border-[#ebd69b] bg-[#fffcf3] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#a47712]">
                        #{area.id}
                      </p>

                      <h3 className="mt-1 break-words font-bold text-[#292319]">
                        {area.area_name}
                      </h3>

                      <p className="mt-1 break-words text-sm text-[#756b58]">
                        {area.city}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        area.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {area.is_active ? t.activeStatus : t.inactiveStatus}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-[#ebd69b] pt-3">
                    {areaActions(area)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-[#fff8e7] text-[#756b58]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">ID</th>
                    <th className="px-5 py-4 font-semibold">{t.city}</th>
                    <th className="px-5 py-4 font-semibold">{t.area}</th>
                    <th className="px-5 py-4 font-semibold">{t.status}</th>
                    <th className="px-5 py-4 font-semibold">{t.actions}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1e5c4]">
                  {filteredAreas.map((area) => (
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
                          {area.is_active ? t.activeStatus : t.inactiveStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">{areaActions(area)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coverage-modal-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#ebd69b] bg-[#fff8e7] px-5 py-4 sm:px-6">
              <h2
                id="coverage-modal-title"
                className="text-lg font-extrabold text-[#292319] sm:text-xl"
              >
                {editingId !== null ? t.edit : t.add}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl font-bold text-[#756b58] hover:bg-[#f3e7c8] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#292319]">
                  {t.city}
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t.cityPlaceholder}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#292319]">
                  {t.area}
                </label>

                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder={t.areaPlaceholder}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm text-[#292319] outline-none focus:border-[#e9a900]"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#f1e5c4] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-[#ebd69b] px-5 py-3 text-sm font-bold text-[#756b58] transition hover:bg-[#fff8e7] disabled:opacity-50"
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#f5b91b] px-5 py-3 text-sm font-extrabold text-[#292319] transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? t.wait
                    : editingId !== null
                      ? t.updateButton
                      : t.addButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

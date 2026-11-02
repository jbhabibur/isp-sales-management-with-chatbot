"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type AgentCreateData,
  type AgentUpdateData,
  type SalesAgent,
  createAgent,
  deleteAgent,
  getAgents,
  getCurrentUser,
  getStoredUser,
  logout,
  updateAgent,
  updateAgentStatus,
} from "@/lib/api";

import { useLanguage } from "@/app/components/LanguageProvider";
import AdminPageLayout from "../../components/AdminPageLayout";

export default function AdminAgentsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const t = {
    title: "Sales Agent Management",
    subtitle: isBn
      ? "Sales Agent তৈরি, তথ্য পরিবর্তন এবং Account পরিচালনা করুন।"
      : "Create, edit and manage sales agent accounts.",
    total: isBn ? "মোট Agent" : "Total Agents",
    active: isBn ? "Active Agent" : "Active Agents",
    inactive: isBn ? "Inactive Agent" : "Inactive Agents",
    search: isBn ? "নাম বা Email দিয়ে খুঁজুন..." : "Search by name or email...",
    found: isBn ? "জন Agent পাওয়া গেছে" : "agents found",
    create: isBn ? "নতুন Sales Agent তৈরি করুন" : "Create New Sales Agent",
    edit: isBn ? "Agent-এর তথ্য Edit করুন" : "Edit Sales Agent",
    fullName: isBn ? "পূর্ণ নাম" : "Full Name",
    namePlaceholder: isBn ? "Agent-এর নাম" : "Agent full name",
    password: "Password",
    passwordPlaceholder: isBn
      ? "কমপক্ষে ১২ অক্ষরের Password"
      : "Minimum 12 characters",
    passwordHelp: isBn
      ? "Password কমপক্ষে ১২ অক্ষরের হতে হবে।"
      : "Password must contain at least 12 characters.",
    createButton: isBn ? "Agent তৈরি করুন" : "Create Agent",
    updateButton: isBn ? "তথ্য Update করুন" : "Update Agent",
    cancel: isBn ? "বাতিল করুন" : "Cancel",
    list: isBn ? "Sales Agent তালিকা" : "Sales Agent List",
    listDescription: isBn
      ? "সব Agent-এর Account পরিচালনা করুন।"
      : "Manage all sales agent accounts.",
    name: isBn ? "নাম" : "Name",
    status: "Status",
    actions: isBn ? "কার্যক্রম" : "Actions",
    empty: isBn ? "কোনো Sales Agent পাওয়া যায়নি।" : "No sales agents found.",
    wait: isBn ? "অপেক্ষা করুন..." : "Please wait...",
    updating: "Updating...",
    deleting: "Deleting...",
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
  };

  const loadAgents = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");
        const data = await getAgents();
        setAgents(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isBn
              ? "Agent তালিকা লোড করা যায়নি"
              : "Could not load agents",
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
          logout();
          router.replace("/login");
          return;
        }

        await loadAgents();
      } catch {
        if (active) {
          logout();
          router.replace("/login");
        }
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [router, loadAgents]);

  function resetForm() {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setIsModalOpen(false);
  }

  function openCreateModal() {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function startEdit(agent: SalesAgent) {
    setEditingId(agent.id);
    setFullName(agent.full_name);
    setEmail(agent.email);
    setPassword("");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        const data: AgentUpdateData = {
          full_name: fullName.trim(),
          email: email.trim(),
        };

        await updateAgent(editingId, data);

        setSuccess(
          isBn ? "Agent-এর তথ্য আপডেট হয়েছে" : "Agent updated successfully",
        );
      } else {
        const data: AgentCreateData = {
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        };

        await createAgent(data);

        setSuccess(
          isBn
            ? "নতুন Sales Agent তৈরি হয়েছে"
            : "Sales agent created successfully",
        );
      }

      resetForm();
      await loadAgents(false);
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

  async function handleStatusToggle(agent: SalesAgent) {
    const action = agent.is_active
      ? isBn
        ? "Inactive"
        : "deactivate"
      : isBn
        ? "Active"
        : "activate";

    if (
      !window.confirm(
        isBn
          ? `আপনি কি এই Agent-কে ${action} করতে চান?`
          : `Are you sure you want to ${action} this agent?`,
      )
    ) {
      return;
    }

    setUpdatingId(agent.id);
    setError("");
    setSuccess("");

    try {
      await updateAgentStatus(agent.id, !agent.is_active);

      setSuccess(
        isBn
          ? "Agent-এর Status পরিবর্তন হয়েছে"
          : "Agent status updated successfully",
      );

      await loadAgents(false);
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

  async function handleDelete(agent: SalesAgent) {
    const confirmed = window.confirm(
      isBn
        ? `আপনি কি ${agent.full_name}-কে Delete করতে চান? এই কাজটি ফেরত নেওয়া যাবে না।`
        : `Delete ${agent.full_name}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(agent.id);
    setError("");
    setSuccess("");

    try {
      await deleteAgent(agent.id);

      setSuccess(
        isBn ? "Agent Delete করা হয়েছে" : "Agent deleted successfully",
      );

      if (editingId === agent.id) resetForm();

      await loadAgents(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isBn
            ? "Agent Delete করা যায়নি"
            : "Could not delete agent",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = agents.filter((agent) => agent.is_active).length;
  const inactiveCount = agents.length - activeCount;

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return agents;

    return agents.filter(
      (agent) =>
        agent.full_name.toLowerCase().includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        String(agent.id).includes(query),
    );
  }, [agents, search]);

  const stats = [
    {
      label: t.total,
      value: agents.length,
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

  function agentActions(agent: SalesAgent) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => startEdit(agent)}
          className="rounded-lg border border-[#ebd69b] px-3 py-2 text-xs font-bold hover:bg-[#fff3cf]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => handleStatusToggle(agent)}
          disabled={updatingId === agent.id || deletingId === agent.id}
          className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${
            agent.is_active
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {updatingId === agent.id
            ? t.updating
            : agent.is_active
              ? t.deactivate
              : t.activate}
        </button>

        <button
          type="button"
          onClick={() => handleDelete(agent)}
          disabled={deletingId === agent.id || updatingId === agent.id}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deletingId === agent.id ? t.deleting : t.delete}
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
      onRefresh={() => loadAgents(false)}
      onLogout={() => {
        logout();
        router.replace("/login");
      }}
      error={error}
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t.search}
      totalCount={filteredAgents.length}
      foundText={t.found}
    >
      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Agent List Header */}
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
            + {t.create}
          </button>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#756b58] sm:p-10">
            {t.empty}
          </div>
        ) : (
          <>
            {/* Mobile Agent Cards */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:hidden">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="min-w-0 rounded-xl border border-[#ebd69b] bg-[#fffcf3] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#a47712]">
                        #{agent.id}
                      </p>
                      <h3 className="mt-1 break-words font-bold text-[#292319]">
                        {agent.full_name}
                      </h3>
                      <p className="mt-1 break-all text-sm text-[#756b58]">
                        {agent.email}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        agent.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {agent.is_active ? t.activeStatus : t.inactiveStatus}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-[#ebd69b] pt-3">
                    {agentActions(agent)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Agent Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#fff8e7] text-[#756b58]">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">{t.name}</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">{t.status}</th>
                    <th className="px-5 py-4">{t.actions}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f2e6c5]">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-[#fffcf3]">
                      <td className="px-5 py-4 font-bold">#{agent.id}</td>
                      <td className="px-5 py-4 font-semibold">
                        {agent.full_name}
                      </td>
                      <td className="px-5 py-4">{agent.email}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            agent.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {agent.is_active ? t.activeStatus : t.inactiveStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">{agentActions(agent)}</td>
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
            if (e.target === e.currentTarget && !saving) resetForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-modal-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#ebd69b] bg-[#fff8e7] px-5 py-4 sm:px-6">
              <h2
                id="agent-modal-title"
                className="text-lg font-extrabold text-[#292319] sm:text-xl"
              >
                {editingId !== null ? t.edit : t.create}
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

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-[#292319]">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm outline-none focus:border-[#e19112]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#292319]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm outline-none focus:border-[#e19112]"
                />
              </div>

              {editingId === null && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#292319]">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full rounded-xl border border-[#ebd69b] bg-[#fffcf3] px-4 py-3 text-sm outline-none focus:border-[#e19112]"
                  />
                  <p className="mt-2 text-xs text-[#756b58]">
                    {t.passwordHelp}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#f2e6c5] pt-5 sm:flex-row sm:justify-end">
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
                      : t.createButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

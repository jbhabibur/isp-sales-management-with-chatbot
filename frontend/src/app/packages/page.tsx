"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PublicHeader from "../components/PublicHeader";
import { useLanguage } from "../components/LanguageProvider";
import { getPackages, createOrder, type Package } from "@/lib/api";

export default function PackagesPage() {
  const { language } = useLanguage();
  const pathname = usePathname();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    city: "",
    customCity: "",
    address: "",
    package_id: "",
  });

  const content = {
    bn: {
      eyebrow: "সার্কেল নেটওয়ার্ক",
      title: "আমাদের ইন্টারনেট প্যাকেজ",
      description: "আপনার প্রয়োজন অনুযায়ী পছন্দের ইন্টারনেট প্যাকেজ বেছে নিন।",
      speed: "ইন্টারনেট স্পিড",
      month: "/ মাস",
      request: "নতুন সংযোগ নিন",
      loading: "প্যাকেজ লোড হচ্ছে...",
      empty: "দুঃখিত, বর্তমানে কোনো প্যাকেজ পাওয়া যাচ্ছে না।",
      error:
        "দুঃখিত, প্যাকেজগুলো লোড করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
      popular: "জনপ্রিয় প্যাকেজ",

      newConnection: "নতুন সংযোগ",
      back: "ফিরে যান",
      connectionDescription:
        "নতুন ইন্টারনেট সংযোগের জন্য নিচের তথ্যগুলো পূরণ করুন।",

      name: "আপনার নাম",
      phone: "মোবাইল নম্বর",
      city: "শহর নির্বাচন করুন",
      other: "অন্যান্য",
      customCity: "শহরের নাম লিখুন",
      address: "সম্পূর্ণ ঠিকানা",
      package: "প্যাকেজ নির্বাচন করুন",

      submit: "অনুরোধ জমা দিন",
      submitting: "জমা হচ্ছে...",

      success: "আপনার অনুরোধ সফলভাবে জমা হয়েছে।",
      lead: "আপনার এলাকায় এখনো আমাদের সেবা নেই। ভবিষ্যতের জন্য আপনার তথ্য সংরক্ষণ করা হয়েছে।",
      submitError: "অনুরোধ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
    },

    en: {
      eyebrow: "CIRCLE NETWORK",
      title: "Our Internet Packages",
      description: "Choose the internet package that best suits your needs.",
      speed: "Internet Speed",
      month: "/ month",
      request: "Get a New Connection",
      loading: "Loading packages...",
      empty: "Sorry, no packages are currently available.",
      error:
        "Sorry, we couldn't load the packages. Please try again in a few moments.",
      popular: "Popular Package",

      newConnection: "New Connection",
      back: "Go Back",
      connectionDescription:
        "Fill in the following information to request a new internet connection.",

      name: "Your Name",
      phone: "Phone Number",
      city: "Select City",
      other: "Other",
      customCity: "Enter City Name",
      address: "Full Address",
      package: "Select Package",

      submit: "Submit Request",
      submitting: "Submitting...",

      success: "Your request has been submitted successfully.",
      lead: "Your area is not covered yet. Your information has been saved for future service.",
      submitError: "Could not submit your request. Please try again.",
    },
  };

  const t = content[language];

  // Format numbers according to selected language
  function formatNumber(value: number | string) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return String(value);
    }

    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(
      number,
    );
  }

  // Translate package names
  function formatPackageName(name: string) {
    if (language === "en") return name;

    const names: Record<string, string> = {
      Basic: "ব্যাসিক",
      Standard: "স্টান্ডার্ড",
      Premium: "প্রিমিয়াম",
    };

    return names[name.trim()] || name;
  }

  // Translate internet speed
  function formatSpeed(speed: string) {
    if (language === "en") return speed;

    return speed
      .replace(/Mbps/gi, "এমবিপিএস")
      .replace(/Gbps/gi, "জিবিপিএস")
      .replace(/\d+/g, (number) => formatNumber(number));
  }

  // Format package price
  function formatPrice(price: number | string) {
    return `৳${formatNumber(price)}`;
  }

  // Reset connection form whenever route changes
  useEffect(() => {
    setShowForm(false);
    setMessage("");
    setMessageType("");
  }, [pathname]);

  // Load packages
  useEffect(() => {
    let active = true;

    async function loadPackages() {
      try {
        const data = await getPackages();

        if (active) {
          setPackages(data);
          setError("");
        }
      } catch {
        if (active) {
          setError(t.error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      active = false;
    };
  }, [t.error]);

  // Open connection form with selected package
  function handleRequestConnection(pkg: Package) {
    setForm({
      customer_name: "",
      phone: "",
      city: "",
      customCity: "",
      address: "",
      package_id: String(pkg.id),
    });

    setMessage("");
    setMessageType("");
    setShowForm(true);
  }

  // Go back to packages
  function handleBack() {
    setShowForm(false);
    setMessage("");
    setMessageType("");
  }

  // Update form
  function updateForm(name: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  }

  // Submit connection request
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await createOrder({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),

        city: form.city === "OTHER" ? form.customCity.trim() : form.city,

        area: "",

        address: form.address.trim(),
        package_id: Number(form.package_id),
      });

      if (result.covered) {
        setMessage(
          `${t.success} Order ID: ${result.order_id} | Status: ${result.status}`,
        );
      } else {
        setMessage(t.lead);
      }

      setMessageType("success");

      setForm({
        customer_name: "",
        phone: "",
        city: "",
        customCity: "",
        address: "",
        package_id: "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.submitError);

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-white px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-background">
        {/* Page Hero */}
        {!showForm && (
          <section className="relative overflow-hidden bg-gradient-to-r from-[#ffe9a6] via-[#f5c542] to-[#f5b91b] px-6 py-16">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />

            <div className="relative mx-auto max-w-6xl text-center">
              <p className="mb-4 text-sm font-bold tracking-[0.2em] text-[#69501a]">
                {t.eyebrow}
              </p>

              <h1 className="text-3xl font-extrabold text-[#292319] sm:text-5xl">
                {t.title}
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#51452d] sm:text-lg">
                {t.description}
              </p>
            </div>
          </section>
        )}

        {/* Packages Section */}
        {!showForm && (
          <section className="mx-auto max-w-6xl px-6 py-14">
            <div className="mb-9 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {t.popular}
              </h2>

              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
            </div>

            {loading && (
              <p className="py-12 text-center text-muted-foreground">
                {t.loading}
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700"
              >
                {error}
              </p>
            )}

            {!loading && !error && packages.length === 0 && (
              <p className="rounded-lg border border-border bg-secondary p-8 text-center text-muted-foreground">
                {t.empty}
              </p>
            )}

            {!loading && !error && packages.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                  <article
                    key={pkg.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                  >
                    {/* Package Header */}
                    <div className="bg-gradient-to-r from-[#fff3cf] to-[#ffe9a6] px-6 py-5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg">
                          🌐
                        </span>

                        <span className="text-xs font-bold tracking-wider text-[#75602c]">
                          {language === "bn"
                            ? "সার্কেল নেটওয়ার্ক"
                            : "CIRCLE NETWORK"}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-[#292319]">
                        {formatPackageName(pkg.name)}
                      </h3>
                    </div>

                    {/* Package Details */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="py-4 text-center">
                        <p className="text-4xl font-extrabold text-[#d99b00]">
                          {formatSpeed(pkg.speed)}
                        </p>

                        <p className="mt-2 text-sm font-medium text-muted-foreground">
                          {t.speed}
                        </p>
                      </div>

                      <div className="my-3 border-t border-dashed border-border" />

                      <div className="py-3 text-center">
                        <p className="text-3xl font-extrabold text-foreground">
                          {formatPrice(pkg.monthly_price)}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {t.month}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRequestConnection(pkg)}
                        className="mt-auto block w-full rounded-lg bg-primary px-4 py-3 text-center font-bold text-primary-foreground shadow-sm transition hover:bg-[#e9a900]"
                      >
                        {t.request}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* New Connection Form */}
        {showForm && (
          <section className="mx-auto max-w-3xl px-6 py-12">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-md">
              {/* Form Header */}
              <div className="flex items-center justify-between gap-4 border-b border-border bg-gradient-to-r from-[#fff3cf] to-[#ffe9a6] px-6 py-5">
                <div>
                  <p className="text-xs font-bold tracking-widest text-[#75602c]">
                    {language === "bn" ? "সার্কেল নেটওয়ার্ক" : "CIRCLE NETWORK"}
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-[#292319]">
                    {t.newConnection}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-[#292319]/20 bg-white/50 px-4 py-2 text-sm font-semibold text-[#292319] transition hover:bg-white"
                >
                  ← {t.back}
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:p-8">
                <p className="mb-6 text-sm leading-6 text-muted-foreground">
                  {t.connectionDescription}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Customer Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {t.name}
                    </label>

                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder={t.name}
                      value={form.customer_name}
                      onChange={(e) =>
                        updateForm("customer_name", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {t.phone}
                    </label>

                    <input
                      required
                      type="tel"
                      minLength={6}
                      maxLength={20}
                      placeholder={t.phone}
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {t.city}
                    </label>

                    <select
                      required
                      value={form.city}
                      onChange={(e) => {
                        setForm((previous) => ({
                          ...previous,
                          city: e.target.value,
                          customCity: "",
                        }));

                        setMessage("");
                        setMessageType("");
                      }}
                      className={inputClass}
                    >
                      <option value="">{t.city}</option>
                      <option value="Dhaka">Dhaka</option>
                      <option value="OTHER">{t.other}</option>
                    </select>
                  </div>

                  {/* Custom City */}
                  {form.city === "OTHER" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-foreground">
                        {t.customCity}
                      </label>

                      <input
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder={t.customCity}
                        value={form.customCity}
                        onChange={(e) =>
                          updateForm("customCity", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}

                  {/* Address */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {t.address}
                    </label>

                    <textarea
                      required
                      minLength={5}
                      maxLength={500}
                      rows={3}
                      placeholder={t.address}
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Package */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {t.package}
                    </label>

                    <select
                      required
                      value={form.package_id}
                      onChange={(e) => updateForm("package_id", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">{t.package}</option>

                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {formatPackageName(pkg.name)} -{" "}
                          {formatSpeed(pkg.speed)} -{" "}
                          {formatPrice(pkg.monthly_price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-sm transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? t.submitting : t.submit}
                  </button>
                </form>

                {/* Response Message */}
                {message && (
                  <div
                    role="status"
                    className={`mt-6 rounded-lg border p-4 text-sm leading-6 ${
                      messageType === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[#ebd69b] bg-[#fff8e7] text-[#51452d]"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-secondary px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>
    </>
  );
}

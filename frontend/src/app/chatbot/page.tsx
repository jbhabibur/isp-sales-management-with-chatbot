"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PublicHeader from "../components/PublicHeader";
import { useLanguage } from "../components/LanguageProvider";

import {
  getPackages,
  getCoverageAreas,
  createOrder,
  createCallback,
  type Package,
  type CoverageArea,
} from "@/lib/api";

type ChatbotOption = "packages" | "connection" | "agent" | null;

export default function ChatbotPage() {
  const { language } = useLanguage();
  const pathname = usePathname();

  const [option, setOption] = useState<ChatbotOption>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [coverage, setCoverage] = useState<CoverageArea[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [callbackSubmitting, setCallbackSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    city: "",
    customCity: "",
    area: "",
    customArea: "",
    address: "",
    package_id: "",
  });

  const [callbackForm, setCallbackForm] = useState({
    customer_name: "",
    phone: "",
    message: "",
  });

  // Format numbers according to selected language
  function formatNumber(value: number | string) {
    const number = Number(value);

    if (!Number.isFinite(number)) return value.toString();

    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(
      number,
    );
  }

  // Format package speed
  function formatSpeed(speed: string) {
    if (language === "en") return speed;

    return speed
      .replace(/Mbps/gi, "এমবিপিএস")
      .replace(/Gbps/gi, "জিবিপিএস")
      .replace(/\d+/g, (number) => formatNumber(number));
  }

  function formatPackageName(name: string) {
    if (language === "en") return name;

    const names: Record<string, string> = {
      Basic: "ব্যাসিক",
      Standard: "স্ট্যান্ডার্ড",
      Premium: "প্রিমিয়াম",
    };

    return names[name] || name;
  }

  // Format package price
  function formatPrice(price: number) {
    return `৳${formatNumber(price)}`;
  }

  const t = {
    bn: {
      eyebrow: "সার্কেল নেটওয়ার্ক",
      title: "আপনাকে কীভাবে সাহায্য করতে পারি?",
      subtitle: "নিচের অপশন থেকে আপনার প্রয়োজনীয় সেবাটি নির্বাচন করুন",

      packages: "প্যাকেজ দেখুন",
      packagesDesc: "আমাদের ইন্টারনেট প্যাকেজ ও মূল্য দেখুন",

      connection: "নতুন সংযোগ",
      connectionDesc: "নতুন ইন্টারনেট সংযোগের জন্য আবেদন করুন",

      agent: "এজেন্টের সাথে কথা বলুন",
      agentDesc: "আপনার ফোন নম্বরে কল পাওয়ার অনুরোধ করুন",

      name: "আপনার নাম",
      phone: "মোবাইল নম্বর",
      city: "শহর নির্বাচন করুন",
      area: "এলাকা নির্বাচন করুন",
      other: "অন্যান্য",
      customCity: "শহরের নাম লিখুন",
      customArea: "এলাকার নাম লিখুন",
      address: "সম্পূর্ণ ঠিকানা",
      package: "প্যাকেজ নির্বাচন করুন",

      submit: "অনুরোধ জমা দিন",
      callbackSubmit: "কলব্যাক অনুরোধ পাঠান",

      callbackName: "আপনার নাম",
      callbackPhone: "মোবাইল নম্বর",
      callbackMessage: "আপনার কোনো কথা থাকলে লিখুন (ঐচ্ছিক)",

      submitting: "জমা হচ্ছে...",

      success: "আপনার অনুরোধ সফলভাবে জমা হয়েছে।",
      lead: "আপনার এলাকায় এখনো আমাদের সেবা নেই। ভবিষ্যতের জন্য আপনার তথ্য সংরক্ষণ করা হয়েছে।",
      callbackSuccess: "আপনার কলব্যাক অনুরোধ সফলভাবে জমা হয়েছে।",

      error: "অনুরোধ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
      noPackages: "বর্তমানে কোনো Active Package পাওয়া যায়নি।",
      noCoverage: "কোনো Coverage Area পাওয়া যায়নি।",

      speed: "ইন্টারনেট স্পিড",
      month: "/ মাস",
      back: "ফিরে যান",
      choose: "আপনার পছন্দের প্যাকেজ বেছে নিন",
    },

    en: {
      eyebrow: "CIRCLE NETWORK",
      title: "How Can We Help You?",
      subtitle: "Select the service you need from the options below",

      packages: "View Packages",
      packagesDesc: "Explore our internet packages and pricing",

      connection: "New Connection",
      connectionDesc: "Apply for a new internet connection",

      agent: "Talk to an Agent",
      agentDesc: "Request a callback from our sales team",

      name: "Your Name",
      phone: "Phone Number",
      city: "Select City",
      area: "Select Area",
      other: "Other",
      customCity: "Enter City Name",
      customArea: "Enter Area Name",
      address: "Full Address",
      package: "Select Package",

      submit: "Submit Request",
      callbackSubmit: "Request a Callback",

      callbackName: "Your Name",
      callbackPhone: "Phone Number",
      callbackMessage: "Your message (optional)",

      submitting: "Submitting...",

      success: "Your request has been submitted successfully.",
      lead: "Your area is not covered yet. Your information has been saved for future service.",
      callbackSuccess: "Your callback request has been submitted successfully.",

      error: "Could not submit your request. Please try again.",
      noPackages: "No active packages available at the moment.",
      noCoverage: "No coverage areas available.",

      speed: "Internet Speed",
      month: "/ month",
      back: "Go Back",
      choose: "Choose Your Preferred Package",
    },
  }[language];

  // Load packages and coverage areas
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [packageData, coverageData] = await Promise.all([
          getPackages(),
          getCoverageAreas(),
        ]);

        if (active) {
          setPackages(packageData);
          setCoverage(coverageData);
        }
      } catch {
        if (active) {
          setMessage(t.error);
          setMessageType("error");
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Reset chatbot whenever route changes
  useEffect(() => {
    setOption(null);

    setMessage("");
    setMessageType("");

    setForm({
      customer_name: "",
      phone: "",
      city: "",
      customCity: "",
      area: "",
      customArea: "",
      address: "",
      package_id: "",
    });

    setCallbackForm({
      customer_name: "",
      phone: "",
      message: "",
    });
  }, [pathname]);

  // Get unique cities from coverage API
  const cities = Array.from(new Set(coverage.map((item) => item.city)));

  // Get areas for selected city
  const areas = coverage.filter((item) => item.city === form.city);

  // Clear messages
  function clearMessage() {
    setMessage("");
    setMessageType("");
  }

  // Update connection form
  function updateForm(name: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearMessage();
  }

  // Update chatbot option
  function selectOption(value: ChatbotOption) {
    setOption(value);
    clearMessage();
  }

  // Submit new connection request
  async function handleOrderSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    clearMessage();

    try {
      const result = await createOrder({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),

        city: form.city === "OTHER" ? form.customCity.trim() : form.city,

        area:
          form.city === "OTHER" || form.area === "OTHER"
            ? form.customArea.trim()
            : form.area,

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
        area: "",
        customArea: "",
        address: "",
        package_id: "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  // Submit callback request
  async function handleCallbackSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCallbackSubmitting(true);
    clearMessage();

    try {
      const result = await createCallback({
        customer_name: callbackForm.customer_name.trim(),
        phone: callbackForm.phone.trim(),
        message: callbackForm.message.trim() || undefined,
      });

      setMessage(`${t.callbackSuccess} Callback ID: ${result.callback_id}`);

      setMessageType("success");

      setCallbackForm({
        customer_name: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
      setMessageType("error");
    } finally {
      setCallbackSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-white px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#fff0bd] via-[#f9d36d] to-[#f5b91b] px-6 py-14 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-3 text-sm font-bold tracking-[0.2em] text-[#75602c]">
              {t.eyebrow}
            </p>

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#292319]/10 bg-white/50 text-3xl shadow-sm">
              💬
            </div>

            <h1 className="text-3xl font-extrabold text-[#292319] sm:text-5xl">
              {t.title}
            </h1>

            <p className="mt-4 text-base text-[#51452d] sm:text-lg">
              {t.subtitle}
            </p>
          </div>
        </section>

        {/* Chatbot Content */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          {/* Three Chatbot Options */}
          <div className="grid gap-5 sm:grid-cols-3">
            {/* View Packages */}
            <button
              type="button"
              onClick={() => selectOption("packages")}
              className={`group rounded-2xl border bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg ${
                option === "packages"
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-3xl transition group-hover:bg-primary">
                📦
              </div>

              <h2 className="text-lg font-bold text-foreground">
                {t.packages}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.packagesDesc}
              </p>

              <div className="mt-5 font-bold text-primary">→</div>
            </button>

            {/* New Connection */}
            <button
              type="button"
              onClick={() => selectOption("connection")}
              className={`group rounded-2xl border bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg ${
                option === "connection"
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-3xl transition group-hover:bg-primary">
                🌐
              </div>

              <h2 className="text-lg font-bold text-foreground">
                {t.connection}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.connectionDesc}
              </p>

              <div className="mt-5 font-bold text-primary">→</div>
            </button>

            {/* Talk to Agent */}
            <button
              type="button"
              onClick={() => selectOption("agent")}
              className={`group rounded-2xl border bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg ${
                option === "agent"
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-3xl transition group-hover:bg-primary">
                🎧
              </div>

              <h2 className="text-lg font-bold text-foreground">{t.agent}</h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.agentDesc}
              </p>

              <div className="mt-5 font-bold text-primary">→</div>
            </button>
          </div>

          {/* Selected Option */}
          {option && (
            <section className="mt-9 overflow-hidden rounded-2xl border border-border bg-white shadow-md">
              {/* Panel Header */}
              <div className="flex items-center justify-between gap-4 border-b border-border bg-gradient-to-r from-[#fff3cf] to-[#ffe9a6] px-6 py-5">
                <div>
                  <p className="text-xs font-bold tracking-widest text-[#75602c]">
                    {language === "bn" ? "সার্কেল নেটওয়ার্ক" : "CIRCLE NETWORK"}
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-[#292319]">
                    {option === "packages"
                      ? t.packages
                      : option === "connection"
                        ? t.connection
                        : t.agent}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => selectOption(null)}
                  className="rounded-lg border border-[#292319]/20 bg-white/50 px-4 py-2 text-sm font-semibold text-[#292319] transition hover:bg-white"
                >
                  ← {t.back}
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {/* View Packages */}
                {option === "packages" && (
                  <div>
                    <h3 className="mb-6 text-xl font-bold text-foreground">
                      {t.choose}
                    </h3>

                    {packages.length === 0 && (
                      <p className="rounded-lg bg-secondary p-6 text-center text-muted-foreground">
                        {t.noPackages}
                      </p>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      {packages.map((pkg) => (
                        <article
                          key={pkg.id}
                          className="overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary hover:shadow-md"
                        >
                          <div className="bg-gradient-to-r from-[#fff3cf] to-[#ffe9a6] px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">🌐</span>

                              <span className="text-xs font-bold tracking-wider text-[#75602c]">
                                {language === "bn"
                                  ? "সার্কেল নেটওয়ার্ক"
                                  : "CIRCLE NETWORK"}
                              </span>
                            </div>

                            <h3 className="mt-2 text-lg font-bold text-[#292319]">
                              {formatPackageName(pkg.name)}
                            </h3>
                          </div>

                          <div className="p-5">
                            <p className="text-3xl font-extrabold text-[#d99b00]">
                              {formatSpeed(pkg.speed)}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {t.speed}
                            </p>

                            <div className="my-4 border-t border-dashed border-border" />

                            <p className="text-2xl font-extrabold text-foreground">
                              {formatPrice(pkg.monthly_price)}
                              <span className="ml-1 text-sm font-normal text-muted-foreground">
                                {t.month}
                              </span>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Connection */}
                {option === "connection" && (
                  <div>
                    <p className="mb-6 text-sm leading-6 text-muted-foreground">
                      {t.connectionDesc}
                    </p>

                    <form onSubmit={handleOrderSubmit} className="space-y-5">
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

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-foreground">
                            {t.city}
                          </label>

                          <select
                            required
                            value={form.city}
                            onChange={(e) => {
                              const value = e.target.value;

                              setForm((previous) => ({
                                ...previous,
                                city: value,
                                area: "",
                                customArea: "",
                                customCity: "",
                              }));

                              clearMessage();
                            }}
                            className={inputClass}
                          >
                            <option value="">{t.city}</option>

                            {cities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}

                            <option value="OTHER">{t.other}</option>
                          </select>
                        </div>

                        {form.city && form.city !== "OTHER" && (
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                              {t.area}
                            </label>

                            <select
                              required
                              value={form.area}
                              onChange={(e) =>
                                updateForm("area", e.target.value)
                              }
                              className={inputClass}
                            >
                              <option value="">{t.area}</option>

                              {areas.map((area) => (
                                <option key={area.id} value={area.area_name}>
                                  {area.area_name}
                                </option>
                              ))}

                              <option value="OTHER">{t.other}</option>
                            </select>
                          </div>
                        )}
                      </div>

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

                      {form.city &&
                        (form.city === "OTHER" || form.area === "OTHER") && (
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                              {t.customArea}
                            </label>

                            <input
                              required
                              minLength={2}
                              maxLength={100}
                              placeholder={t.customArea}
                              value={form.customArea}
                              onChange={(e) =>
                                updateForm("customArea", e.target.value)
                              }
                              className={inputClass}
                            />
                          </div>
                        )}

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
                          onChange={(e) =>
                            updateForm("address", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground">
                          {t.package}
                        </label>

                        <select
                          required
                          value={form.package_id}
                          onChange={(e) =>
                            updateForm("package_id", e.target.value)
                          }
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

                      <button
                        type="submit"
                        disabled={submitting || packages.length === 0}
                        className="w-full rounded-lg bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-sm transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? t.submitting : t.submit}
                      </button>
                    </form>
                  </div>
                )}

                {/* Talk to an Agent */}
                {option === "agent" && (
                  <div>
                    <p className="mb-6 text-sm leading-6 text-muted-foreground">
                      {t.agentDesc}
                    </p>

                    <form onSubmit={handleCallbackSubmit} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground">
                          {t.callbackName}
                        </label>

                        <input
                          required
                          minLength={2}
                          maxLength={100}
                          placeholder={t.callbackName}
                          value={callbackForm.customer_name}
                          onChange={(e) =>
                            setCallbackForm((previous) => ({
                              ...previous,
                              customer_name: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground">
                          {t.callbackPhone}
                        </label>

                        <input
                          required
                          type="tel"
                          minLength={6}
                          maxLength={20}
                          placeholder={t.callbackPhone}
                          value={callbackForm.phone}
                          onChange={(e) =>
                            setCallbackForm((previous) => ({
                              ...previous,
                              phone: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground">
                          {t.callbackMessage}
                        </label>

                        <textarea
                          maxLength={500}
                          rows={3}
                          placeholder={t.callbackMessage}
                          value={callbackForm.message}
                          onChange={(e) =>
                            setCallbackForm((previous) => ({
                              ...previous,
                              message: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={callbackSubmitting}
                        className="w-full rounded-lg bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-sm transition hover:bg-[#e9a900] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {callbackSubmitting ? t.submitting : t.callbackSubmit}
                      </button>
                    </form>
                  </div>
                )}

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
            </section>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-secondary px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>
    </>
  );
}

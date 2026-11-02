"use client";

import { useState } from "react";
import {
  getPackages,
  getCoverageAreas,
  createOrder,
  createCallback,
  type Package,
  type CoverageArea,
} from "@/lib/api";

import { useLanguage } from "./LanguageProvider";

type Option = "packages" | "connection" | "agent" | null;

export default function ChatWidget() {
  const { language, setLanguage } = useLanguage();
  const isBn = language === "bn";

  const [isOpen, setIsOpen] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [option, setOption] = useState<Option>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [areas, setAreas] = useState<CoverageArea[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [packageId, setPackageId] = useState("");

  const t = {
    title: isBn ? "সার্কেল নেটওয়ার্ক" : "Circle Network",
    online: isBn ? "অনলাইন সাপোর্ট" : "Online Support",
    welcome: isBn
      ? "আপনাকে স্বাগতম! কীভাবে সাহায্য করতে পারি?"
      : "Welcome! How can we help you?",
    packages: isBn ? "ইন্টারনেট প্যাকেজ দেখুন" : "View Packages",
    connection: isBn ? "নতুন সংযোগ নিন" : "New Connection",
    agent: isBn ? "এজেন্টের সাথে কথা বলুন" : "Talk to an Agent",
    back: isBn ? "ফিরে যান" : "Back",
    close: isBn ? "বন্ধ করুন" : "Close",
    loading: isBn ? "লোড হচ্ছে..." : "Loading...",
    name: isBn ? "আপনার নাম" : "Your Name",
    phone: isBn ? "মোবাইল নম্বর" : "Phone Number",
    city: isBn ? "শহর নির্বাচন করুন" : "Select City",
    area: isBn ? "এলাকা নির্বাচন করুন" : "Select Area",
    address: isBn ? "সম্পূর্ণ ঠিকানা" : "Full Address",
    package: isBn
      ? "ইন্টারনেট প্যাকেজ নির্বাচন করুন"
      : "Select Internet Package",
    submit: isBn ? "অনুরোধ জমা দিন" : "Submit Request",
    success: isBn
      ? "আপনার অনুরোধ সফলভাবে গ্রহণ করা হয়েছে।"
      : "Your request has been submitted successfully.",
    callbackSuccess: isBn
      ? "আপনার কলব্যাক অনুরোধ গ্রহণ করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।"
      : "Your callback request has been received. Our representative will contact you soon.",
    error: isBn
      ? "দুঃখিত, অনুরোধটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।"
      : "Sorry, your request could not be completed. Please try again.",
    empty: isBn
      ? "কোনো সক্রিয় প্যাকেজ পাওয়া যায়নি।"
      : "No active packages available.",
    price: isBn ? "টাকা/মাস" : "BDT/month",
    footer: isBn
      ? "Circle Network Customer Support"
      : "Circle Network Customer Support",
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#E19112] focus:ring-2 focus:ring-[#E19112]/15";

  const buttonClass =
    "w-full rounded-xl bg-[#E19112] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c77e0d] disabled:cursor-not-allowed disabled:opacity-50";

  const reset = () => {
    setOption(null);
    setMessage("");
    setCity("");
    setArea("");
    setCustomerName("");
    setPhone("");
    setAddress("");
    setPackageId("");
  };

  const openOption = async (selected: Option) => {
    setOption(selected);
    setMessage("");

    if (selected === "packages" || selected === "connection") {
      setLoading(true);

      try {
        const packageData = await getPackages();
        setPackages(packageData.filter((item) => item.is_active));

        if (selected === "connection") {
          const areaData = await getCoverageAreas();
          setAreas(areaData.filter((item) => item.is_active));
        }
      } catch {
        setMessage(t.error);
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  const cities = Array.from(new Set(areas.map((item) => item.city)));
  const availableAreas = areas.filter((item) => item.city === city);

  const submitConnection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await createOrder({
        customer_name: customerName,
        phone,
        city,
        area,
        address,
        package_id: Number(packageId),
      });

      if (result.covered) {
        setMessage(t.success);
      } else {
        setMessage(
          isBn
            ? "আপনার এলাকায় এখনো কভারেজ নেই। ভবিষ্যতের জন্য আপনার তথ্য সংরক্ষণ করা হয়েছে।"
            : "Your area is not covered yet. Your information has been saved for future service.",
        );
      }

      setMessageType("success");
    } catch {
      setMessage(t.error);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const submitCallback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createCallback({
        customer_name: customerName,
        phone,
      });

      setMessage(t.callbackSuccess);
      setMessageType("success");
    } catch {
      setMessage(t.error);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-3 flex h-[min(650px,calc(100dvh-110px))] w-[min(390px,calc(100vw-30px))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#E19112] px-4 py-4 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/60 bg-white text-sm font-bold text-[#E19112]">
                CN
              </div>

              <div>
                <h3 className="font-bold">{t.title}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/90">
                  <span className="h-2 w-2 rounded-full bg-green-300" />
                  {t.online}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t.close}
              className="rounded-full p-2 transition hover:bg-white/15"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#F7F8FA] p-4">
            {/* Bilingual Welcome Messages */}
            <div className="flex">
              <div className="max-w-[95%] rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-3.5 shadow-sm">
                <p className="text-sm font-bold text-gray-800">
                  Good Morning! / শুভ সকাল!
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="max-w-[95%] rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-3.5 shadow-sm">
                <p className="text-sm leading-6 text-gray-700">
                  Welcome to Circle Network Customer Service
                  <br />
                  সার্কেল নেটওয়ার্ক কাস্টমার সার্ভিসে আপনাকে স্বাগতম।
                </p>
              </div>
            </div>

            {/* Language Selection */}
            {!hasSelectedLanguage && (
              <div className="flex">
                <div className="max-w-[95%] space-y-3 rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Please select your preferred language
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      অনুগ্রহ করে আপনার পছন্দের ভাষা নির্বাচন করুন
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("en");
                        setHasSelectedLanguage(true);
                      }}
                      className="rounded-xl border border-[#E19112] py-2.5 text-sm font-semibold text-[#B87508] transition hover:bg-amber-50"
                    >
                      English
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("bn");
                        setHasSelectedLanguage(true);
                      }}
                      className="rounded-xl bg-[#E19112] py-2.5 text-sm font-semibold text-white transition hover:bg-[#c77e0d]"
                    >
                      বাংলা
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Options */}
            {hasSelectedLanguage && option === null && (
              <div className="space-y-3">
                <div className="flex">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-gray-100 bg-white p-3.5 shadow-sm">
                    <p className="text-sm text-gray-700">{t.welcome}</p>
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  <button
                    type="button"
                    onClick={() => openOption("packages")}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[#E19112] hover:bg-amber-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-lg">
                      📦
                    </span>
                    {t.packages}
                    <span className="ml-auto text-gray-400">›</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openOption("connection")}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[#E19112] hover:bg-amber-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-lg">
                      🌐
                    </span>
                    {t.connection}
                    <span className="ml-auto text-gray-400">›</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openOption("agent")}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[#E19112] hover:bg-amber-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-lg">
                      💬
                    </span>
                    {t.agent}
                    <span className="ml-auto text-gray-400">›</span>
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            {hasSelectedLanguage && option !== null && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-[#B87508] transition hover:bg-amber-100"
              >
                ← {t.back}
              </button>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E19112] border-t-transparent" />
                  {t.loading}
                </div>
              </div>
            )}

            {/* Packages */}
            {option === "packages" && !loading && (
              <div className="space-y-3">
                {packages.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
                    {t.empty}
                  </div>
                ) : (
                  packages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#E19112]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {item.name}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.speed}
                          </p>
                        </div>
                        <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-[#B87508]">
                          {isBn ? "সক্রিয়" : "Active"}
                        </span>
                      </div>

                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-lg font-bold text-[#E19112]">
                          ৳{item.monthly_price}
                          <span className="ml-1 text-xs font-normal text-gray-500">
                            / {t.price}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* New Connection */}
            {option === "connection" && !loading && (
              <form
                onSubmit={submitConnection}
                className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-gray-800">{t.connection}</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {isBn
                      ? "নতুন ইন্টারনেট সংযোগের জন্য তথ্য দিন।"
                      : "Provide your information to request a new connection."}
                  </p>
                </div>

                <input
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.name}
                  className={inputClass}
                />

                <input
                  required
                  minLength={6}
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phone}
                  className={inputClass}
                />

                <select
                  required
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setArea("");
                  }}
                  className={inputClass}
                >
                  <option value="">{t.city}</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  list="coverage-areas"
                  placeholder={t.area}
                  className={inputClass}
                />

                <datalist id="coverage-areas">
                  {availableAreas.map((item) => (
                    <option key={item.id} value={item.area_name} />
                  ))}
                </datalist>

                <input
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t.address}
                  className={inputClass}
                />

                <select
                  required
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t.package}</option>
                  {packages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.speed} (৳{item.monthly_price})
                    </option>
                  ))}
                </select>

                <button disabled={loading} className={buttonClass}>
                  {t.submit}
                </button>
              </form>
            )}

            {/* Callback Request */}
            {option === "agent" && (
              <form
                onSubmit={submitCallback}
                className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-xl">
                    ☎
                  </div>
                  <h4 className="font-bold text-gray-800">{t.agent}</h4>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {isBn
                      ? "আপনার নাম ও মোবাইল নম্বর দিন। আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।"
                      : "Enter your name and phone number. Our representative will contact you."}
                  </p>
                </div>

                <input
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.name}
                  className={inputClass}
                />

                <input
                  required
                  minLength={6}
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phone}
                  className={inputClass}
                />

                <button disabled={loading} className={buttonClass}>
                  {t.submit}
                </button>
              </form>
            )}

            {/* Success / Error Message */}
            {message && (
              <div
                role="status"
                className={`rounded-xl border p-3.5 text-sm leading-6 shadow-sm ${
                  messageType === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold">
                    {messageType === "success" ? "✓" : "!"}
                  </span>
                  <p>{message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-white px-4 py-3 text-center">
            <p className="text-[11px] font-medium text-gray-400">{t.footer}</p>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={t.title}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E19112] text-2xl text-white shadow-xl transition hover:scale-105 hover:bg-[#c77e0d]"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          "💬"
        )}
      </button>
    </div>
  );
}

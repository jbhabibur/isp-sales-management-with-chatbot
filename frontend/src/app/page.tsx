"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicHeader from "./components/PublicHeader";
import ChatWidget from "./components/ChatWidget";
import { useLanguage } from "./components/LanguageProvider";

export default function Home() {
  const { language } = useLanguage();
  const [activeSlide, setActiveSlide] = useState(0);

  const content = {
    bn: {
      packages: "ইন্টারনেট প্যাকেজ দেখুন",
      connection: "নতুন সংযোগ নিন",
      bannerAlt: "সার্কেল নেটওয়ার্ক - বিশ্বের সাথে সংযুক্ত থাকুন",
      promotions: "বিশেষ অফার ও প্রমোশন",
      promotionSubtitle: "আপনার জন্য রয়েছে আকর্ষণীয় সব অফার",
      previous: "পূর্ববর্তী",
      next: "পরবর্তী",
      ftpTitle: "সার্কেল নেটওয়ার্কের প্রধান এফটিপি সার্ভার",
      ftpDescription:
        "আপনার পছন্দের মুভি, নাটক, গান ও অন্যান্য বিনোদনমূলক কনটেন্ট উপভোগ করুন আমাদের FTP সার্ভারে।",
      visitFtp: "এফটিপি সার্ভার ভিজিট করুন",
      offersTitle: "আমাদের বিশেষ সুবিধা",
      offersSubtitle: "আপনার ইন্টারনেট অভিজ্ঞতা আরও সহজ ও উন্নত করতে",
      features: [
        {
          title: "দ্রুতগতির ইন্টারনেট",
          description: "উপভোগ করুন নিরবচ্ছিন্ন ও দ্রুতগতির ইন্টারনেট সংযোগ।",
          icon: "⚡",
        },
        {
          title: "২৪/৭ সাপোর্ট",
          description: "যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিম আপনার পাশে।",
          icon: "🎧",
        },
        {
          title: "সাশ্রয়ী প্যাকেজ",
          description: "আপনার প্রয়োজন অনুযায়ী পছন্দ করুন সাশ্রয়ী প্যাকেজ।",
          icon: "💰",
        },
        {
          title: "নির্ভরযোগ্য সংযোগ",
          description: "নির্ভরযোগ্য নেটওয়ার্কের মাধ্যমে থাকুন সবসময় সংযুক্ত।",
          icon: "🌐",
        },
      ],
    },
    en: {
      packages: "View Internet Packages",
      connection: "Request New Connection",
      bannerAlt: "Circle Network - Stay Connected to the World",
      promotions: "Special Offers & Promotions",
      promotionSubtitle: "Explore exciting offers made for you",
      previous: "Previous",
      next: "Next",
      ftpTitle: "Circle Network Main FTP Server",
      ftpDescription:
        "Enjoy your favorite movies, dramas, music and other entertainment content on our FTP server.",
      visitFtp: "Visit FTP Server",
      offersTitle: "Why Choose Circle Network?",
      offersSubtitle: "Making your internet experience easier and better",
      features: [
        {
          title: "High-Speed Internet",
          description: "Enjoy fast and uninterrupted internet connectivity.",
          icon: "⚡",
        },
        {
          title: "24/7 Support",
          description: "Our support team is always ready to help you.",
          icon: "🎧",
        },
        {
          title: "Affordable Packages",
          description: "Choose an affordable package that suits your needs.",
          icon: "💰",
        },
        {
          title: "Reliable Connection",
          description: "Stay connected with our reliable network.",
          icon: "🌐",
        },
      ],
    },
  };

  const t = content[language];

  const bannerImage =
    language === "bn"
      ? "/images/circle-network-banner-bn.png"
      : "/images/circle-network-banner-en.webp";

  // Dynamic Promotion slides array
  const slides = [
    {
      badgeBn: "স্পেশাল অফার",
      badgeEn: "Special Offer",
      bnTitle:
        "সার্কেল নেটওয়ার্কের ব্যবহারকারীদের জন্য পার্লে বাংলাদেশ পণ্যে ১০% ডিসকাউন্ট",
      enTitle:
        "10% Discount on Parle Bangladesh Products for Circle Network Users",
      bnDescription:
        "সার্কেল নেটওয়ার্ক ব্যবহারকারীদের জন্য পার্লে বাংলাদেশ-এর পণ্যে উপভোগ করুন বিশেষ ১০% ছাড়",
      enDescription:
        "Enjoy a special 10% discount on Parle Bangladesh products for Circle Network users",
      image: "/images/promotion-1.jpeg",
      link: "/packages",
      buttonBn: "অর্ডার করুন",
      buttonEn: "Order Now",
    },
    {
      badgeBn: "বিশেষ অফার",
      badgeEn: "Special Offer",
      bnTitle: "প্রথম মাসের বিলে ৩০% বিশেষ ছাড়!",
      enTitle: "30% Special Discount on the First Month's Bill!",
      bnDescription:
        "প্রতি মাসের ১৫-২৫ তারিখ পর্যন্ত নতুন সংযোগ নিলেই পাচ্ছেন।",
      enDescription:
        "Get it when taking a new connection from the 15th to the 25th of every month.",
      image: "/images/promotion-2.jpeg",
      link: "/packages",
      buttonBn: "সংযোগ নিন",
      buttonEn: "Get Connection",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const previousSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  };

  const nextSlide = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  const currentSlide = slides[activeSlide];

  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-[#fff8e7]">
        {/* Language Based Banner */}
        <section className="w-full">
          <Image
            src={bannerImage}
            alt={t.bannerAlt}
            width={1822}
            height={768}
            priority
            className="h-auto w-full"
          />
        </section>

        {/* Main Actions */}
        <section className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4 px-6 py-10">
          <Link
            href="/packages"
            className="rounded-lg bg-primary px-7 py-3 font-bold text-primary-foreground shadow-md transition hover:opacity-80"
          >
            {t.packages}
          </Link>

          <Link
            href="/chatbot"
            className="rounded-lg border-2 border-primary bg-white px-7 py-3 font-bold text-foreground transition hover:bg-secondary"
          >
            {t.connection}
          </Link>
        </section>

        {/* Dynamic Promotion Slider */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
          {/* Section Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {t.promotions}
            </h2>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              {t.promotionSubtitle}
            </p>
          </div>

          {/* Wrapper with relative positioning for buttons outside/edge */}
          <div className="relative px-0 sm:px-12">
            {/* Main Card Container */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg sm:rounded-2xl">
              <div className="grid grid-cols-1 items-center gap-6 p-6 lg:grid-cols-12 lg:p-8">
                {/* Left Side: Banner Content from Active Slide Array */}
                <div className="z-10 flex flex-col justify-center space-y-4 text-center lg:col-span-5 lg:text-left">
                  <div>
                    <span className="inline-block rounded-full bg-[#E19112]/10 px-3 py-1 text-xs font-semibold text-[#E19112] sm:text-sm">
                      {language === "bn"
                        ? currentSlide.badgeBn
                        : currentSlide.badgeEn}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
                    {language === "bn"
                      ? currentSlide.bnTitle
                      : currentSlide.enTitle}
                  </h3>

                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                    {language === "bn"
                      ? currentSlide.bnDescription
                      : currentSlide.enDescription}
                  </p>

                  <div className="flex justify-center pt-2 lg:justify-start">
                    <Link
                      href={currentSlide.link}
                      className="rounded-xl bg-[#E19112] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#c77d0e] active:scale-95 sm:text-base"
                    >
                      {language === "bn"
                        ? currentSlide.buttonBn
                        : currentSlide.buttonEn}
                    </Link>
                  </div>
                </div>

                {/* Right Side: 16:9 HD Image */}
                <div className="relative w-full lg:col-span-7">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm sm:rounded-xl">
                    <Image
                      key={currentSlide.image}
                      src={currentSlide.image}
                      alt={
                        language === "bn"
                          ? currentSlide.bnTitle
                          : currentSlide.enTitle
                      }
                      width={1600}
                      height={900}
                      priority={activeSlide === 0}
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* Slide Indicators inside the card at bottom */}
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-4">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                    className={`h-2 rounded-full shadow transition-all sm:h-2.5 ${
                      activeSlide === index
                        ? "w-7 bg-[#E19112] sm:w-9"
                        : "w-2 bg-gray-300 hover:bg-[#E19112] sm:w-2.5"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Buttons positioned at card boundary middle */}
            <button
              onClick={previousSlide}
              aria-label={t.previous}
              className="absolute left-0 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl font-bold text-gray-800 shadow-md backdrop-blur-sm transition hover:bg-[#E19112] hover:text-white sm:left-2 sm:h-11 sm:w-11 sm:text-2xl"
            >
              ‹
            </button>

            <button
              onClick={nextSlide}
              aria-label={t.next}
              className="absolute right-0 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl font-bold text-gray-800 shadow-md backdrop-blur-sm transition hover:bg-[#E19112] hover:text-white sm:right-2 sm:h-11 sm:w-11 sm:text-2xl"
            >
              ›
            </button>
          </div>
        </section>

        {/* Main FTP Server */}
        <section className="w-full px-0 pb-14">
          <div className="relative flex min-h-[280px] w-full items-center overflow-hidden bg-gradient-to-r from-[#171717] via-[#292019] to-[#E19112] px-8 py-12 text-white shadow-lg md:min-h-[340px] md:px-16">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#E19112]/20 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
              <div className="max-w-2xl text-center md:text-left">
                <span className="inline-block rounded-full border border-[#ffc45e]/40 bg-[#E19112]/20 px-4 py-2 text-xs font-bold tracking-wider text-[#ffc45e]">
                  MAIN FTP SERVER
                </span>

                <h2 className="mt-5 text-3xl font-bold md:text-5xl">
                  {t.ftpTitle}
                </h2>

                <p className="mt-4 text-sm leading-7 text-gray-200 md:text-base">
                  {t.ftpDescription}
                </p>

                <a
                  href="https://circleftp.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-3 rounded-lg bg-white px-7 py-3 font-bold text-[#bd790d] shadow-md transition hover:bg-[#fff3d8]"
                >
                  {t.visitFtp}
                  <span>↗</span>
                </a>
              </div>

              <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-7xl md:h-48 md:w-48">
                🎬
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Circle Network */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {t.offersTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              {t.offersSubtitle}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#f0dfbd] bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3d8] text-3xl">
                  {feature.icon}
                </div>

                <h3 className="mt-4 font-bold text-gray-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-[#fff3cf] px-6 py-6 text-center text-sm text-foreground">
        © {new Date().getFullYear()} Circle Network. All rights reserved.
      </footer>

      {/* Floating Customer Chat Widget */}
      <ChatWidget />
    </>
  );
}

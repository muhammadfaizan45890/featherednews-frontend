import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiArrowUp, FiFeather, FiChevronDown } from "react-icons/fi";

// Defined once, outside the component, so it isn't recreated on every render.
const TOC = [
  { id: "intro", label: "Introduction" },
  { id: "collection", label: "Information We Collect" },
  { id: "cookies", label: "Cookies" },
  { id: "thirdparty", label: "Third‑Party Services" },
  { id: "rights", label: "Your Rights" },
  { id: "security", label: "Data Security" },
  { id: "contact", label: "Contact Us" },
  { id: "changes", label: "Changes to This Policy" },
];

// Extra offset on mobile accounts for the sticky "jump to section" bar
// sitting above the content; desktop has no such bar.
const SCROLL_OFFSET_MOBILE = 116;
const SCROLL_OFFSET_DESKTOP = 80;

const Privacy = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState(TOC[0].id);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    const isMobile = () => window.innerWidth < 1024;

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      // Reading progress across the whole document.
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setReadProgress(total > 0 ? Math.min(Math.max(window.scrollY / total, 0), 1) * 100 : 0);

      // Update active section for the TOC / mobile dropdown.
      const offset = isMobile() ? SCROLL_OFFSET_MOBILE : SCROLL_OFFSET_DESKTOP;
      let current = TOC[0].id;
      for (const item of TOC) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = item.id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = window.innerWidth < 1024 ? SCROLL_OFFSET_MOBILE : SCROLL_OFFSET_DESKTOP;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 overflow-x-hidden" ref={contentRef}>
      {/* ─── Reading progress rail ─────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-zinc-800 z-40">
        <div
          className="h-full bg-black dark:bg-white motion-safe:transition-[width] motion-safe:duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ─── Hero Header ────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 py-10 xs:py-12 sm:py-16 px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 text-lg xs:text-xl font-black tracking-tight mb-3 sm:mb-4">
            <FiFeather className="text-black dark:text-white" size={18} />
            <span className="font-light text-gray-800 dark:text-gray-200">Feathered</span>
            <span className="font-extrabold text-black dark:text-white">NEWS</span>
          </div>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 sm:mt-3 text-sm xs:text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ─── Mobile: sticky jump-to-section dropdown ─────── */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-gray-200 dark:border-zinc-800 px-3 xs:px-4 sm:px-6 py-2.5">
        <label htmlFor="toc-select" className="sr-only">
          Jump to section
        </label>
        <div className="relative max-w-7xl mx-auto">
          <select
            id="toc-select"
            value={activeSection}
            onChange={(e) => scrollToSection(e.target.value)}
            className="w-full appearance-none bg-transparent border border-gray-300 dark:border-zinc-700 text-sm text-black dark:text-white px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {TOC.map((item) => (
              <option key={item.id} value={item.id} className="bg-white dark:bg-zinc-900">
                {item.label}
              </option>
            ))}
          </select>
          <FiChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ─── Table of Contents (desktop sidebar only; ──────
               mobile uses the sticky dropdown above instead) ── */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                On this page
              </h2>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm py-1.5 px-2 border-l-2 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white ${
                      activeSection === item.id
                        ? "border-black dark:border-white text-black dark:text-white font-medium"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.id);
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* ─── Content ────────────────────────────────────── */}
          <div className="lg:col-span-9">
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert prose-headings:text-black dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-red-500 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-700 dark:prose-li:text-gray-300">
              {/* ─── Introduction ────────────────────────────── */}
              <section id="intro" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Introduction</h2>
                <p>
                  At <strong>Feathered News</strong>, we take your privacy seriously. This policy explains how we collect,
                  use, and protect your personal information when you visit our website. By using our site, you agree to
                  the practices described here.
                </p>
                <p>
                  We are committed to being transparent about our data practices and to giving you control over your
                  information. If you have any questions, please see the <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>Contact</a> section below.
                </p>
              </section>

              {/* ─── Information We Collect ──────────────────── */}
              <section id="collection" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Information We Collect</h2>
                <p>We collect only the information necessary to provide and improve our service:</p>
                <ul>
                  <li>
                    <strong>Personal data:</strong> When you comment, subscribe, or contact us, we may collect your name,
                    email address, and any message you send.
                  </li>
                  <li>
                    <strong>Usage data:</strong> We automatically collect information about your device and how you use
                    our site, including IP address, browser type, pages visited, and time spent.
                  </li>
                  <li>
                    <strong>Cookies:</strong> We use cookies to remember your preferences, analyse traffic, and show
                    personalised ads. You can manage cookie settings in your browser.
                  </li>
                </ul>
              </section>

              {/* ─── Cookies ──────────────────────────────────── */}
              <section id="cookies" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Cookies</h2>
                <p>
                  Cookies are small text files stored on your device. We use them to:
                </p>
                <ul>
                  <li>Remember your settings and preferences.</li>
                  <li>Analyse site traffic and performance (via Google Analytics).</li>
                  <li>Deliver relevant ads (via Google AdSense).</li>
                </ul>
                <p>
                  You can disable cookies in your browser settings, but this may affect some features of the site.
                </p>
              </section>

              {/* ─── Third‑Party Services ────────────────────── */}
              <section id="thirdparty" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Third‑Party Services</h2>
                <p>We use trusted third‑party services to enhance our site:</p>
                <ul>
                  <li>
                    <strong>Google Analytics:</strong> Tracks visitor behaviour to help us improve content. Data is
                    anonymised where possible.
                  </li>
                  <li>
                    <strong>Google AdSense:</strong> Shows personalised ads. AdSense uses cookies and may collect data
                    about your browsing history.
                  </li>
                  <li>
                    <strong>Social media platforms:</strong> If you share our content, those platforms may collect data
                    according to their own privacy policies.
                  </li>
                </ul>
                <p>
                  These services have their own privacy policies, and we encourage you to review them.
                </p>
              </section>

              {/* ─── Your Rights ────────────────────────────── */}
              <section id="rights" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Your Rights</h2>
                <p>Depending on your location, you may have the following rights:</p>
                <ul>
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction or deletion of your data.</li>
                  <li>Object to processing of your data.</li>
                  <li>Withdraw consent at any time.</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us using the details in the <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>Contact</a> section.
                </p>
              </section>

              {/* ─── Data Security ───────────────────────────── */}
              <section id="security" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Data Security</h2>
                <p>
                  We take reasonable steps to protect your personal data from loss, misuse, and unauthorised access.
                  However, no transmission over the internet is completely secure, so we cannot guarantee absolute security.
                </p>
                <p>
                  We store data only as long as necessary for the purposes described in this policy.
                </p>
              </section>

              {/* ─── Contact Us ──────────────────────────────── */}
              <section id="contact" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Contact Us</h2>
                <p>
                  If you have any questions, concerns, or requests regarding this privacy policy, please reach out:
                </p>
                <ul>
                  <li><strong>Email:</strong> <a href="mailto:info@featherednews.com">info@featherednews.com</a></li>
                  <li><strong>Website:</strong> <Link to="/">featherednews.com</Link></li>
                </ul>
                <p>We aim to respond within 5 business days.</p>
              </section>

              {/* ─── Changes to This Policy ──────────────────── */}
              <section id="changes" className="scroll-mt-28 lg:scroll-mt-20">
                <h2>Changes to This Policy</h2>
                <p>
                  We may update this policy from time to time. The latest version will always be posted on this page,
                  with the “last updated” date at the top. We encourage you to review it periodically.
                </p>
                <p>
                  If we make significant changes, we will notify you via a notice on our website.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Back to Top ────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 bg-black dark:bg-white text-white dark:text-black p-2.5 sm:p-3 rounded-full shadow-lg motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <FiArrowUp size={18} className="sm:hidden" />
        <FiArrowUp size={20} className="hidden sm:block" />
      </button>
    </div>
  );
};

export default Privacy;

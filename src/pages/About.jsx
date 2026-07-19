import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FiArrowUp,
  FiCalendar,
  FiFeather,
  FiChevronRight,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

const About = () => {
//   const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeTab, setActiveTab] = useState("mission");
  const contentRef = useRef(null);

//   useEffect(() => {
//     const handleScroll = () => {
//       setShowBackToTop(window.scrollY > 400);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const timeline = [
    { year: "2020", event: "Blog Launched", description: "Started with a single post about Mars." },
    { year: "2021", event: "First Milestone", description: "Reached 1,000 monthly readers." },
    { year: "2022", event: "Team Expansion", description: "Welcomed our first writers." },
    { year: "2023", event: "Award Recognition", description: "Won Best Science Blog." },
    { year: "2024", event: "Global Reach", description: "Readers from over 50 countries." },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900" ref={contentRef}>
      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="border-b border-gray-200 dark:border-zinc-800 py-16 sm:py-20 md:py-28 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* <div className="inline-flex items-center justify-center text-2xl font-black tracking-tight mb-4">
            <FiFeather className="text-black mr-2 dark:text-white" />
            <span className="font-light text-gray-800 dark:text-gray-200">𝙵𝙴𝙰𝚃𝙷𝙴𝚁𝙴𝙳</span>
            <span className="font-extrabold text-black dark:text-white">PEN</span>
          </div> */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white">
            Stories That
            <br className="sm:hidden" />{" "}
            <span className="text-gray-500 dark:text-gray-400">Inspire & Inform</span>
          </h1>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            We're a team of passionate writers, scientists, and storytellers
            dedicated to bringing you the latest in space exploration,
            technology, and the wonders of the universe.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm uppercase tracking-wider"
            >
              Explore Our Stories
              <FiChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#mission"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white text-black dark:text-white font-semibold text-sm uppercase tracking-wider"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ─── Mission / Vision / Values ────────────────────── */}
      <section id="mission" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white">
              Our Mission
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              What drives us to share the stories of the cosmos.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
            {["mission", "vision", "values"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-medium border-2 ${
                  activeTab === tab
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-300 text-gray-700 dark:border-zinc-700 dark:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 md:p-10">
            {activeTab === "mission" && (
              <div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
                  To Inspire Curiosity
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                  Our mission is to make the wonders of space and science
                  accessible to everyone. We believe that understanding the
                  universe is a fundamental human right, and we're committed to
                  delivering accurate, engaging, and thought-provoking content
                  that sparks curiosity and fuels imagination.
                </p>
              </div>
            )}
            {activeTab === "vision" && (
              <div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
                  A Future of Discovery
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                  We envision a world where space exploration is a shared human
                  endeavor, where the boundaries of knowledge are pushed daily,
                  and where every person can look up at the stars with a sense
                  of wonder and understanding. Our vision is to be at the
                  forefront of this journey, bridging the gap between science
                  and the public.
                </p>
              </div>
            )}
            {activeTab === "values" && (
              <div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
                  Excellence, Integrity, Community
                </h3>
                <ul className="space-y-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span><strong>Excellence:</strong> We strive for the highest quality in every article and story we publish.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span><strong>Integrity:</strong> We are committed to factual accuracy, transparency, and ethical reporting.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white font-bold">•</span>
                    <span><strong>Community:</strong> We believe in the power of a curious community – we learn together, share together, and grow together.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Timeline ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-gray-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white">
              Our Journey
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Milestones that shaped our story.
            </p>
          </div>

          <div className="relative">
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-zinc-700 transform -translate-x-1/2" />

            {timeline.map((item, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center mb-8 sm:mb-12 last:mb-0 ${
                  idx % 2 === 0 ? "sm:pr-12" : "sm:pl-12"
                } ${idx % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}
              >
                <div className="hidden sm:block absolute left-1/2 w-4 h-4 rounded-full bg-black dark:bg-white border-4 border-white dark:border-black transform -translate-x-1/2 -translate-y-1/2 top-1 z-10" />

                <div
                  className={`w-full sm:w-1/2 p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 ${
                    idx % 2 === 0 ? "sm:mr-auto" : "sm:ml-auto"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <FiCalendar size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-semibold">{item.year}</span>
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-white mt-1">
                    {item.event}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Media ────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
            Follow Us
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
            Stay connected and join the conversation.
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-gray-600 dark:text-gray-400">
            <a
              href="https://facebook.com/featheredpen"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white"
              aria-label="Facebook"
            >
              <FaFacebookF size={28} className="sm:w-8 sm:h-8" />
            </a>
            <a
              href="https://x.com/featheredpen"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white"
              aria-label="X (Twitter)"
            >
              <FaXTwitter size={28} className="sm:w-8 sm:h-8" />
            </a>
            <a
              href="https://instagram.com/featheredpen"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white"
              aria-label="Instagram"
            >
              <FaInstagram size={28} className="sm:w-8 sm:h-8" />
            </a>
            <a
              href="https://linkedin.com/company/featheredpen"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn size={28} className="sm:w-8 sm:h-8" />
            </a>
            <a
              href="https://youtube.com/featheredpen1"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white"
              aria-label="YouTube"
            >
              <FaYoutube size={28} className="sm:w-8 sm:h-8" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Call to Action ────────────────────────────── */}
      {/* <section className="border-t border-gray-200 dark:border-zinc-800 py-16 sm:py-20 bg-black dark:bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white dark:text-black">
            Join Our Community
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-300 dark:text-gray-600 max-w-2xl mx-auto">
            Subscribe to our newsletter and never miss a story from the cosmos.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Subscribed! Welcome aboard.");
            }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 text-white dark:text-black placeholder-white/50 dark:placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-black"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white dark:bg-black text-black dark:text-white font-semibold text-sm uppercase tracking-wider"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section> */}

      {/* ─── Back to Top ────────────────────────────────── */}
      {/* <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 bg-black dark:bg-white text-white dark:text-black p-3 ${
          showBackToTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <FiArrowUp size={20} />
      </button> */}
    </div>
  );
};

export default About;
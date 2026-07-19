import React from "react";
import { Link } from "react-router-dom";
import { FiHome, FiArrowLeft, FiBookOpen, FiSearch } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      {/* Main Card */}
      <div className="max-w-2xl w-full text-center">
        {/* Decorative 404 */}
        <div className="relative mb-6 sm:mb-8">
          <h1 className="text-8xl sm:text-9xl md:text-[10rem] font-black leading-none tracking-tight text-zinc-200 dark:text-zinc-800 select-none">
            404
          </h1>
          {/* Overlay number with gradient */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl sm:text-8xl md:text-[7rem] font-black text-zinc-900 dark:text-white bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              404
            </span>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FiSearch size={28} className="sm:w-8 sm:h-8 text-zinc-600 dark:text-zinc-300" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
          Oops! Page Not Found
        </h2>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-300 hover:scale-105 shadow-sm"
          >
            <FiHome size={18} />
            Back to Home
          </Link>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-300"
          >
            <FiBookOpen size={18} />
            Browse Articles
          </Link>
        </div>

        {/* Additional helpful links */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-600">or</span>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <FiArrowLeft size={14} />
            Go back
          </button>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <Link to="/about" className="hover:text-zinc-900 dark:hover:text-white transition">
            About us
          </Link>
        </div>
      </div>

      {/* Decorative bottom element */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center text-xs text-zinc-400 dark:text-zinc-600">
        <span>Lost? We've got your back.</span>
      </div>
    </div>
  );
};

export default NotFound;
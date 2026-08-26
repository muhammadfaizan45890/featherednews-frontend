// // import Footer from '@/components/Footer'
// import Hero from '@/components/Hero'
// import HNews from '@/components/HNews'
// import LatestStories from '@/components/LatestStories'
// import React from 'react'
// import FeaturedStories from './FeaturedStories'

// const Home = () => {
//   return (
//     <div>
//       <Hero/>
//       <FeaturedStories/>
//       <LatestStories/>
//       <HNews/>
//       {/* <Footer/> */}
//     </div>
//   )
// }

// export default Home








import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '@/components/Hero';
import HNews from '@/components/HNews';
import LatestStories from '@/components/LatestStories';
import FeaturedStories from './FeaturedStories';
import API from '@/utils/api';
import axios from 'axios';

// ─── API instance ──────────────────────────────────────
const getApiInstance = () => {
  let instance;

  if (API && typeof API.get === 'function') {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

const api = getApiInstance();

// ─── Inline SVG fallback image ─────────────────────────
const getFallbackImage = () => {
  return 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22145%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2220%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3E%F0%9F%93%A2%20Advertise%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22170%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2216%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%3EYour%20ad%20could%20be%20here%3C%2Ftext%3E%3C%2Fsvg%3E';
};

// ─── Sandook Ad Card ───────────────────────────────────
const SandookAdCard = () => {
  const fallbackImg = getFallbackImage();
  const image = fallbackImg;

  const title = 'Purchase from Sandook.pk';
  const description =
    'Reach thousands of readers with a sponsored placement.';

  const brand = 'SANDOOK';
  const ctaText = 'Purchase →';
  const ctaLink = 'https://sandook.pk';

  const cardInner = (
    <div
      className="
        w-full
        border border-gray-300 dark:border-zinc-700
        bg-white dark:bg-zinc-900
        hover:border-gray-400 dark:hover:border-zinc-500
        transition-colors duration-150
        flex flex-row
        items-stretch
        overflow-hidden
      "
    >
      {/* Image */}
      <div
        className="
          relative
          w-[110px] h-[110px]
          sm:w-[180px] sm:h-[180px]
          md:w-[230px] md:h-[230px]
          lg:w-[280px] lg:h-[280px]
          flex-shrink-0
          bg-gray-100 dark:bg-zinc-800
          overflow-hidden
        "
      >
        <img
          src={image}
          alt="Sandook.pk advertisement"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = fallbackImg;
          }}
        />
      </div>

      {/* Text content */}
      <div
        className="
          flex-1
          min-w-0
          p-3
          sm:p-4
          md:p-5
          lg:p-6
          flex
          flex-col
          justify-center
        "
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="
              text-[8px]
              sm:text-[10px]
              font-bold
              text-green-700 dark:text-green-500
              border border-green-700 dark:border-green-500
              rounded-[2px]
              px-1
              leading-tight
            "
          >
            Ad
          </span>

          <span
            className="
              text-[10px]
              sm:text-xs
              text-gray-500 dark:text-gray-400
              truncate
            "
          >
            sandook.pk
          </span>
        </div>

        <h3
          className="
            text-[13px]
            sm:text-base
            md:text-lg
            font-medium
            text-blue-800 dark:text-blue-400
            leading-snug
            line-clamp-2
            group-hover:underline
          "
        >
          {title}
        </h3>

        <p
          className="
            text-[10px]
            sm:text-[13px]
            md:text-sm
            text-gray-600 dark:text-gray-300
            mt-1
            leading-relaxed
            line-clamp-2
          "
        >
          {description}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="
              text-[10px]
              sm:text-xs
              font-bold
              tracking-wider
              text-gray-700 dark:text-gray-300
            "
          >
            {brand}
          </span>

          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="
              inline-flex
              items-center
              gap-1
              text-[10px]
              sm:text-xs
              font-semibold
              text-gray-700 dark:text-gray-200
              hover:text-black dark:hover:text-white
              transition
              whitespace-nowrap
            "
          >
            {ctaText}

            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-70"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <a
      href={ctaLink}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block w-full"
      aria-label={title}
    >
      {cardInner}
    </a>
  );
};

const Home = () => {
  const [adTop, setAdTop] = useState(null);
  const [adMiddle, setAdMiddle] = useState(null);
  const [adBottom, setAdBottom] = useState(null);
  const [adsLoading, setAdsLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setAdsLoading(true);

        const [topResult, middleResult, bottomResult] =
          await Promise.allSettled([
            api.get('/api/ads/current?slot=top'),
            api.get('/api/ads/current?slot=middle'),
            api.get('/api/ads/current?slot=bottom'),
          ]);

        const topAd =
          topResult.status === 'fulfilled' &&
          topResult.value?.data?.data
            ? topResult.value.data.data
            : null;

        const middleAd =
          middleResult.status === 'fulfilled' &&
          middleResult.value?.data?.data
            ? middleResult.value.data.data
            : null;

        const bottomAd =
          bottomResult.status === 'fulfilled' &&
          bottomResult.value?.data?.data
            ? bottomResult.value.data.data
            : null;

        setAdTop(topAd);
        setAdMiddle(middleAd);
        setAdBottom(bottomAd);
      } catch (error) {
        console.error('Error fetching ads:', error);

        setAdTop(null);
        setAdMiddle(null);
        setAdBottom(null);
      } finally {
        setAdsLoading(false);
      }
    };

    fetchAds();
  }, []);

  // ─── Google Ads-style card ────────────────────────────
  const renderAdCard = (ad) => {
    const fallbackImg = getFallbackImage();

    const image = ad?.image || fallbackImg;

    const title =
      ad?.title || 'Advertise with us';

    const description =
      ad?.description ||
      'Reach thousands of readers with a sponsored placement.';

    const ctaText =
      ad?.ctaText || 'Learn More';

    const ctaLink =
      ad?.ctaLink || '/advertise';

    const isExternal =
      ctaLink.startsWith('http://') ||
      ctaLink.startsWith('https://');

    let displayUrl = '';

    try {
      displayUrl = isExternal
        ? new URL(ctaLink).hostname.replace('www.', '')
        : `yoursite.com${ctaLink}`;
    } catch {
      displayUrl = ctaLink;
    }

    const cardInner = (
      <div
        className="
          w-full
          border border-gray-300 dark:border-zinc-700
          bg-white dark:bg-zinc-900
          hover:border-gray-400 dark:hover:border-zinc-500
          transition-colors duration-150
          flex flex-row
          items-stretch
          overflow-hidden
        "
      >
        {/* Advertisement Image */}
        <div
          className="
            relative
            w-[110px] h-[110px]
            sm:w-[180px] sm:h-[180px]
            md:w-[230px] md:h-[230px]
            lg:w-[280px] lg:h-[280px]
            flex-shrink-0
            bg-gray-100 dark:bg-zinc-800
            overflow-hidden
          "
        >
          <img
            src={image}
            srcSet={
              ad?.image
                ? `${image} 1x, ${image} 2x`
                : undefined
            }
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.src = fallbackImg;
            }}
          />
        </div>

        {/* Advertisement Content */}
        <div
          className="
            flex-1
            min-w-0
            p-3
            sm:p-4
            md:p-5
            lg:p-6
            flex
            flex-col
            justify-center
          "
        >
          {/* Ad label + URL */}
          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            <span
              className="
                flex-shrink-0
                text-[8px]
                sm:text-[10px]
                font-bold
                text-green-700 dark:text-green-500
                border border-green-700 dark:border-green-500
                rounded-[2px]
                px-1
                leading-tight
              "
            >
              Ad
            </span>

            <span
              className="
                text-[10px]
                sm:text-xs
                text-gray-500 dark:text-gray-400
                truncate
              "
            >
              {displayUrl}
            </span>
          </div>

          {/* Title */}
          <h3
            className="
              text-[13px]
              sm:text-base
              md:text-lg
              font-medium
              text-blue-800 dark:text-blue-400
              leading-snug
              line-clamp-2
              group-hover:underline
            "
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className="
              text-[10px]
              sm:text-[13px]
              md:text-sm
              text-gray-600 dark:text-gray-300
              mt-1
              leading-relaxed
              line-clamp-2
            "
          >
            {description}
          </p>

          {/* CTA */}
          <span
            className="
              mt-2
              inline-flex
              items-center
              gap-1
              text-[10px]
              sm:text-xs
              font-semibold
              text-gray-700 dark:text-gray-200
              w-fit
              whitespace-nowrap
            "
          >
            {ctaText}

            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-70"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    );

    return isExternal ? (
      <a
        href={ctaLink}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block w-full"
        aria-label={title}
      >
        {cardInner}
      </a>
    ) : (
      <Link
        to={ctaLink}
        className="group block w-full"
        aria-label={title}
      >
        {cardInner}
      </Link>
    );
  };

  return (
    <div>

      {/* ─── Hero ────────────────────────────────────────── */}
      <Hero />

      {/* Ad after Hero */}
      {!adsLoading && (
        <div className="w-full max-w-4xl mx-auto my-6 px-3 sm:px-4">
          {renderAdCard(adTop)}
        </div>
      )}

      {/* ─── Featured Stories ───────────────────────────── */}
      <FeaturedStories />

      {/* Ad after Featured Stories */}
      {!adsLoading && (
        <div className="w-full max-w-4xl mx-auto my-6 px-3 sm:px-4">
          {renderAdCard(adMiddle)}
        </div>
      )}

      {/* ─── Latest Stories ─────────────────────────────── */}
      <LatestStories />

      {/* Ad after Latest Stories */}
      {!adsLoading && (
        <div className="w-full max-w-4xl mx-auto my-6 px-3 sm:px-4">
          {renderAdCard(adBottom)}
        </div>
      )}

      {/* ─── HNews ───────────────────────────────────────── */}
      <HNews />

      {/* ─── Sandook Ad Card ────────────────────────────── */}
      {/*
      <div className="w-full max-w-4xl mx-auto my-6 px-3 sm:px-4">
        <SandookAdCard />
      </div>
      */}
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API from '../utils/api';
import { FiClock, FiCalendar, FiUser, FiPlay } from 'react-icons/fi';
import DOMPurify from 'dompurify';

const api = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

const AudioPage = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAudio = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/audio', { params: { page: pageNum, limit: 12 } });
      if (res.data.success) {
        setAudioList(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Fetch audio error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudio(page);
  }, [page]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">🎙️ Audio Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Listen to our latest episodes and audio content.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-zinc-700 rounded-lg h-48" />
            ))}
          </div>
        ) : audioList.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-xl">No audio content yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {audioList.map((audio) => (
                <div
                  key={audio._id}
                  className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-zinc-700"
                >
                  {audio.coverImage && (
                    <img
                      src={audio.coverImage}
                      alt={audio.title}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-black dark:text-white line-clamp-2">
                      {audio.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {audio.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <FiUser size={12} /> {audio.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar size={12} /> {new Date(audio.publishedAt).toLocaleDateString()}
                      </span>
                      {audio.duration && (
                        <span className="flex items-center gap-1">
                          <FiClock size={12} /> {audio.duration}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <div
                        className="audio-embed-container"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(audio.embedCode, {
                            ADD_TAGS: ['iframe'],
                            ADD_ATTR: ['src', 'allow', 'allowtransparency', 'allowfullscreen', 'loading', 'style', 'width', 'height', 'frameborder'],
                          }),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .audio-embed-container iframe {
          width: 100%;
          max-width: 100%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default AudioPage;

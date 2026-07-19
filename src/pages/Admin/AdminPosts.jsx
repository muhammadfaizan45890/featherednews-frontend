import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../../utils/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiImage,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink as FiLinkIcon,
  FiImage as FiImageIcon,
  FiType,
} from 'react-icons/fi';

// ─── Helper: reliable API instance ──────────────────
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

// ─── Toolbar Button ──────────────────────────────────
const ToolbarButton = ({ onClick, isActive, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-1 sm:p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-black text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-black'
    }`}
    aria-label={label}
    title={label}
  >
    <Icon size={14} className="sm:w-4 sm:h-4" />
  </button>
);

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    images: [],
    description: '',
    isPublished: true,
  });
  const [imageInput, setImageInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isInternalUpdate = useRef(false);

  // ─── Tiptap editor ──────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Write your article content here…',
      }),
    ],
    content: formData.description || '',
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      setFormData(prev => ({ ...prev, description: editor.getHTML() }));
      setTimeout(() => { isInternalUpdate.current = false; }, 0);
    },
  });

  // ─── Sync editor content ──────────────────────────────
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) return;

    const currentContent = editor.getHTML();
    const newContent = formData.description || '';
    if (currentContent !== newContent) {
      editor.commands.setContent(newContent);
    }
  }, [formData.description, editor]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/posts', {
        params: {
          page,
          limit: 9,
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
        },
      });

      setPosts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);

      const allCats = res.data.data.map((p) => p.category);
      setCategories(['All', ...new Set(allCats)]);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch posts');
      toast.error('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search, category]);

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData({ title: '', category: '', images: [], description: '', isPublished: true });
    setImageInput('');
    setModalOpen(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      category: post.category,
      images: post.images || [],
      description: post.description || '',
      isPublished: post.isPublished !== undefined ? post.isPublished : true,
    });
    setImageInput('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPost(null);
    setFormData({ title: '', category: '', images: [], description: '', isPublished: true });
    setImageInput('');
    if (editor) {
      editor.commands.setContent('');
    }
  };

  const handleImageAdd = () => {
    if (imageInput.trim() && formData.images.length < 10) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }));
      setImageInput('');
    }
  };

  const handleImageRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };

      const isEmptyDescription =
        !payload.description ||
        payload.description === '<p></p>' ||
        payload.description === '<p><br></p>' ||
        payload.description.trim() === '';
      if (isEmptyDescription) {
        toast.error('Please add content to the description.');
        setSubmitting(false);
        return;
      }

      if (!payload.images || payload.images.length === 0) {
        toast.error('Please add at least one image');
        setSubmitting(false);
        return;
      }

      let res;
      if (editingPost) {
        res = await api.patch(`/api/posts/${editingPost._id}`, payload);
        toast.success('Post updated successfully');
        setPosts(posts.map((p) => (p._id === editingPost._id ? res.data.data : p)));
      } else {
        res = await api.post('/api/posts', payload);
        toast.success('Post created successfully');
        setPosts([res.data.data, ...posts]);
      }
      closeModal();
      fetchPosts();
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Status code:', err.response?.status);

      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Operation failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/api/posts/${postId}`);
      toast.success('Post deleted');
      setPosts(posts.filter((p) => p._id !== postId));
      fetchPosts();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  // ─── Toolbar actions ──────────────────────────────────
  const setLink = () => {
    if (!editor) return;
    const url = window.prompt('Enter the URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Enter the image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // ─── Character count ──────────────────────────────────
  const getPlainTextLength = (html) => {
    if (!html) return 0;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent?.length || 0;
  };

  const charCount = getPlainTextLength(formData.description);

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Manage Posts</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Create, edit, and delete your articles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-black text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 text-xs sm:text-sm font-semibold"
        >
          <FiPlus size={16} className="sm:w-4 sm:h-4" /> New Post
        </button>
      </div>

      {/* ─── Search & Filter ─── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} className="sm:w-4 sm:h-4" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-xs sm:text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm focus:ring-2 focus:ring-black min-w-[100px] sm:min-w-[140px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={fetchPosts}
          className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <FiRefreshCw size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* ─── Posts Grid ─── */}
      {loading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-black border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-8 sm:py-12 text-red-500 text-sm sm:text-base">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-gray-500 text-sm sm:text-base">No posts found. Create your first post!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden bg-gray-100">
                {post.images && post.images.length > 0 ? (
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <FiImage size={28} className="sm:w-8 sm:h-8" />
                  </div>
                )}
                {post.images && post.images.length > 1 && (
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/70 text-white text-[8px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
                    +{post.images.length - 1}
                  </span>
                )}
                <span
                  className={`absolute top-1 right-1 sm:top-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[8px] sm:text-xs font-semibold ${
                    post.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {post.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold mt-1 line-clamp-2">{post.title}</h3>
                <div
                  className="text-gray-600 text-[10px] sm:text-xs md:text-sm line-clamp-2 mt-1 flex-1"
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
                <div className="mt-2 sm:mt-3 md:mt-4 flex items-center justify-between">
                  <span className="text-[8px] sm:text-[10px] text-gray-500">by {post.authorName || 'Admin'}</span>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-1 sm:p-1.5 text-gray-500 hover:text-black transition rounded hover:bg-gray-100"
                    >
                      <FiEdit2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="p-1 sm:p-1.5 text-gray-500 hover:text-red-600 transition rounded hover:bg-red-50"
                    >
                      <FiTrash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 sm:p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FiChevronLeft size={16} className="sm:w-4 sm:h-4" />
          </button>
          <span className="text-xs sm:text-sm font-medium">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-1.5 sm:p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FiChevronRight size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* ─── Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <FiX size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-xs sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-xs sm:text-sm"
                  required
                  placeholder="e.g., Technology, Travel, Food"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Images (URLs) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleImageAdd}
                    disabled={formData.images.length >= 10}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[8px] sm:text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {formData.images.length} / 10 images
                </p>
              </div>

              {/* ─── Tiptap Editor ─── */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description (content) *
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black">
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 p-1 sm:p-2 bg-gray-50 border-b border-gray-300">
                    <ToolbarButton
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      isActive={editor?.isActive('bold')}
                      icon={FiBold}
                      label="Bold"
                    />
                    <ToolbarButton
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      isActive={editor?.isActive('italic')}
                      icon={FiItalic}
                      label="Italic"
                    />
                    <ToolbarButton
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      isActive={editor?.isActive('underline')}
                      icon={FiUnderline}
                      label="Underline"
                    />
                    <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
                    <ToolbarButton
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      isActive={editor?.isActive('heading', { level: 2 })}
                      icon={FiType}
                      label="Heading"
                    />
                    <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
                    <ToolbarButton
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      isActive={editor?.isActive('bulletList')}
                      icon={FiList}
                      label="Bullet List"
                    />
                    <ToolbarButton
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      isActive={editor?.isActive('orderedList')}
                      icon={FiList}
                      label="Ordered List"
                    />
                    <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
                    <ToolbarButton
                      onClick={setLink}
                      isActive={editor?.isActive('link')}
                      icon={FiLinkIcon}
                      label="Link"
                    />
                    <ToolbarButton
                      onClick={addImage}
                      isActive={false}
                      icon={FiImageIcon}
                      label="Image"
                    />
                  </div>

                  <EditorContent
                    editor={editor}
                    className="p-2 sm:p-4 min-h-[150px] sm:min-h-[200px] md:min-h-[300px] prose prose-sm max-w-none focus:outline-none text-sm"
                  />
                </div>
                <div className="flex justify-end text-[10px] sm:text-xs text-gray-500 mt-1">
                  <span className={charCount > 5000 ? 'text-red-500' : ''}>
                    {charCount} characters (plain text)
                  </span>
                </div>
              </div>

              {/* ─── isPublished toggle ─── */}
              <div className="flex items-center gap-2 pt-2 sm:pt-4">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Publish:</label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublished: !prev.isPublished,
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black ${
                    formData.isPublished ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                      formData.isPublished ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs sm:text-sm text-gray-600">
                  {formData.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.images.length === 0}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-semibold text-xs sm:text-sm"
                >
                  {submitting ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
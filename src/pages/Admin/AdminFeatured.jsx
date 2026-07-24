import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../../utils/api';
import {
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiPlus,
  FiSearch,
  FiLoader,
  FiX,
} from 'react-icons/fi';

// ─── API instance ──────────────────────────────────────
const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Sortable Item ─────────────────────────────────────
const SortableItem = ({ item, index, onToggle, onDelete, processing }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id || item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const id = item._id || item.id;
  const isProcessing = processing[id] === 'toggling' || processing[id] === 'deleting';
  const isToggling = processing[id] === 'toggling';
  const isDeleting = processing[id] === 'deleting';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4
        hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors
        cursor-grab active:cursor-grabbing
        border-b border-gray-200 dark:border-zinc-700
        ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}
        ${isProcessing ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className="text-gray-400 text-sm font-mono w-6 flex-shrink-0">
          {index + 1}
        </span>
        <span className="text-gray-300 dark:text-gray-600 text-xs sm:hidden">↕</span>
      </div>

      <div className="flex-1 min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-black dark:text-white truncate">
            {item.post?.title || 'Untitled'}
          </span>
          <span className="text-xs bg-gray-200 dark:bg-zinc-600 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {item.post?.category || 'Uncategorized'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            item.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400'
          }`}>
            {item.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <button
          onClick={() => onToggle(id, item.isActive)}
          disabled={isProcessing}
          className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-50 p-1"
          title={item.isActive ? 'Deactivate' : 'Activate'}
        >
          {isToggling ? (
            <FiLoader size={20} className="animate-spin" />
          ) : item.isActive ? (
            <FiToggleRight size={24} className="text-green-600" />
          ) : (
            <FiToggleLeft size={24} className="text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onDelete(id)}
          disabled={isProcessing}
          className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
          title="Remove"
        >
          {isDeleting ? <FiLoader size={18} className="animate-spin" /> : <FiTrash2 size={20} />}
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton ──────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-zinc-700 animate-pulse">
    <div className="w-6 h-4 bg-gray-300 dark:bg-zinc-600 rounded" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-zinc-600 rounded w-3/4" />
      <div className="h-3 bg-gray-300 dark:bg-zinc-600 rounded w-1/4" />
    </div>
    <div className="flex gap-2">
      <div className="w-6 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full" />
      <div className="w-6 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full" />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────
const AdminFeatured = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [processing, setProcessing] = useState({}); // { id: 'toggling' | 'deleting' }
  const [addSearch, setAddSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ─── Fetch data ──────────────────────────────────────
  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/featured/admin');
      if (res.data.success) {
        setFeatured(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load featured');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error loading featured';
      toast.error(msg);
      console.error('Fetch featured error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllPosts = useCallback(async () => {
    try {
      const res = await api.get('/api/posts?limit=100');
      if (res.data.success) {
        setAllPosts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
    fetchAllPosts();
  }, [fetchFeatured, fetchAllPosts]);

  // ─── Filtered list ──────────────────────────────────
  const filteredFeatured = useMemo(() => {
    let items = featured;
    if (statusFilter === 'active') {
      items = items.filter((f) => f.isActive);
    } else if (statusFilter === 'inactive') {
      items = items.filter((f) => !f.isActive);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter((f) =>
        f.post?.title?.toLowerCase().includes(term) ||
        f.post?.category?.toLowerCase().includes(term)
      );
    }
    return items;
  }, [featured, statusFilter, searchTerm]);

  // ─── Drag & Drop ─────────────────────────────────────
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = filteredFeatured.findIndex((item) => (item._id || item.id) === active.id);
      const newIndex = filteredFeatured.findIndex((item) => (item._id || item.id) === over.id);
      const newOrder = arrayMove(filteredFeatured, oldIndex, newIndex);
      
      const fullNewOrder = featured.map((item) => {
        const found = newOrder.find((f) => (f._id || f.id) === (item._id || item.id));
        return found || item;
      });
      setFeatured(fullNewOrder);

      const reorderPayload = fullNewOrder.map((item, index) => ({
        id: item._id || item.id,
        order: index,
      }));

      try {
        await api.post('/api/featured/admin/reorder', { items: reorderPayload });
        toast.success('Order updated');
      } catch (error) {
        toast.error('Failed to reorder');
        fetchFeatured();
      }
    }
  };

  // ─── Toggle ─────────────────────────────────────────
  const toggleActive = async (id, currentStatus) => {
    if (!id) return;
    // Prevent double click
    if (processing[id]) return;
    setProcessing(prev => ({ ...prev, [id]: 'toggling' }));

    try {
      const res = await api.put(`/api/featured/admin/${id}`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        toast.success(`Featured ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchFeatured();
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error updating status';
      toast.error(msg);
      console.error('Toggle error:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [id]: undefined }));
    }
  };

  // ─── Delete ──────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!id) return;
    if (processing[id]) return;
    if (!window.confirm('Are you sure you want to remove this featured entry?')) return;
    
    setProcessing(prev => ({ ...prev, [id]: 'deleting' }));

    try {
      const res = await api.delete(`/api/featured/admin/${id}`);
      if (res.data.success) {
        toast.success('Featured entry removed');
        fetchFeatured();
      } else {
        toast.error(res.data.message || 'Delete failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Error deleting';
      toast.error(msg);
      console.error('Delete error details:', error.response || error);
    } finally {
      setProcessing(prev => ({ ...prev, [id]: undefined }));
    }
  };

  // ─── Add ─────────────────────────────────────────────
  const handleAdd = async (postId) => {
    if (!postId) {
      toast.error('Invalid post ID');
      return;
    }
    try {
      const res = await api.post('/api/featured/admin', { postId });
      if (res.data.success) {
        toast.success('Post added to featured');
        setShowAddModal(false);
        fetchFeatured();
      } else {
        toast.error(res.data.message || 'Add failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error adding featured';
      toast.error(msg);
      console.error('Add error:', error);
    }
  };

  const filteredAddPosts = allPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(addSearch.toLowerCase()) &&
      !featured.some((f) => (f.post?._id || f.post?.id) === p._id)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
            Featured Stories
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({featured.length})
            </span>
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <FiPlus size={20} /> Add New
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Clear search"
              >
                <FiX size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Main List */}
        {loading ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-zinc-700">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filteredFeatured.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' ? 'No matching featured stories.' : 'No featured stories yet.'}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredFeatured.map((item) => item._id || item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
                <div className="hidden sm:grid grid-cols-[40px,1fr,auto] gap-4 px-4 py-2 bg-gray-50 dark:bg-zinc-700 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-zinc-600">
                  <span>#</span>
                  <span>Title</span>
                  <span>Actions</span>
                </div>
                {filteredFeatured.map((item, index) => (
                  <SortableItem
                    key={item._id || item.id}
                    item={item}
                    index={index}
                    onToggle={toggleActive}
                    onDelete={handleDelete}
                    processing={processing}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ─── Add Modal ────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black dark:text-white">Add Featured Story</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts to feature..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredAddPosts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {addSearch ? 'No matching posts' : 'All posts are already featured'}
                </p>
              ) : (
                filteredAddPosts.map((post) => (
                  <button
                    key={post._id}
                    onClick={() => handleAdd(post._id)}
                    className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-3 group"
                  >
                    {post.images?.[0] && (
                      <img
                        src={post.images[0]}
                        alt=""
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black dark:text-white truncate">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {post.category}
                      </div>
                    </div>
                    <span className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full hover:opacity-80 transition-opacity">
                      Add
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700 text-center">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatured;

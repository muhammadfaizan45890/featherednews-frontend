// import React, { useState, useEffect, useRef } from 'react';
// import { toast } from 'sonner';
// import axios from 'axios';
// import API from '../../utils/api';
// import { useEditor, EditorContent } from '@tiptap/react';
// import StarterKit from '@tiptap/starter-kit';
// import Underline from '@tiptap/extension-underline';
// import Link from '@tiptap/extension-link';
// import Image from '@tiptap/extension-image';
// import Placeholder from '@tiptap/extension-placeholder';
// import {
//   FiPlus,
//   FiEdit2,
//   FiTrash2,
//   FiSearch,
//   FiX,
//   FiImage,
//   FiChevronLeft,
//   FiChevronRight,
//   FiRefreshCw,
//   FiBold,
//   FiItalic,
//   FiUnderline,
//   FiList,
//   FiLink as FiLinkIcon,
//   FiImage as FiImageIcon,
//   FiType,
// } from 'react-icons/fi';

// // ─── Helper: reliable API instance ──────────────────
// const getApiInstance = () => {
//   let instance;
//   if (API && typeof API.get === 'function') {
//     instance = API;
//   } else {
//     instance = axios.create({
//       baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }

//   instance.interceptors.request.use(
//     (config) => {
//       const token = localStorage.getItem('accessToken');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );

//   return instance;
// };

// const api = getApiInstance();

// // ─── Toolbar Button ──────────────────────────────────
// const ToolbarButton = ({ onClick, isActive, icon: Icon, label }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className={`p-1 sm:p-1.5 rounded transition-colors ${
//       isActive
//         ? 'bg-black text-white'
//         : 'text-gray-600 hover:bg-gray-100 hover:text-black'
//     }`}
//     aria-label={label}
//     title={label}
//   >
//     <Icon size={14} className="sm:w-4 sm:h-4" />
//   </button>
// );

// const AdminPosts = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [search, setSearch] = useState('');
//   const [category, setCategory] = useState('All');
//   const [categories, setCategories] = useState(['All']);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingPost, setEditingPost] = useState(null);
//   const [formData, setFormData] = useState({
//     title: '',
//     category: '',
//     images: [],
//     description: '',
//     isPublished: true,
//   });
//   const [imageInput, setImageInput] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const isInternalUpdate = useRef(false);

//   // ─── Tiptap editor ──────────────────────────────────
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Underline,
//       Link.configure({
//         openOnClick: false,
//       }),
//       Image,
//       Placeholder.configure({
//         placeholder: 'Write your article content here…',
//       }),
//     ],
//     content: formData.description || '',
//     onUpdate: ({ editor }) => {
//       isInternalUpdate.current = true;
//       setFormData(prev => ({ ...prev, description: editor.getHTML() }));
//       setTimeout(() => { isInternalUpdate.current = false; }, 0);
//     },
//   });

//   // ─── Sync editor content ──────────────────────────────
//   useEffect(() => {
//     if (!editor) return;
//     if (isInternalUpdate.current) return;

//     const currentContent = editor.getHTML();
//     const newContent = formData.description || '';
//     if (currentContent !== newContent) {
//       editor.commands.setContent(newContent);
//     }
//   }, [formData.description, editor]);

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await api.get('/api/posts', {
//         params: {
//           page,
//           limit: 9,
//           search: search || undefined,
//           category: category !== 'All' ? category : undefined,
//         },
//       });

//       setPosts(res.data.data);
//       setTotalPages(res.data.pagination.totalPages);

//       const allCats = res.data.data.map((p) => p.category);
//       setCategories(['All', ...new Set(allCats)]);
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(err.response?.data?.message || 'Failed to fetch posts');
//       toast.error('Error loading posts');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPosts();
//   }, [page, search, category]);

//   const openCreateModal = () => {
//     setEditingPost(null);
//     setFormData({ title: '', category: '', images: [], description: '', isPublished: true });
//     setImageInput('');
//     setModalOpen(true);
//   };

//   const openEditModal = (post) => {
//     setEditingPost(post);
//     setFormData({
//       title: post.title,
//       category: post.category,
//       images: post.images || [],
//       description: post.description || '',
//       isPublished: post.isPublished !== undefined ? post.isPublished : true,
//     });
//     setImageInput('');
//     setModalOpen(true);
//   };

//   const closeModal = () => {
//     setModalOpen(false);
//     setEditingPost(null);
//     setFormData({ title: '', category: '', images: [], description: '', isPublished: true });
//     setImageInput('');
//     if (editor) {
//       editor.commands.setContent('');
//     }
//   };

//   const handleImageAdd = () => {
//     if (imageInput.trim() && formData.images.length < 10) {
//       setFormData((prev) => ({
//         ...prev,
//         images: [...prev.images, imageInput.trim()],
//       }));
//       setImageInput('');
//     }
//   };

//   const handleImageRemove = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index),
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       const payload = { ...formData };

//       const isEmptyDescription =
//         !payload.description ||
//         payload.description === '<p></p>' ||
//         payload.description === '<p><br></p>' ||
//         payload.description.trim() === '';
//       if (isEmptyDescription) {
//         toast.error('Please add content to the description.');
//         setSubmitting(false);
//         return;
//       }

//       if (!payload.images || payload.images.length === 0) {
//         toast.error('Please add at least one image');
//         setSubmitting(false);
//         return;
//       }

//       let res;
//       if (editingPost) {
//         res = await api.patch(`/api/posts/${editingPost._id}`, payload);
//         toast.success('Post updated successfully');
//         setPosts(posts.map((p) => (p._id === editingPost._id ? res.data.data : p)));
//       } else {
//         res = await api.post('/api/posts', payload);
//         toast.success('Post created successfully');
//         setPosts([res.data.data, ...posts]);
//       }
//       closeModal();
//       fetchPosts();
//     } catch (err) {
//       console.error('Submit error:', err);
//       console.error('Response data:', err.response?.data);
//       console.error('Status code:', err.response?.status);

//       const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Operation failed';
//       toast.error(errorMessage);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async (postId) => {
//     if (!window.confirm('Are you sure you want to delete this post?')) return;
//     try {
//       await api.delete(`/api/posts/${postId}`);
//       toast.success('Post deleted');
//       setPosts(posts.filter((p) => p._id !== postId));
//       fetchPosts();
//     } catch (err) {
//       console.error('Delete error:', err);
//       toast.error(err.response?.data?.message || 'Failed to delete post');
//     }
//   };

//   // ─── Toolbar actions ──────────────────────────────────
//   const setLink = () => {
//     if (!editor) return;
//     const url = window.prompt('Enter the URL:');
//     if (url) {
//       editor.chain().focus().setLink({ href: url }).run();
//     }
//   };

//   const addImage = () => {
//     if (!editor) return;
//     const url = window.prompt('Enter the image URL:');
//     if (url) {
//       editor.chain().focus().setImage({ src: url }).run();
//     }
//   };

//   // ─── Character count ──────────────────────────────────
//   const getPlainTextLength = (html) => {
//     if (!html) return 0;
//     const temp = document.createElement('div');
//     temp.innerHTML = html;
//     return temp.textContent?.length || 0;
//   };

//   const charCount = getPlainTextLength(formData.description);

//   // ─── Render ─────────────────────────────────────────────
//   return (
//     <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
//       {/* ─── Header ─── */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
//         <div>
//           <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Manage Posts</h1>
//           <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Create, edit, and delete your articles</p>
//         </div>
//         <button
//           onClick={openCreateModal}
//           className="bg-black text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 text-xs sm:text-sm font-semibold"
//         >
//           <FiPlus size={16} className="sm:w-4 sm:h-4" /> New Post
//         </button>
//       </div>

//       {/* ─── Search & Filter ─── */}
//       <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
//         <div className="flex-1 relative">
//           <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} className="sm:w-4 sm:h-4" />
//           <input
//             type="text"
//             placeholder="Search posts..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-xs sm:text-sm"
//           />
//         </div>
//         <select
//           value={category}
//           onChange={(e) => setCategory(e.target.value)}
//           className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm focus:ring-2 focus:ring-black min-w-[100px] sm:min-w-[140px]"
//         >
//           {categories.map((c) => (
//             <option key={c} value={c}>{c}</option>
//           ))}
//         </select>
//         <button
//           onClick={fetchPosts}
//           className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
//         >
//           <FiRefreshCw size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Refresh</span>
//         </button>
//       </div>

//       {/* ─── Posts Grid ─── */}
//       {loading ? (
//         <div className="flex justify-center py-8 sm:py-12">
//           <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-black border-t-transparent" />
//         </div>
//       ) : error ? (
//         <div className="text-center py-8 sm:py-12 text-red-500 text-sm sm:text-base">{error}</div>
//       ) : posts.length === 0 ? (
//         <div className="text-center py-8 sm:py-12">
//           <p className="text-gray-500 text-sm sm:text-base">No posts found. Create your first post!</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
//           {posts.map((post) => (
//             <div
//               key={post._id}
//               className="bg-white rounded-lg shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden flex flex-col"
//             >
//               <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden bg-gray-100">
//                 {post.images && post.images.length > 0 ? (
//                   <img
//                     src={post.images[0]}
//                     alt={post.title}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-gray-400">
//                     <FiImage size={28} className="sm:w-8 sm:h-8" />
//                   </div>
//                 )}
//                 {post.images && post.images.length > 1 && (
//                   <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/70 text-white text-[8px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
//                     +{post.images.length - 1}
//                   </span>
//                 )}
//                 <span
//                   className={`absolute top-1 right-1 sm:top-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[8px] sm:text-xs font-semibold ${
//                     post.isPublished
//                       ? 'bg-green-100 text-green-800'
//                       : 'bg-gray-200 text-gray-600'
//                   }`}
//                 >
//                   {post.isPublished ? 'Published' : 'Draft'}
//                 </span>
//               </div>
//               <div className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col">
//                 <div className="flex items-start justify-between">
//                   <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
//                     {post.category}
//                   </span>
//                   <span className="text-[8px] sm:text-[10px] text-gray-400">
//                     {new Date(post.createdAt).toLocaleDateString()}
//                   </span>
//                 </div>
//                 <h3 className="text-sm sm:text-base md:text-lg font-bold mt-1 line-clamp-2">{post.title}</h3>
//                 <div
//                   className="text-gray-600 text-[10px] sm:text-xs md:text-sm line-clamp-2 mt-1 flex-1"
//                   dangerouslySetInnerHTML={{ __html: post.description }}
//                 />
//                 <div className="mt-2 sm:mt-3 md:mt-4 flex items-center justify-between">
//                   <span className="text-[8px] sm:text-[10px] text-gray-500">by {post.authorName || 'Admin'}</span>
//                   <div className="flex gap-1 sm:gap-2">
//                     <button
//                       onClick={() => openEditModal(post)}
//                       className="p-1 sm:p-1.5 text-gray-500 hover:text-black transition rounded hover:bg-gray-100"
//                     >
//                       <FiEdit2 size={14} className="sm:w-4 sm:h-4" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete(post._id)}
//                       className="p-1 sm:p-1.5 text-gray-500 hover:text-red-600 transition rounded hover:bg-red-50"
//                     >
//                       <FiTrash2 size={14} className="sm:w-4 sm:h-4" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ─── Pagination ─── */}
//       {totalPages > 1 && (
//         <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8">
//           <button
//             onClick={() => setPage((p) => Math.max(p - 1, 1))}
//             disabled={page === 1}
//             className="p-1.5 sm:p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
//           >
//             <FiChevronLeft size={16} className="sm:w-4 sm:h-4" />
//           </button>
//           <span className="text-xs sm:text-sm font-medium">Page {page} of {totalPages}</span>
//           <button
//             onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
//             disabled={page === totalPages}
//             className="p-1.5 sm:p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
//           >
//             <FiChevronRight size={16} className="sm:w-4 sm:h-4" />
//           </button>
//         </div>
//       )}

//       {/* ─── Modal ─── */}
//       {modalOpen && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
//           <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
//               <h2 className="text-lg sm:text-xl font-bold">
//                 {editingPost ? 'Edit Post' : 'Create New Post'}
//               </h2>
//               <button
//                 onClick={closeModal}
//                 className="p-1 hover:bg-gray-100 rounded-full transition"
//               >
//                 <FiX size={20} className="sm:w-6 sm:h-6" />
//               </button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
//               <div>
//                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
//                   Title *
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData((prev) => ({ ...prev, title: e.target.value }))
//                   }
//                   className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-xs sm:text-sm"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
//                   Category *
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.category}
//                   onChange={(e) =>
//                     setFormData((prev) => ({ ...prev, category: e.target.value }))
//                   }
//                   className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-xs sm:text-sm"
//                   required
//                   placeholder="e.g., Technology, Travel, Food"
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
//                   Images (URLs) *
//                 </label>
//                 <div className="flex gap-2">
//                   <input
//                     type="url"
//                     value={imageInput}
//                     onChange={(e) => setImageInput(e.target.value)}
//                     placeholder="Enter image URL"
//                     className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-xs sm:text-sm"
//                   />
//                   <button
//                     type="button"
//                     onClick={handleImageAdd}
//                     disabled={formData.images.length >= 10}
//                     className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50"
//                   >
//                     Add
//                   </button>
//                 </div>
//                 {formData.images.length > 0 && (
//                   <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
//                     {formData.images.map((url, idx) => (
//                       <div key={idx} className="relative group">
//                         <img
//                           src={url}
//                           alt=""
//                           className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border border-gray-200"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => handleImageRemove(idx)}
//                           className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[8px] sm:text-xs hover:bg-red-600"
//                         >
//                           ×
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//                 <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
//                   {formData.images.length} / 10 images
//                 </p>
//               </div>

//               {/* ─── Tiptap Editor ─── */}
//               <div>
//                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
//                   Description (content) *
//                 </label>
//                 <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black">
//                   <div className="flex flex-wrap gap-0.5 sm:gap-1 p-1 sm:p-2 bg-gray-50 border-b border-gray-300">
//                     <ToolbarButton
//                       onClick={() => editor?.chain().focus().toggleBold().run()}
//                       isActive={editor?.isActive('bold')}
//                       icon={FiBold}
//                       label="Bold"
//                     />
//                     <ToolbarButton
//                       onClick={() => editor?.chain().focus().toggleItalic().run()}
//                       isActive={editor?.isActive('italic')}
//                       icon={FiItalic}
//                       label="Italic"
//                     />
//                     <ToolbarButton
//                       onClick={() => editor?.chain().focus().toggleUnderline().run()}
//                       isActive={editor?.isActive('underline')}
//                       icon={FiUnderline}
//                       label="Underline"
//                     />
//                     <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
//                     <ToolbarButton
//                       onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
//                       isActive={editor?.isActive('heading', { level: 2 })}
//                       icon={FiType}
//                       label="Heading"
//                     />
//                     <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
//                     <ToolbarButton
//                       onClick={() => editor?.chain().focus().toggleBulletList().run()}
//                       isActive={editor?.isActive('bulletList')}
//                       icon={FiList}
//                       label="Bullet List"
//                     />
//                     <ToolbarButton
//                       onClick={() => editor?.chain().focus().toggleOrderedList().run()}
//                       isActive={editor?.isActive('orderedList')}
//                       icon={FiList}
//                       label="Ordered List"
//                     />
//                     <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
//                     <ToolbarButton
//                       onClick={setLink}
//                       isActive={editor?.isActive('link')}
//                       icon={FiLinkIcon}
//                       label="Link"
//                     />
//                     <ToolbarButton
//                       onClick={addImage}
//                       isActive={false}
//                       icon={FiImageIcon}
//                       label="Image"
//                     />
//                   </div>

//                   <EditorContent
//                     editor={editor}
//                     className="p-2 sm:p-4 min-h-[150px] sm:min-h-[200px] md:min-h-[300px] prose prose-sm max-w-none focus:outline-none text-sm"
//                   />
//                 </div>
//                 <div className="flex justify-end text-[10px] sm:text-xs text-gray-500 mt-1">
//                   <span className={charCount > 5000 ? 'text-red-500' : ''}>
//                     {charCount} characters (plain text)
//                   </span>
//                 </div>
//               </div>

//               {/* ─── isPublished toggle ─── */}
//               <div className="flex items-center gap-2 pt-2 sm:pt-4">
//                 <label className="text-xs sm:text-sm font-medium text-gray-700">Publish:</label>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       isPublished: !prev.isPublished,
//                     }))
//                   }
//                   className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black ${
//                     formData.isPublished ? 'bg-black' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
//                       formData.isPublished ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
//                     }`}
//                   />
//                 </button>
//                 <span className="text-xs sm:text-sm text-gray-600">
//                   {formData.isPublished ? 'Published' : 'Draft'}
//                 </span>
//               </div>

//               <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-xs sm:text-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={submitting || formData.images.length === 0}
//                   className="px-4 sm:px-6 py-1.5 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-semibold text-xs sm:text-sm"
//                 >
//                   {submitting ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminPosts;









import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import DOMPurify from 'dompurify';
import API from '../../utils/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
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
  FiGrid,
  FiList as FiListView,
  FiMaximize2,
  FiMinimize2,
  FiFilter,
  FiAlertTriangle,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiCornerDownRight,
  FiCode,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
  FiSlash as FiStrikethrough, // ✅ fallback alias
} from 'react-icons/fi';

// ───────────────────────────────────────────────────────
// API instance (unchanged – do not recreate per render)
// ───────────────────────────────────────────────────────
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

const EMPTY_FORM = {
  title: '',
  category: '',
  images: [],
  description: '',
  isPublished: true,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const URL_REGEX = /^https?:\/\/.+\..+/i;

// ───────────────────────────────────────────────────────
// Sanitization – allow all tags used by the editor
// ───────────────────────────────────────────────────────
const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img',
      'code', 'pre', 'span', 'hr', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });

const getContentStats = (html) => {
  if (!html) return { words: 0, chars: 0, paragraphs: 0, readingTime: 0 };
  const temp = document.createElement('div');
  temp.innerHTML = sanitizeHtml(html);
  const text = temp.textContent || '';
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs =
    temp.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote').length ||
    (text.trim() ? 1 : 0);
  const readingTime = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
  return { words, chars, paragraphs, readingTime };
};

const isEmptyDescription = (html) => {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped === '';
};

// ───────────────────────────────────────────────────────
// Validation
// ───────────────────────────────────────────────────────
const validatePostForm = (formData) => {
  const errors = {};

  const title = (formData.title || '').trim();
  if (!title) errors.title = 'Title is required.';
  else if (title.length < 5) errors.title = 'Title should be at least 5 characters.';
  else if (title.length > 150) errors.title = 'Title should be under 150 characters.';

  const category = (formData.category || '').trim();
  if (!category) errors.category = 'Category is required.';

  if (isEmptyDescription(formData.description)) {
    errors.description = 'Description content is required.';
  }

  if (!formData.images || formData.images.length === 0) {
    errors.images = 'At least one image is required.';
  } else {
    const badUrl = formData.images.find((url) => !URL_REGEX.test(url));
    if (badUrl) errors.images = `That doesn't look like a valid image URL: ${badUrl}`;
  }

  return errors;
};

// ───────────────────────────────────────────────────────
// Enhanced Toolbar – now with headings, alignment, etc.
// ───────────────────────────────────────────────────────
const ToolbarButton = React.memo(({ onClick, isActive, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center h-8 w-8 sm:h-8 sm:w-8 rounded ${
      isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'
    }`}
    aria-label={label}
    title={label}
  >
    <Icon size={15} />
  </button>
));

const EditorToolbar = ({ editor, onSetLink, onAddImage }) => {
  if (!editor || editor.isDestroyed) return null;

  const headingLevels = [
    { level: 1, label: 'Heading 1' },
    { level: 2, label: 'Heading 2' },
    { level: 3, label: 'Heading 3' },
    { level: 4, label: 'Heading 4' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-gray-50 border-b border-gray-300 overflow-x-auto">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={FiBold}
        label="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={FiItalic}
        label="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        icon={FiUnderline}
        label="Underline"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={FiStrikethrough}
        label="Strikethrough"
      />
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Headings dropdown */}
      <div className="relative inline-block">
        <select
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run();
            } else if (value.startsWith('heading')) {
              const level = parseInt(value.split('-')[1], 10);
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          value={
            editor.isActive('heading', { level: 1 })
              ? 'heading-1'
              : editor.isActive('heading', { level: 2 })
              ? 'heading-2'
              : editor.isActive('heading', { level: 3 })
              ? 'heading-3'
              : editor.isActive('heading', { level: 4 })
              ? 'heading-4'
              : 'paragraph'
          }
          className="h-8 text-xs border border-gray-300 rounded bg-white px-2 py-0 focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="paragraph">Normal</option>
          {headingLevels.map(({ level, label }) => (
            <option key={level} value={`heading-${level}`}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={FiList}
        label="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={FiList}
        label="Ordered List"
      />
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Blockquote & Code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={FiCornerDownRight}
        label="Blockquote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        icon={FiCode}
        label="Code block"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        isActive={false}
        icon={FiMinus}
        label="Horizontal rule"
      />
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        icon={FiAlignLeft}
        label="Align left"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        icon={FiAlignCenter}
        label="Align center"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        icon={FiAlignRight}
        label="Align right"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        icon={FiAlignJustify}
        label="Justify"
      />
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        icon={FiRotateCcw}
        label="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        icon={FiRotateCw}
        label="Redo"
      />
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Link & Image */}
      <ToolbarButton onClick={onSetLink} isActive={editor.isActive('link')} icon={FiLinkIcon} label="Link" />
      <ToolbarButton onClick={onAddImage} isActive={false} icon={FiImageIcon} label="Image" />
      <span className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

      {/* Clear formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        isActive={false}
        icon={FiType}
        label="Clear formatting"
      />
    </div>
  );
};

// ───────────────────────────────────────────────────────
// Presentational components (unchanged)
// ───────────────────────────────────────────────────────
const StatusBadge = ({ isPublished }) => (
  <span
    className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
      isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
    }`}
  >
    {isPublished ? 'Published' : 'Draft'}
  </span>
);

const PostThumbnail = ({ images, title }) => (
  <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden bg-gray-100 shrink-0">
    {images && images.length > 0 ? (
      <img src={images[0]} alt={title} className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <div className="flex items-center justify-center h-full text-gray-400">
        <FiImage size={28} />
      </div>
    )}
    {images && images.length > 1 && (
      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded">
        +{images.length - 1}
      </span>
    )}
  </div>
);

const PostCard = React.memo(({ post, onEdit, onDelete }) => {
  const safeDescription = useMemo(() => sanitizeHtml(post.description), [post.description]);
  return (
    <div className="relative bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden flex flex-col">
      <PostThumbnail images={post.images} title={post.title} />
      <StatusBadge isPublished={post.isPublished} />
      <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
            {post.category}
          </span>
          <span className="text-[10px] text-gray-400 shrink-0">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-sm sm:text-base md:text-lg font-bold mt-1 line-clamp-2 break-words">{post.title}</h3>
        <div
          className="text-gray-600 text-xs sm:text-sm line-clamp-2 mt-1 flex-1 break-words"
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500 truncate">by {post.authorName || 'Admin'}</span>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(post)}
              aria-label="Edit post"
              className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-black rounded hover:bg-gray-100"
            >
              <FiEdit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(post)}
              aria-label="Delete post"
              className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const PostsGrid = ({ posts, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
    {posts.map((post) => (
      <PostCard key={post._id} post={post} onEdit={onEdit} onDelete={onDelete} />
    ))}
  </div>
);

const PostsTable = ({ posts, onEdit, onDelete }) => (
  <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-16">Image</th>
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Title</th>
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600 hidden sm:table-cell">Category</th>
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Status</th>
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600 hidden md:table-cell">Date</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {posts.map((post) => (
          <tr key={post._id} className="hover:bg-gray-50">
            <td className="px-3 py-2">
              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 shrink-0">
                {post.images?.[0] ? (
                  <img src={post.images[0]} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <FiImage size={14} />
                  </div>
                )}
              </div>
            </td>
            <td className="px-3 py-2 max-w-[220px] sm:max-w-xs">
              <p className="font-medium text-gray-900 truncate">{post.title}</p>
              <p className="text-[11px] text-gray-400 sm:hidden truncate">{post.category}</p>
            </td>
            <td className="px-3 py-2 text-gray-600 hidden sm:table-cell">{post.category}</td>
            <td className="px-3 py-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                  post.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {post.isPublished ? 'Published' : 'Draft'}
              </span>
            </td>
            <td className="px-3 py-2 text-gray-500 whitespace-nowrap hidden md:table-cell">
              {new Date(post.createdAt).toLocaleDateString()}
            </td>
            <td className="px-3 py-2">
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => onEdit(post)}
                  aria-label="Edit post"
                  className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-black rounded hover:bg-gray-100"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => onDelete(post)}
                  aria-label="Delete post"
                  className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
      <button
        onClick={() => onChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="h-9 w-9 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiChevronLeft size={16} />
      </button>
      <span className="text-xs sm:text-sm font-medium">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(page + 1, totalPages))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="h-9 w-9 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  );
};

const ViewToggle = ({ viewMode, onChange }) => (
  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shrink-0">
    <button
      onClick={() => onChange('grid')}
      aria-label="Grid view"
      aria-pressed={viewMode === 'grid'}
      className={`h-9 w-9 flex items-center justify-center ${
        viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      <FiGrid size={15} />
    </button>
    <button
      onClick={() => onChange('table')}
      aria-label="Table view"
      aria-pressed={viewMode === 'table'}
      className={`h-9 w-9 flex items-center justify-center border-l border-gray-300 ${
        viewMode === 'table' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      <FiListView size={15} />
    </button>
  </div>
);

const SearchFilterBar = ({
  searchInput,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  onRefresh,
  pageSize,
  onPageSizeChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  resultsLabel,
}) => (
  <div className="mb-4 sm:mb-6">
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          placeholder="Search posts by title..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        />
      </div>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-black min-w-0 sm:min-w-[140px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Posts per page"
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-black shrink-0"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        <button
          onClick={onRefresh}
          aria-label="Refresh posts"
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm shrink-0"
        >
          <FiRefreshCw size={15} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
      <p className="text-xs text-gray-500">{resultsLabel}</p>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-black underline underline-offset-2"
        >
          <FiFilter size={11} /> Clear filters
        </button>
      )}
    </div>
  </div>
);

const ImageUrlList = ({ images, onRemove }) => {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url, idx) => (
        <div key={idx} className="relative">
          <img src={url} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded border border-gray-200" />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            aria-label="Remove image"
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

const ImageUrlInput = ({ imageInput, setImageInput, images, onAdd, onRemove, error }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Images (URLs) *</label>
    <div className="flex flex-col xs:flex-row gap-2">
      <input
        type="url"
        value={imageInput}
        onChange={(e) => setImageInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder="Enter image URL"
        className={`flex-1 min-w-0 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black text-sm ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={images.length >= 10}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
      >
        Add
      </button>
    </div>
    <ImageUrlList images={images} onRemove={onRemove} />
    <div className="flex items-center justify-between mt-1">
      <p className="text-[10px] sm:text-xs text-gray-500">{images.length} / 10 images</p>
      {error && <p className="text-[10px] sm:text-xs text-red-500">{error}</p>}
    </div>
  </div>
);

const PublishToggle = ({ isPublished, onToggle }) => (
  <div className="flex items-center gap-2 pt-2 sm:pt-4">
    <label className="text-xs sm:text-sm font-medium text-gray-700">Publish:</label>
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isPublished}
      className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-black ${
        isPublished ? 'bg-black' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white ${
          isPublished ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
    <span className="text-xs sm:text-sm text-gray-600">{isPublished ? 'Published' : 'Draft'}</span>
  </div>
);

// ─── Updated DescriptionEditor with enhanced toolbar ──
const DescriptionEditor = ({ editor, stats, onSetLink, onAddImage, error }) => {
  if (!editor || editor.isDestroyed) return null;

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description (content) *</label>
      <div
        className={`border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <EditorToolbar editor={editor} onSetLink={onSetLink} onAddImage={onAddImage} />
        <EditorContent
          editor={editor}
          className="p-3 sm:p-4 min-h-[140px] sm:min-h-[200px] md:min-h-[280px] prose prose-sm sm:prose-base max-w-none focus:outline-none text-sm [&>p]:leading-7 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-semibold [&>h3]:text-lg [&>h3]:font-semibold [&>h4]:text-base [&>h4]:font-semibold [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>pre]:bg-gray-100 [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>hr]:my-6 [&>hr]:border-t [&>hr]:border-gray-300"
        />
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[10px] sm:text-xs text-gray-500 mt-1">
        <span className={error ? 'text-red-500' : ''}>{error || ' '}</span>
        <span className="flex gap-3 shrink-0">
          <span className={stats.chars > 5000 ? 'text-red-500' : ''}>{stats.chars} chars</span>
          <span>{stats.words} words</span>
          <span>{stats.paragraphs} paragraphs</span>
          <span>{stats.readingTime > 0 ? `${stats.readingTime} min read` : '—'}</span>
        </span>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────
// Delete confirmation modal
// ───────────────────────────────────────────────────────
const DeleteConfirmModal = ({ post, onCancel, onConfirm, deleting }) => {
  if (!post) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 text-red-600">
            <FiAlertTriangle size={18} />
            <h3 className="text-base font-bold text-gray-900">Delete this post?</h3>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 shrink-0">
              {post.images?.[0] ? (
                <img src={post.images[0]} alt={post.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <FiImage size={16} />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-800 line-clamp-2">{post.title}</p>
          </div>
          <p className="text-xs sm:text-sm text-red-600 mt-3">
            This action is permanent and cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────
// Modal (create / edit) – uses updated DescriptionEditor
// ───────────────────────────────────────────────────────
const PostFormModal = ({
  editingPost,
  formData,
  setFormData,
  imageInput,
  setImageInput,
  editor,
  stats,
  submitting,
  formErrors,
  isFullscreen,
  onToggleFullscreen,
  onRequestClose,
  onSubmit,
  onSetLink,
  onAddImage,
}) => {
  const handleImageAdd = () => {
    if (imageInput.trim() && formData.images.length < 10) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, imageInput.trim()] }));
      setImageInput('');
    }
  };

  const handleImageRemove = (index) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex ${
        isFullscreen ? 'items-stretch justify-stretch p-0' : 'items-end sm:items-center justify-center sm:p-4'
      }`}
    >
      <div
        className={`bg-white overflow-y-auto flex flex-col ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full sm:max-w-4xl sm:rounded-xl shadow-2xl h-[95vh] sm:h-auto sm:max-h-[95vh] rounded-t-2xl'
        }`}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 shrink-0">
          <h2 className="text-base sm:text-xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:flex"
            >
              {isFullscreen ? <FiMinimize2 size={17} /> : <FiMaximize2 size={17} />}
            </button>
            <button onClick={onRequestClose} aria-label="Close" className="p-1 hover:bg-gray-100 rounded-full">
              <FiX size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm ${
                formErrors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {formErrors.title ? (
                <p className="text-[10px] sm:text-xs text-red-500">{formErrors.title}</p>
              ) : (
                <span />
              )}
              <p className="text-[10px] sm:text-xs text-gray-400 shrink-0">
                {formData.title.length}/150
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category *</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm ${
                formErrors.category ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="e.g., Technology, Travel, Food"
            />
            {formErrors.category && (
              <p className="text-[10px] sm:text-xs text-red-500 mt-1">{formErrors.category}</p>
            )}
          </div>

          <ImageUrlInput
            imageInput={imageInput}
            setImageInput={setImageInput}
            images={formData.images}
            onAdd={handleImageAdd}
            onRemove={handleImageRemove}
            error={formErrors.images}
          />

          {editor && !editor.isDestroyed ? (
            <DescriptionEditor
              editor={editor}
              stats={stats}
              onSetLink={onSetLink}
              onAddImage={onAddImage}
              error={formErrors.description}
            />
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 text-gray-400 text-sm">
              Editor is loading…
            </div>
          )}

          <PublishToggle
            isPublished={formData.isPublished}
            onToggle={() => setFormData((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
          />

          <div className="sticky bottom-0 bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0 pb-1">
            <button
              type="button"
              onClick={onRequestClose}
              className="px-4 py-2.5 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-semibold text-sm"
            >
              {submitting ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────
// Main component – AdminPosts
// ───────────────────────────────────────────────────────
const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: null });
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('adminPostsViewMode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageInput, setImageInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isInternalUpdate = useRef(false);
  const initialFormRef = useRef(EMPTY_FORM);
  const abortControllerRef = useRef(null);

  // ─── Enhanced editor configuration ──────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // we'll configure heading explicitly
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Write your article content here…' }),
      Blockquote,
      CodeBlock,
      HorizontalRule,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Heading.configure({
        levels: [1, 2, 3, 4],
      }),
    ],
    content: formData.description || '',
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      setFormData((prev) => ({ ...prev, description: editor.getHTML() }));
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    },
  });

  // Sync editor content when formData.description changes externally
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (isInternalUpdate.current) return;

    const currentContent = editor.getHTML();
    const newContent = formData.description || '';
    if (currentContent !== newContent) {
      editor.commands.setContent(newContent);
    }
  }, [formData.description, editor]);

  // Persist view mode preference
  useEffect(() => {
    try {
      localStorage.setItem('adminPostsViewMode', viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/posts', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
        },
        signal: controller.signal,
      });

      setPosts(res.data.data);
      setPagination(res.data.pagination || { totalPages: 1, total: null });

      const allCats = res.data.data.map((p) => p.category);
      setCategories((prev) => {
        const merged = new Set([...prev.filter((c) => c !== 'All'), ...allCats]);
        return ['All', ...merged];
      });
    } catch (err) {
      if (axios.isCancel?.(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        return;
      }
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch posts');
      toast.error('Error loading posts');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, category]);

  useEffect(() => {
    fetchPosts();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchPosts]);

  const handleCategoryChange = useCallback((val) => {
    setCategory(val);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((val) => {
    setPageSize(val);
    setPage(1);
  }, []);

  const hasActiveFilters = search !== '' || category !== 'All';

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setCategory('All');
    setPage(1);
  }, []);

  const resultsLabel = loading
    ? 'Loading posts…'
    : pagination.total != null
    ? `Showing ${posts.length} of ${pagination.total} post${pagination.total === 1 ? '' : 's'}`
    : `Showing ${posts.length} post${posts.length === 1 ? '' : 's'}`;

  const openCreateModal = useCallback(() => {
    setEditingPost(null);
    setFormData(EMPTY_FORM);
    initialFormRef.current = EMPTY_FORM;
    setImageInput('');
    setFormErrors({});
    setIsFullscreen(false);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((post) => {
    const initial = {
      title: post.title,
      category: post.category,
      images: post.images || [],
      description: post.description || '',
      isPublished: post.isPublished !== undefined ? post.isPublished : true,
    };
    setEditingPost(post);
    setFormData(initial);
    initialFormRef.current = initial;
    setImageInput('');
    setFormErrors({});
    setIsFullscreen(false);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingPost(null);
    setFormData(EMPTY_FORM);
    setImageInput('');
    setFormErrors({});
    setIsFullscreen(false);
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent('');
    }
  }, [editor]);

  const hasUnsavedChanges = useCallback(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormRef.current),
    [formData]
  );

  const requestCloseModal = useCallback(() => {
    if (hasUnsavedChanges()) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    closeModal();
  }, [hasUnsavedChanges, closeModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validatePostForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        category: formData.category.trim(),
      };

      let res;
      if (editingPost) {
        res = await api.patch(`/api/posts/${editingPost._id}`, payload);
        toast.success('Post updated successfully');
        setPosts((prev) => prev.map((p) => (p._id === editingPost._id ? res.data.data : p)));
      } else {
        res = await api.post('/api/posts', payload);
        toast.success('Post created successfully');
        setPosts((prev) => [res.data.data, ...prev]);
      }
      closeModal();
      fetchPosts();
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Operation failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = useCallback((post) => {
    setPostToDelete(post);
  }, []);

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${postToDelete._id}`);
      toast.success('Post deleted');
      setPosts((prev) => prev.filter((p) => p._id !== postToDelete._id));
      setPostToDelete(null);
      fetchPosts();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const setLink = () => {
    if (!editor || editor.isDestroyed) return;
    const url = window.prompt('Enter the URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    if (!editor || editor.isDestroyed) return;
    const url = window.prompt('Enter the image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const contentStats = useMemo(() => getContentStats(formData.description), [formData.description]);
  const totalPages = pagination.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold">Manage Posts</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Create, edit, and delete your articles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-black text-white px-4 py-2.5 sm:py-2.5 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <FiPlus size={16} /> New Post
        </button>
      </div>

      <SearchFilterBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        category={category}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        onRefresh={fetchPosts}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        resultsLabel={resultsLabel}
      />

      {loading ? (
        <div className="flex justify-center py-10 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-black border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-10 sm:py-12 text-red-500 text-sm sm:text-base">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 sm:py-12">
          <p className="text-gray-500 text-sm sm:text-base">
            {hasActiveFilters ? 'No posts match your filters.' : 'No posts found. Create your first post!'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-black underline underline-offset-2 mt-2">
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <PostsGrid posts={posts} onEdit={openEditModal} onDelete={requestDelete} />
      ) : (
        <PostsTable posts={posts} onEdit={openEditModal} onDelete={requestDelete} />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {modalOpen && (
        <PostFormModal
          editingPost={editingPost}
          formData={formData}
          setFormData={setFormData}
          imageInput={imageInput}
          setImageInput={setImageInput}
          editor={editor}
          stats={contentStats}
          submitting={submitting}
          formErrors={formErrors}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((v) => !v)}
          onRequestClose={requestCloseModal}
          onSubmit={handleSubmit}
          onSetLink={setLink}
          onAddImage={addImage}
        />
      )}

      <DeleteConfirmModal
        post={postToDelete}
        deleting={deleting}
        onCancel={() => setPostToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminPosts;

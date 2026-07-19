import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import API from "../../utils/api";
import {
  Users,
  UserCog,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  X,
  Shield,
  User,
  Calendar,
  Mail,
  LogIn,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ---------- Custom Hooks ----------
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

// ---------- Custom Confirmation Modal ----------
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Main Component ----------
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  const debouncedSearch = useDebounce(search, 300);
  const itemsPerPage = 10;

  // ================= FETCH USERS =================
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/users`);
      setUsers(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ================= FILTER, SORT, PAGINATE =================
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    // Filter role
    if (filterRole !== "all") {
      result = result.filter((u) => u.role === filterRole);
    }

    // Filter verification
    if (filterVerified !== "all") {
      const verified = filterVerified === "verified";
      result = result.filter((u) => u.isVerified === verified);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (sortField === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, debouncedSearch, filterRole, filterVerified, sortField, sortOrder]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedUsers.slice(start, start + itemsPerPage);
  }, [processedUsers, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRole, filterVerified, sortField, sortOrder]);

  // ================= STATS =================
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const unverifiedCount = totalUsers - verifiedCount;

  // ================= ACTIONS =================
  const deleteUser = useCallback(
    (id, role) => {
      if (role === "admin") {
        toast.error("Admin cannot be deleted");
        return;
      }
      setModalAction({
        type: "delete",
        payload: [id],
        message: "Delete this user?",
      });
      setModalOpen(true);
    },
    []
  );

  const verifyUser = useCallback(
    (id, isVerified) => {
      const newStatus = !isVerified;
      setModalAction({
        type: "verify",
        payload: { ids: [id], verify: newStatus },
        message: newStatus ? "Verify this user?" : "Unverify this user?",
      });
      setModalOpen(true);
    },
    []
  );

  const bulkDelete = useCallback(() => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one user");
      return;
    }
    setModalAction({
      type: "delete",
      payload: selectedIds,
      message: `Delete ${selectedIds.length} user(s)?`,
    });
    setModalOpen(true);
  }, [selectedIds]);

  const bulkVerify = useCallback(
    (verify) => {
      if (selectedIds.length === 0) {
        toast.error("Select at least one user");
        return;
      }
      setModalAction({
        type: "verify",
        payload: { ids: selectedIds, verify },
        message: `${verify ? "Verify" : "Unverify"} ${selectedIds.length} user(s)?`,
      });
      setModalOpen(true);
    },
    [selectedIds]
  );

  const confirmAction = useCallback(async () => {
    if (!modalAction) return;
    const { type, payload } = modalAction;

    try {
      if (type === "delete") {
        const ids = payload;
        const adminInList = users.some((u) => ids.includes(u._id) && u.role === "admin");
        if (adminInList) {
          toast.error("Admins cannot be deleted");
          return;
        }
        await Promise.all(ids.map((id) => axios.delete(`${API}/admin/user/${id}`)));
        setUsers((prev) => prev.filter((u) => !ids.includes(u._id)));
        toast.success(`${ids.length} user(s) deleted`);
        setSelectedIds([]);
      } else if (type === "verify") {
        const { ids, verify } = payload;
        await Promise.all(
          ids.map((id) =>
            axios.put(`${API}/admin/verify-user/${id}`, { isVerified: verify })
          )
        );
        setUsers((prev) =>
          prev.map((u) =>
            ids.includes(u._id) ? { ...u, isVerified: verify } : u
          )
        );
        toast.success(`${ids.length} user(s) ${verify ? "verified" : "unverified"}`);
        setSelectedIds([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setModalAction(null);
    }
  }, [modalAction, users]);

  // ================= SELECTION =================
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map((u) => u._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ================= SORT HANDLER =================
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-xl font-bold text-black dark:text-white">{totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserCog size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
                <p className="text-xl font-bold text-black dark:text-white">{adminCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
                <p className="text-xl font-bold text-black dark:text-white">{verifiedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unverified</p>
                <p className="text-xl font-bold text-black dark:text-white">{unverifiedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex-wrap">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.length} selected
            </span>
            <button
              onClick={bulkDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => bulkVerify(true)}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Check size={14} />
              Verify
            </button>
            <button
              onClick={() => bulkVerify(false)}
              className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Unverify
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* ================= TABLE (ALWAYS VISIBLE) ================= */}
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 dark:bg-zinc-800">
                <tr>
                  <th className="p-3 w-10"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-20" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-24" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-16" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-20" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-16" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-20" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-16" /></th>
                  <th className="p-3"><div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse w-16" /></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-zinc-700">
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-20" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-24" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-16" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-20" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-16" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-20" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-16" /></td>
                    <td className="p-3"><div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-16" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] md:min-w-full border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 dark:bg-zinc-800">
                <tr>
                  <th className="p-2 md:p-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedUsers.length > 0 &&
                        selectedIds.length === paginatedUsers.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600"
                    />
                  </th>
                  <th
                    className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("username")}
                  >
                    <div className="flex items-center gap-1">
                      Username
                      {sortField === "username" && (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === "email" && (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      {sortField === "role" && (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Verified</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Logged In</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Google ID</th>
                  <th
                    className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {sortField === "createdAt" && (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="p-2 md:p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user._id)}
                          onChange={() => toggleSelect(user._id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600"
                        />
                      </td>
                      <td className="p-2 md:p-3 font-medium text-xs md:text-sm text-black dark:text-white">
                        {user.username || "N/A"}
                      </td>
                      <td className="p-2 md:p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 break-all">
                        {user.email}
                      </td>
                      <td className="p-2 md:p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2 md:p-3">
                        <button
                          onClick={() => verifyUser(user._id, user.isVerified)}
                          className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap ${
                            user.isVerified
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                          }`}
                        >
                          {user.isVerified ? "Verified" : "Unverified"}
                        </button>
                      </td>
                      <td className="p-2 md:p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                        {user.isLoggedIn ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 whitespace-nowrap">
                            <LogIn size={14} /> Yes
                          </span>
                        ) : (
                          "No"
                        )}
                      </td>
                      <td className="p-2 md:p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 break-all">
                        {user.googleId || "N/A"}
                      </td>
                      <td className="p-2 md:p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2 md:p-3">
                        <button
                          onClick={() => deleteUser(user._id, user.role)}
                          className="px-2 py-1 md:px-3 md:py-1 bg-red-500 text-white rounded-lg text-[10px] md:text-xs hover:bg-red-600 transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, processedUsers.length)} of{" "}
              {processedUsers.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-black dark:text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalAction(null);
        }}
        onConfirm={confirmAction}
        title="Confirm Action"
        message={modalAction?.message || "Are you sure?"}
      />
    </div>
  );
};

export default AdminDashboard;
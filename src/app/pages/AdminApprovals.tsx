import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  backendGetAllRegistrationUsers,
  backendApproveUser,
  backendRejectUser,
  type PendingUser,
} from "@/app/lib/backendApi";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const statusConfig = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }: { status: PendingUser["approval_status"] }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] border ${cfg.bg} ${cfg.text} ${cfg.border}`}
      style={{ fontWeight: 600 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [actionLoading, setActionLoading] = useState<Record<string, "approve" | "reject" | null>>(
    {}
  );
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { users: data } = await backendGetAllRegistrationUsers();
      setUsers(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load registrations. Check the backend console for details.";
      console.error("[AdminApprovals] fetch error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (user: PendingUser) => {
    setActionLoading((prev) => ({ ...prev, [user.id]: "approve" }));
    try {
      await backendApproveUser(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, approval_status: "approved" } : u))
      );
      showToast(`✓ ${user.full_name || user.email} approved successfully.`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve user.";
      showToast(message, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: null }));
    }
  };

  const handleReject = async (user: PendingUser) => {
    setActionLoading((prev) => ({ ...prev, [user.id]: "reject" }));
    try {
      await backendRejectUser(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, approval_status: "rejected" } : u))
      );
      showToast(`${user.full_name || user.email} has been rejected.`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject user.";
      showToast(message, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: null }));
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const pendingCount = users.filter((u) => u.approval_status === "pending").length;
  const approvedCount = users.filter((u) => u.approval_status === "approved").length;
  const rejectedCount = users.filter((u) => u.approval_status === "rejected").length;

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || u.approval_status === filter;
    return matchesSearch && matchesFilter;
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[0.875rem] border transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
          style={{ fontWeight: 500 }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.375rem] text-slate-900" style={{ fontWeight: 700 }}>
            User Approvals
          </h1>
          <p className="text-[0.875rem] text-slate-500 mt-0.5">
            Review and manage self-registered student accounts
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[0.875rem] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          style={{ fontWeight: 500 }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("pending")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === "pending"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
              : "bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[1.5rem] text-amber-700" style={{ fontWeight: 700 }}>
                {pendingCount}
              </p>
              <p className="text-[0.75rem] text-amber-600">Pending</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === "approved"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
              : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[1.5rem] text-emerald-700" style={{ fontWeight: 700 }}>
                {approvedCount}
              </p>
              <p className="text-[0.75rem] text-emerald-600">Approved</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter("rejected")}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === "rejected"
              ? "bg-red-50 border-red-300 ring-2 ring-red-200"
              : "bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[1.5rem] text-red-700" style={{ fontWeight: 700 }}>
                {rejectedCount}
              </p>
              <p className="text-[0.75rem] text-red-500">Rejected</p>
            </div>
          </div>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[0.875rem] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[0.875rem] text-slate-600 cursor-pointer hover:bg-slate-100 transition select-none">
              <Filter className="w-3.5 h-3.5" />
              <span style={{ fontWeight: 500 }}>
                {filter === "all" ? "All Status" : statusConfig[filter].label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="text-[0.8125rem] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[0.875rem] text-slate-500">Loading registrations…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-[0.9375rem] text-slate-700 font-medium mb-1">Failed to load</p>
              <p className="text-[0.875rem] text-slate-500 mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[0.875rem] hover:bg-indigo-700 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-[0.9375rem] text-slate-700 font-medium mb-1">
              {filter === "pending" ? "No pending registrations" : "No users found"}
            </p>
            <p className="text-[0.875rem] text-slate-500">
              {filter === "pending"
                ? "All caught up — no accounts awaiting approval."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide">
                    SBRN
                  </th>
                  <th className="text-left px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide hidden md:table-cell">
                    Department
                  </th>
                  <th className="text-left px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide hidden lg:table-cell">
                    Sem / Section
                  </th>
                  <th className="text-left px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide">
                    Registered
                  </th>
                  <th className="text-left px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-[0.75rem] text-slate-500 font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const isActing = !!actionLoading[user.id];
                  const initials = (user.full_name || user.email)
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full flex items-center justify-center text-[0.75rem] text-indigo-700 flex-shrink-0" style={{ fontWeight: 700 }}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-800 font-medium truncate">
                              {user.full_name || "—"}
                            </p>
                            <p className="text-[0.8125rem] text-slate-400 truncate">{user.email}</p>
                            {user.phone && (
                              <p className="text-[0.75rem] text-slate-400">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SBRN */}
                      <td className="px-5 py-3.5">
                        {user.student_id ? (
                          <span className="font-mono text-[0.8125rem] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold tracking-wider">
                            {user.student_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[0.8125rem]">—</span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="min-w-0">
                          {user.department ? (
                            <p className="text-[0.8125rem] text-slate-700 truncate max-w-[160px]">{user.department}</p>
                          ) : (
                            <span className="text-slate-400 text-[0.8125rem]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Sem / Section */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {user.semester || user.section ? (
                          <div className="flex items-center gap-1.5 text-[0.8125rem] text-slate-600">
                            {user.semester && <span className="bg-slate-100 px-1.5 py-0.5 rounded">Sem {user.semester}</span>}
                            {user.section && <span className="bg-slate-100 px-1.5 py-0.5 rounded">{user.section}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[0.8125rem]">—</span>
                        )}
                      </td>

                      {/* Registered */}
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={user.approval_status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {user.approval_status !== "approved" && (
                            <button
                              onClick={() => handleApprove(user)}
                              disabled={isActing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[0.8125rem] hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ fontWeight: 500 }}
                            >
                              {actionLoading[user.id] === "approve" ? (
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                          )}
                          {user.approval_status !== "rejected" && (
                            <button
                              onClick={() => handleReject(user)}
                              disabled={isActing}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-[0.8125rem] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ fontWeight: 500 }}
                            >
                              {actionLoading[user.id] === "reject" ? (
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Reject
                            </button>
                          )}
                          {user.approval_status === "rejected" && (
                            <span className="text-[0.8125rem] text-slate-400 italic">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-slate-100 text-[0.8125rem] text-slate-500">
              Showing {filtered.length} of {users.length} registration{users.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

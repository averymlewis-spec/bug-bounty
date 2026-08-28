import { useState } from "react";
import { DataTable } from "./DataTable";
import { ConfirmDialog } from "./ConfirmDialog";
import { AdminAPI, JwtPayload } from "../../lib/adminApi";
import { UserDetailDrawer } from "./UserDetailDrawer";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "client" | "freelancer" | "admin";
  isVerified: boolean;
  status: "active" | "suspended" | "banned";
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

export function UsersSection({
  api,
  admin,
  onAction
}: {
  api: AdminAPI | null;
  admin: JwtPayload | null;
  onAction?: () => void;
}) {
  const [filters, setFilters] = useState({
    query: "",
    role: "",
    status: ""
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    userId: string;
    action: "suspend" | "reinstate" | "ban";
  } | null>(null);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPage = (params: { page: number; pageSize: number; query?: string }) =>
    api!.users({
      ...params,
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {})
    });

  const handleAction = async (
    userId: string,
    action: "suspend" | "reinstate" | "ban",
    reason?: string
  ) => {
    if (!api) return;
    try {
      if (action === "suspend") await api.suspendUser(userId, reason ?? "");
      else if (action === "reinstate") await api.reinstateUser(userId);
      else if (action === "ban") await api.banUser(userId, reason ?? "");
      onAction?.();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const openConfirm = (userId: string, action: "suspend" | "reinstate" | "ban") => {
    setConfirmState({ userId, action });
    setConfirmOpen(true);
  };

  const submitConfirm = () => {
    if (!confirmState) return;
    const { userId, action } = confirmState;
    if (action === "ban") {
      const reason = prompt("Enter ban reason:");
      if (reason) handleAction(userId, "ban", reason);
    } else if (action === "suspend") {
      const reason = prompt("Enter suspension reason (optional):") ?? "";
      handleAction(userId, "suspend", reason);
    } else {
      handleAction(userId, "reinstate");
    }
    setConfirmOpen(false);
    setConfirmState(null);
  };

  const viewProfile = async (userId: string) => {
    setDrawerUserId(userId);
    setDrawerOpen(true);
  };

  return (
    <section className="users-section">
      <div className="section-header">
        <h3>User Management</h3>
        <div className="filters" role="search">
          <input
            type="search"
            className="filter-input"
            placeholder="Search by name or email…"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            aria-label="Search users"
          />
          <select
            className="filter-select"
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <DataTable<AdminUser>
        columns={[
          { header: "User", accessor: (u) => (
            <span>
              <strong>{u.fullName}</strong>
              <br />
              <small>{u.email}</small>
            </span>
          ) },
          { header: "Role", accessor: "role" },
          { header: "Status", accessor: "status" },
          { header: "Trust", accessor: (u) => u.trustScore ?? 0 },
          { header: "Joined", accessor: (u) => new Date(u.createdAt).toLocaleDateString() }
        ]}
        fetch={fetchPage}
        query={filters.query}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your search or filter criteria."
        rowKey={(u) => u.id}
        actions={(u) => (
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => viewProfile(u.id)}
              aria-label={`View profile for ${u.fullName}`}
              title="View profile"
            >
              👁
            </button>
            {u.status !== "suspended" && u.status !== "banned" && u.role !== "admin" && (
              <button
                type="button"
                className="btn btn-sm btn-warning"
                onClick={() => openConfirm(u.id, "suspend")}
                aria-label={`Suspend ${u.fullName}`}
                title="Suspend"
              >
                ⏸
              </button>
            )}
            {u.status === "suspended" && (
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => openConfirm(u.id, "reinstate")}
                aria-label={`Reinstate ${u.fullName}`}
                title="Reinstate"
              >
                ↺
              </button>
            )}
            {u.status !== "banned" && u.role !== "admin" && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => openConfirm(u.id, "ban")}
                aria-label={`Ban ${u.fullName}`}
                title="Ban"
              >
                🚫
              </button>
            )}
          </div>
        )}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm user action"
        requireText={confirmState ? `I understand` : undefined}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submitConfirm}
      />

      <UserDetailDrawer
        open={drawerOpen}
        userId={drawerUserId}
        api={api}
        onClose={() => setDrawerOpen(false)}
      />
    </section>
  );
}

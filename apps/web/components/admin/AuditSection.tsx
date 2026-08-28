import { useState } from "react";
import { DataTable } from "./DataTable";
import { AdminAPI } from "../../lib/adminApi";

export interface AuditEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

export function AuditSection({
  api
}: {
  api: AdminAPI | null;
}) {
  const [filters, setFilters] = useState({
    admin: "",
    action: "",
    startDate: "",
    endDate: ""
  });

  const fetchPage = (params: { page: number; pageSize: number; query?: string }) =>
    api!.audit({
      ...params,
      ...(filters.admin ? { admin: filters.admin } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {})
    });

  return (
    <section className="audit-section">
      <div className="section-header">
        <h3>Audit Log</h3>
        <div className="filters" role="search">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by admin ID or email…"
            value={filters.admin}
            onChange={(e) => setFilters((f) => ({ ...f, admin: e.target.value }))}
            aria-label="Filter by admin"
          />
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by action type…"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            aria-label="Filter by action type"
          />
          <input
            type="date"
            className="filter-input"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            aria-label="Start date"
          />
          <input
            type="date"
            className="filter-input"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            aria-label="End date"
          />
        </div>
      </div>

      <DataTable<AuditEntry>
        columns={[
          { header: "Timestamp", accessor: (e) => new Date(e.createdAt).toLocaleString() },
          { header: "Admin", accessor: (e) => e.adminEmail ?? e.adminId },
          { header: "Action", accessor: "action" },
          { header: "Target", accessor: (e) => `${e.targetType}:${e.targetId}` },
          { header: "Detail", accessor: "detail" }
        ]}
        fetch={fetchPage}
        emptyTitle="No audit entries"
        emptyMessage="No admin actions have been recorded yet."
        rowKey={(e) => e.id}
      />
    </section>
  );
}

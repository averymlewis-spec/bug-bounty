import { useState } from "react";
import { DataTable } from "./DataTable";
import { ConfirmDialog } from "./ConfirmDialog";
import { AdminAPI } from "../../lib/adminApi";

export interface FlaggedJob {
  id: string;
  title: string;
  budget: string;
  clientId: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
  moderationStatus?: string | null;
  moderationReason?: string | null;
}

export function ListingsSection({
  api,
  onAction
}: {
  api: AdminAPI | null;
  onAction?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    jobId: string;
    decision: "approved" | "rejected" | "escalated";
  } | null>(null);

  const fetchPage = (params: { page: number; pageSize: number; query?: string }) =>
    api!.listings({ ...params, ...(query ? { query } : {}) });

  const handleModerate = async (
    jobId: string,
    decision: "approved" | "rejected" | "escalated",
    reason?: string
  ) => {
    if (!api) return;
    try {
      await api.moderateListing(jobId, decision, reason ?? "");
      onAction?.();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const openModerate = (jobId: string, decision: "approved" | "rejected" | "escalated") => {
    setConfirmState({ jobId, decision });
    setConfirmOpen(true);
  };

  const submitConfirm = () => {
    if (!confirmState) return;
    const { jobId, decision } = confirmState;
    let reason = "";
    if (decision === "rejected" || decision === "escalated") {
      reason = prompt(`Enter reason for ${decision}:`) ?? "";
    }
    handleModerate(jobId, decision, reason || undefined);
    setConfirmOpen(false);
    setConfirmState(null);
  };

  return (
    <section className="listings-section">
      <div className="section-header">
        <h3>Listing Moderation Queue</h3>
        <input
          type="search"
          className="filter-input"
          placeholder="Search flagged listings…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search flagged listings"
        />
      </div>

      <DataTable<FlaggedJob>
        columns={[
          { header: "Title", accessor: "title" },
          { header: "Budget", accessor: "budget" },
          { header: "Flag Reason", accessor: (j) => j.flagReason ?? "—" },
          { header: "Posted", accessor: (j) => new Date(j.createdAt).toLocaleDateString() },
          {
            header: "Status",
            accessor: (j) => j.moderationStatus ?? "pending"
          }
        ]}
        fetch={fetchPage}
        query={query}
        emptyTitle="No flagged listings"
        emptyMessage="All clear — no listings are currently flagged."
        rowKey={(j) => j.id}
        actions={(j) => (
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() => openModerate(j.id, "approved")}
              aria-label={`Approve ${j.title}`}
              title="Approve"
            >
              ✓
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => openModerate(j.id, "rejected")}
              aria-label={`Reject ${j.title}`}
              title="Reject"
            >
              ✗
            </button>
            <button
              type="button"
              className="btn btn-sm btn-warning"
              onClick={() => openModerate(j.id, "escalated")}
              aria-label={`Escalate ${j.title}`}
              title="Escalate"
            >
              ⚠
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmState ? `Confirm ${confirmState.decision}` : "Confirm"}
        message={
          confirmState
            ? `This will ${confirmState.decision === "approved" ? "approve" : confirmState.decision === "rejected" ? "reject — the posting user will be notified with a reason" : "escalate"} the listing "${confirmState.jobId}".`
            : ""
        }
        confirmLabel="Yes, do it"
        requireText={confirmState ? "I confirm" : undefined}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submitConfirm}
      />
    </section>
  );
}

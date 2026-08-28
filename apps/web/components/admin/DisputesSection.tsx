import { useState, useEffect } from "react";
import { DataTable } from "./DataTable";
import { AdminAPI } from "../../lib/adminApi";
import { Loading, ErrorState, Empty } from "./States";

export type Dispute = {
  id: string;
  title: string;
  status: "open" | "under_review" | "resolved";
  freelancerId: string;
  clientId: string;
  jobId: string;
  raisedBy: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  thread: Array<{
    id: string;
    authorId: string;
    authorRole: string;
    body: string;
    createdAt: string;
  }>;
  evidence: Array<{
    id: string;
    name: string;
    url: string;
    uploadedBy: string;
    createdAt: string;
  }>;
  transaction: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
  };
  ruling?: {
    adminId: string;
    winner: string;
    reason: string;
    createdAt: string;
  } | null;
  freelancer?: { id: string; email: string; fullName: string };
  client?: { id: string; email: string; fullName: string };
  job?: { id: string; title: string; budget: string };
};

function DisputeDetailModal({
  open,
  disputeId,
  api,
  onClose,
  onUpdated
}: {
  open: boolean;
  disputeId: string | null;
  api: AdminAPI | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !disputeId || !api) return;
    let cancelled = false;
    api.dispute(disputeId).then((d: unknown) => {
        if (!cancelled) setDispute(d as Dispute);
      }).catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, disputeId, api]);

  const handleRuling = async (winner: "freelancer" | "client", reason: string, action = "rule") => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      await api.ruleDispute(dispute.id, winner, reason, action);
      onUpdated();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const promptRuling = (winner: "freelancer" | "client") => {
    const reason = prompt(`Enter ruling reason for ${winner}:`);
    if (reason) {
      const refund = winner === "client";
      handleRuling(winner, reason, refund ? "refund" : "rule");
    }
  };

  const promptEscalate = () => {
    if (!dispute) return;
    const reason = prompt("Enter escalation reason:");
    if (reason && api) {
      api.escalateDispute(dispute.id, reason).then(() => {
        onUpdated();
        onClose();
      });
    }
  };

  return (
    <div
      className="drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Dispute details"
    >
      <div className="drawer drawer-wide">
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close dispute"
        >
          ✕
        </button>

        {loading && <Loading label="Loading dispute…" />}
        {error && <ErrorState message={error} />}

        {!loading && dispute && (
          <div className="dispute-detail">
            <h3>{dispute.title}</h3>
            <div className="dispute-meta">
              <span>Status: {dispute.status}</span>
              <span>Amount: ${dispute.amount} {dispute.currency}</span>
              <span>Payment: {dispute.transaction.status}</span>
              <span>Freelancer: {dispute.freelancer?.fullName ?? dispute.freelancerId}</span>
              <span>Client: {dispute.client?.fullName ?? dispute.clientId}</span>
              <span>Job: {dispute.job?.title ?? dispute.jobId}</span>
            </div>

            <h4>Dispute Thread</h4>
            {dispute.thread.length ? (
              <ul className="thread">
                {dispute.thread.map((msg) => (
                  <li key={msg.id} className={`msg msg-${msg.authorRole}`}>
                    <span className="msg-author">{msg.authorRole}</span>
                    <span className="msg-body">{msg.body}</span>
                    <span className="msg-time">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No messages" />
            )}

            <h4>Evidence</h4>
            {dispute.evidence.length ? (
              <ul>
                {dispute.evidence.map((ev) => (
                  <li key={ev.id}>
                    <a href={ev.url} target="_blank" rel="noopener noreferrer">
                      {ev.name}
                    </a>
                    <span>Uploaded by: {ev.uploadedBy}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No evidence submitted" />
            )}

            <h4>Actions</h4>
            <div className="row-actions">
              <button
                type="button"
                className="btn btn-success"
                onClick={() => promptRuling("freelancer")}
                aria-label="Rule in favour of freelancer"
              >
                Rule: Freelancer
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => promptRuling("client")}
                aria-label="Rule in favour of client (triggers refund)"
              >
                Rule: Client (Refund)
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={promptEscalate}
                aria-label="Escalate to senior admin"
              >
                Escalate
              </button>
            </div>

            {dispute.ruling && (
              <div className="ruling">
                <h5>Ruling</h5>
                <span>Winner: {dispute.ruling.winner}</span>
                <span>Reason: {dispute.ruling.reason}</span>
                <span>
                  By admin: {dispute.ruling.adminId} at{" "}
                  {new Date(dispute.ruling.createdAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DisputesSection({
  api,
  onAction
}: {
  api: AdminAPI | null;
  onAction?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchPage = (params: { page: number; pageSize: number; query?: string }) =>
    api!.disputes({
      ...params,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query ? { query } : {})
    });

  return (
    <section className="disputes-section">
      <div className="section-header">
        <h3>Dispute Resolution Queue</h3>
        <div className="filters" role="search">
          <input
            type="search"
            className="filter-input"
            placeholder="Search disputes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search disputes"
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <DataTable<Dispute>
        columns={[
          { header: "Dispute", accessor: (d) => d.title },
          { header: "Status", accessor: "status" },
          { header: "Amount", accessor: (d) => `$${d.amount} ${d.currency}` },
          { header: "Freelancer", accessor: (d) => d.freelancer?.fullName ?? d.freelancerId },
          { header: "Client", accessor: (d) => d.client?.fullName ?? d.clientId },
          { header: "Opened", accessor: (d) => new Date(d.createdAt).toLocaleDateString() }
        ]}
        fetch={fetchPage}
        query={query}
        emptyTitle="No disputes"
        emptyMessage="There are no disputes matching your criteria."
        rowKey={(d) => d.id}
        actions={(d) => (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setDetailId(d.id);
              setDetailOpen(true);
            }}
            aria-label={`View dispute ${d.title}`}
            title="View dispute"
          >
            👁
          </button>
        )}
      />

      {detailOpen && detailId && api && (
        <DisputeDetailModal
          open={detailOpen}
          disputeId={detailId}
          api={api}
          onClose={() => setDetailOpen(false)}
          onUpdated={onAction ?? (() => {})}
        />
      )}
    </section>
  );
}

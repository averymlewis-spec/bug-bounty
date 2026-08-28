import { useEffect, useState } from "react";
import { AdminAPI } from "../../lib/adminApi";
import { Loading, Empty, ErrorState } from "./States";

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
  banReason?: string;
}

export interface AdminJob {
  id: string;
  title: string;
  budget: string;
  status: string;
}

export interface AdminDisputeSummary {
  id: string;
  title: string;
  status: "open" | "under_review" | "resolved";
  amount: number;
  currency: string;
  createdAt: string;
}

type DetailData = {
  user: AdminUser;
  activeJobs: AdminJob[];
  disputeHistory: AdminDisputeSummary[];
};

interface DrawerProps {
  open: boolean;
  userId: string | null;
  api: AdminAPI | null;
  onClose: () => void;
}

/**
 * Slide-in drawer that shows a user's profile, active jobs and dispute
 * history. Fetches the full user detail via the admin API.
 */
export function UserDetailDrawer({ open, userId, api, onClose }: DrawerProps) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId || !api) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const result = await api.user(userId);
        if (!cancelled) setData(result as DetailData);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [open, userId, api]);

  if (!open) return null;

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={data?.user ? `Profile: ${data.user.fullName}` : "User profile"}
    >
      <div className="drawer">
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close profile"
        >
          ✕
        </button>

        {loading ? (
          <Loading label="Loading profile…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data ? (
          <Empty title="No user selected" />
        ) : (
          <div className="drawer-content">
            <h3>{data.user.fullName}</h3>
            <div className="user-meta">
              <span>Email: {data.user.email}</span>
              <span>Role: {data.user.role}</span>
              <span>Status: {data.user.status}</span>
              <span>Trust Score: {data.user.trustScore ?? 0}</span>
              <span>Verified: {data.user.isVerified ? "Yes" : "No"}</span>
              {data.user.banReason && <span>Ban reason: {data.user.banReason}</span>}
              <span>Joined: {new Date(data.user.createdAt).toLocaleString()}</span>
              <span>Last updated: {new Date(data.user.updatedAt).toLocaleString()}</span>
            </div>

            <h4>Active Jobs</h4>
            {data.activeJobs.length ? (
              <ul>
                {data.activeJobs.map((job) => (
                  <li key={job.id}>
                    <strong>{job.title}</strong> — {job.budget} ({job.status})
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No active jobs" />
            )}

            <h4>Dispute History</h4>
            {data.disputeHistory.length ? (
              <ul>
                {data.disputeHistory.map((d) => (
                  <li key={d.id}>
                    <strong>{d.title}</strong> — {d.status} (${d.amount}{" "}
                    {d.currency})
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No disputes" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

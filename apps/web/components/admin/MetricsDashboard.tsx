import { useEffect } from "react";
import { Loading, Empty, ErrorState } from "./States";
import { AdminAPI } from "../../lib/adminApi";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: string;
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div className="summary-card" role="figure">
      <div className="summary-icon" aria-hidden="true">
        {icon ?? "•"}
      </div>
      <div className="summary-value">{value}</div>
      <div className="summary-label">{label}</div>
    </div>
  );
}

/** Trust score distribution — simple bar chart rendered inline. */
function TrustChart({ distribution }: { distribution: { range: string; count: number }[] }) {
  if (!distribution || distribution.length === 0) {
    return <Empty title="No trust data" message="Trust scores are not available yet." />;
  }
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  return (
    <div className="trust-chart" role="img" aria-label="Trust score distribution">
      <h4>Trust Score Distribution</h4>
      <div className="trust-bars">
        {distribution.map((bucket) => {
          const height = (bucket.count / maxCount) * 100;
          return (
            <div key={bucket.range} className="trust-bucket">
              <div
                className="trust-bar"
                style={{ height: `${height}%` }}
                aria-label={`${bucket.range}: ${bucket.count} users`}
              />
              <span className="trust-count">{bucket.count}</span>
              <span className="trust-range">{bucket.range}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MetricsDashboard({
  api,
  onRefresh,
  loading,
  error,
  data,
  onRetry
}: {
  api: AdminAPI | null;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  data?: {
    summary: {
      totalUsers: number;
      activeJobs: number;
      openDisputes: number;
      flaggedListings: number;
      revenue: number;
    };
    trustDistribution: { range: string; count: number }[];
  } | null;
  onRetry?: () => void;
}) {
  useEffect(() => {
    if (api && !data && !loading) {
      onRefresh?.();
    }
  }, [api]);

  if (loading) return <Loading label="Loading metrics…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return <Empty title="No metrics available" />;

  const fmt = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <section className="metrics-section">
      <div className="section-header">
        <h3>Trust &amp; Metrics Dashboard</h3>
        <button
          type="button"
          className="btn"
          onClick={onRefresh}
          aria-label="Refresh metrics"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="grid">
        <SummaryCard label="Total Users" value={fmt(data.summary.totalUsers)} icon="👥" />
        <SummaryCard label="Active Jobs" value={fmt(data.summary.activeJobs)} icon="💼" />
        <SummaryCard label="Open Disputes" value={fmt(data.summary.openDisputes)} icon="⚖️" />
        <SummaryCard label="Flagged Listings" value={fmt(data.summary.flaggedListings)} icon="🎯" />
        <SummaryCard
          label="Revenue (period)"
          value={`$${fmt(data.summary.revenue)}`}
          icon="💰"
        />
      </div>

      <TrustChart distribution={data.trustDistribution} />
    </section>
  );
}

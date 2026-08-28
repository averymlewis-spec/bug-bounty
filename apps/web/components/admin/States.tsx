import { ReactNode } from "react";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="loading-state"
      role="status"
      aria-label={label}
    >
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({
  title = "No results",
  message
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="empty-state" role="status">
      <span aria-hidden="true">
        ◻
      </span>
      <h4>{title}</h4>
      {message && <p>{message}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <span aria-hidden="true">⚠</span>
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          className="btn"
          onClick={onRetry}
          aria-label="Retry"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/** Server-side pagination control rendered at the table footer. */
export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav
      className="pagination"
      aria-label="Table navigation"
      role="navigation"
    >
      <button
        type="button"
        className="btn btn-ghost"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? "btn btn-active" : "btn"}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-ghost"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next ›
      </button>
      <span className="page-info" aria-live="polite">
        {total} rows · {pageSize} / page
      </span>
    </nav>
  );
}

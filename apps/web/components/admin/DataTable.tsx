import { ReactNode, useState } from "react";
import { Pagination, Loading, Empty, ErrorState } from "./States";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  fetch: (params: { page: number; pageSize: number; query?: string }) => Promise<{
    data: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  query?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  rowKey?: (row: T) => string;
  actions?: (row: T) => ReactNode;
}

/**
 * Generic server-side paginated data table with loading, empty and error
 * states. Accepts a fetch function + columns so it can be reused across
 * users, listings, disputes and audit rows.
 */
export function DataTable<T>({
  columns,
  fetch,
  query = "",
  pageSize = 15,
  emptyTitle = "No results",
  emptyMessage,
  rowKey,
  actions
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    data: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } | null>(null);

  const load = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch({ page: p, pageSize, query });
      setResult(res);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => load(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (!result && !loading && !error) {
    load(1);
  }

  const rows = result?.data ?? [];
  const pagination = result?.pagination ?? {
    page,
    pageSize,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  };

  return (
    <div className="datatable">
      {loading ? (
        <Loading label="Loading…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : rows.length === 0 ? (
        <Empty title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          <table role="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.header}
                    scope="col"
                    className={col.className}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && <th scope="col" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={rowKey ? rowKey(row) : i}>
                  {columns.map((col) => (
                    <td key={col.header} className={col.className}>
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : String(row[col.accessor] ?? "")}
                    </td>
                  ))}
                  {actions && <td className="actions-cell">{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(p) => {
              setPage(p);
              load(p);
            }}
          />
        </>
      )}
    </div>
  );
}

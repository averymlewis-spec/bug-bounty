import { useState, useCallback } from "react";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic data-fetching hook for admin views. Returns the current state,
 * a fetch function that can be re-invoked for manual refresh, and helpers
 * to trigger loading/error transitions.
 */
export function useAdminFetch<T>(
  initial: T | null = null
) {
  const [state, setState] = useState<FetchState<T>>({
    data: initial,
    loading: false,
    error: null
  });

  const fetch = useCallback(
    async (fn: () => Promise<T>) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fn();
        setState({ data, loading: false, error: null });
        return data;
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : typeof e === "object" && e !== null && "message" in e
              ? String((e as { message?: unknown }).message)
              : "An error occurred";
        setState({ data: null, loading: false, error: message });
        throw e;
      }
    },
    []
  );

  return { ...state, fetch, refetch: fetch };
}

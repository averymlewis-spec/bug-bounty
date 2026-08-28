import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { AdminAPI } from "../../lib/adminApi";
import { Loading, ErrorState } from "./States";

export function ControlsSection({
  api,
  settings,
  onAction
}: {
  api: AdminAPI | null;
  settings: { registrationsEnabled: boolean; jobPostingsEnabled: boolean } | null;
  onAction?: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    key: string;
    value: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openToggle = (key: string, value: boolean) => {
    setConfirmState({ key, value });
    setConfirmOpen(true);
  };

  const submitToggle = async () => {
    if (!confirmState || !api) return;
    setLoading(true);
    setError(null);
    try {
      await api.togglePlatform(confirmState.key, confirmState.value);
      onAction?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setConfirmState(null);
    }
  };

  if (loading) return <Loading label="Applying toggle…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <section className="controls-section">
      <h3>Platform Controls</h3>
      <div className="control-grid">
        <div className="control-item">
          <label htmlFor="toggle-registrations">
            New User Registrations
          </label>
          <button
            id="toggle-registrations"
            type="button"
            className={settings?.registrationsEnabled ? "btn btn-on" : "btn btn-off"}
            onClick={() =>
              openToggle("registrationsEnabled", !settings?.registrationsEnabled)
            }
            aria-checked={settings?.registrationsEnabled}
            role="switch"
          >
            <span
              className="toggle-thumb"
              style={{
                float: settings?.registrationsEnabled ? "right" : "left"
              }}
            />
            {settings?.registrationsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="control-item">
          <label htmlFor="toggle-job-postings">
            New Job Postings
          </label>
          <button
            id="toggle-job-postings"
            type="button"
            className={settings?.jobPostingsEnabled ? "btn btn-on" : "btn btn-off"}
            onClick={() =>
              openToggle("jobPostingsEnabled", !settings?.jobPostingsEnabled)
            }
            aria-checked={settings?.jobPostingsEnabled}
            role="switch"
          >
            <span
              className="toggle-thumb"
              style={{
                float: settings?.jobPostingsEnabled ? "right" : "left"
              }}
            />
            {settings?.jobPostingsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      <p className="control-hint">
        All toggle changes are recorded in the audit log with the admin's ID
        and a timestamp.
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm platform toggle"
        message={
          confirmState
            ? `This will ${confirmState.value ? "enable" : "disable"} ${confirmState.key}. Continue?`
            : ""
        }
        confirmLabel="Apply"
        requireText={confirmState ? "toggle" : undefined}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submitToggle}
      />
    </section>
  );
}

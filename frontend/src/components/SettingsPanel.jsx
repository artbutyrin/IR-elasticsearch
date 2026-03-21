export default function SettingsPanel({
  open,
  onToggle,
  esOk,
  errorMessage,
  successMessage,
  onReset,
  onSeed,
  onImportCsv,
  importing,
  loading,
}) {
  return (
    <>
      <button className="settings-trigger" onClick={onToggle}>
        Settings
      </button>
      <aside className={`settings-panel ${open ? "open" : ""}`}>
        <div className="settings-title">Connection settings</div>
        <div className="settings-row">
          <span>Status:</span>
          <span className={esOk ? "status-ok" : "status-err"}>
            {esOk ? "Elasticsearch reachable" : "Elasticsearch unavailable"}
          </span>
        </div>
        {errorMessage ? (
          <div className="settings-error">{errorMessage}</div>
        ) : (
          <div className="settings-hint">No connection errors.</div>
        )}
        {successMessage && <div className="settings-success">{successMessage}</div>}
        <div className="settings-section-title">TMDB dataset</div>
        <p className="settings-hint">
          Import TMDB CSV (v11). Large files may take several minutes — keep this tab open.
        </p>
        <label className="settings-file-label">
          <input
            type="file"
            accept=".csv"
            disabled={importing || loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportCsv(f);
              e.target.value = "";
            }}
          />
          <span>{importing ? "Importing…" : "Choose CSV & import"}</span>
        </label>
        <div className="settings-actions">
          <button className="reset-btn" onClick={onReset}>
            Reset filters
          </button>
          <button className="seed-btn" onClick={onSeed} disabled={loading || importing}>
            Seed demo data
          </button>
        </div>
      </aside>
    </>
  );
}

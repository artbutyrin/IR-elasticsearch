export default function DebugPanel({ query, total, genre, yearFrom, yearTo }) {
  return (
    <div id="debug-panel">
      <div className="debug-head">
        <div className="debug-title">ES Debug</div>
      </div>
      <div className="debug-body open">
        <div className="debug-row">
          <span className="debug-key">Query:</span>
          <span className="debug-val">{query || "match_all"}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Genre:</span>
          <span className="debug-val">{genre || "-"}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Year from:</span>
          <span className="debug-val">{yearFrom || "-"}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Year to:</span>
          <span className="debug-val">{yearTo || "-"}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Hits:</span>
          <span className="debug-val">{total}</span>
        </div>
      </div>
    </div>
  );
}

import PaginationControls from "./PaginationControls";

export default function ResultsBar({
  total,
  query,
  view,
  onViewChange,
  page,
  pageSize,
  totalPages,
  onPageChange,
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div id="results-bar">
      <div className="results-info">
        <div className="results-count">{total}</div>
        <div className="results-label">results</div>
        {query && <div className="results-query-badge">"{query}"</div>}
        {total > 0 && (
          <div className="results-range">
            Results <strong>{start}</strong>–<strong>{end}</strong> of {total.toLocaleString()}
            {totalPages > 1 && <span className="results-page-hint"> · page {page} shows #{start}–#{end}</span>}
          </div>
        )}
      </div>

      <div className="results-bar-right">
        <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
        {totalPages === 1 && total > 0 && (
          <span className="page-info">Single page (all {total.toLocaleString()} results)</span>
        )}
        <div className="view-toggle">
          <button className={`view-btn ${view === "grid" ? "on" : ""}`} onClick={() => onViewChange("grid")}>
            ⊞
          </button>
          <button className={`view-btn ${view === "list" ? "on" : ""}`} onClick={() => onViewChange("list")}>
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}

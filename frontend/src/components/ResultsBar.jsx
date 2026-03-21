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

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div id="results-bar">
      <div className="results-info">
        <div className="results-count">{total}</div>
        <div className="results-label">results</div>
        {query && <div className="results-query-badge">"{query}"</div>}
        {total > 0 && (
          <div className="results-range">
            Showing {start}–{end}
          </div>
        )}
      </div>

      <div className="results-bar-right">
        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="page-btn" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
              ‹
            </button>
            <span className="page-info">
              Page {page} / {totalPages}
            </span>
            <button type="button" className="page-btn" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
              ›
            </button>
          </div>
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

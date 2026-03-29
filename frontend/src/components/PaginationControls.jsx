function buildPageList(current, totalPages) {
  if (totalPages <= 1) return [];
  const delta = 2;
  const set = new Set([1, totalPages]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= totalPages) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("ellipsis");
    out.push(n);
    prev = n;
  }
  return out;
}

export default function PaginationControls({ page, totalPages, onPageChange, className = "" }) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageList = buildPageList(page, totalPages);

  return (
    <div className={`pagination ${className}`.trim()}>
      <button type="button" className="page-btn" disabled={!canPrev} onClick={() => onPageChange(1)} title="First page">
        «
      </button>
      <button type="button" className="page-btn" disabled={!canPrev} onClick={() => onPageChange(page - 1)} title="Previous page">
        ‹
      </button>
      <div className="page-numbers">
        {pageList.map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`e-${idx}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`page-num-btn ${item === page ? "on" : ""}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}
      </div>
      <button type="button" className="page-btn" disabled={!canNext} onClick={() => onPageChange(page + 1)} title="Next page">
        ›
      </button>
      <button type="button" className="page-btn" disabled={!canNext} onClick={() => onPageChange(totalPages)} title="Last page">
        »
      </button>
      <span className="page-info">
        Page {page} / {totalPages}
      </span>
    </div>
  );
}

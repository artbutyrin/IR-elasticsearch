export default function States({ loading, message, total, hasSearch }) {
  if (loading) {
    return (
      <div className="state-center show">
        <div className="spinner" />
        <div className="loading-text">Elasticsearch is searching...</div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="state-center show">
        <div className="state-icon">⚡</div>
        <div className="state-title">Connection error</div>
        <div className="state-sub">{message}</div>
      </div>
    );
  }

  if (!hasSearch) {
    return (
      <div className="state-center show">
        <div className="state-icon">🎬</div>
        <div className="state-title">Movie Search</div>
        <div className="state-sub">Enter a query and press Search.</div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="state-center show">
        <div className="state-icon">◻</div>
        <div className="state-title">No results found</div>
        <div className="state-sub">Try another query or remove filters.</div>
      </div>
    );
  }

  return null;
}

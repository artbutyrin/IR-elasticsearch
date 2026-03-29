import { Link, useLocation } from "react-router-dom";

export default function Topbar({ query, onQueryChange, onSearch, onClear }) {
  const location = useLocation();
  const canClear = Boolean(onClear && query?.trim());

  return (
    <header id="topbar">
      <div className="logo">
        <span className="logo-badge">IR-</span>
        elasticsearch
      </div>

      <nav className="top-nav">
        <Link className={location.pathname === "/" ? "nav-link on" : "nav-link"} to="/">
          Search
        </Link>
        <Link className={location.pathname === "/how-elastic-works" ? "nav-link on" : "nav-link"} to="/how-elastic-works">
          How ES works
        </Link>
        <Link className={location.pathname === "/query-compare" ? "nav-link on" : "nav-link"} to="/query-compare">
          Query compare
        </Link>
      </nav>

      <div className="topbar-search">
        <label className="topbar-search-field">
          <span className="visually-hidden">Search movies</span>
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search movies..."
            aria-label="Search movies"
          />
        </label>
        {onClear && (
          <button
            type="button"
            className="topbar-clear-btn"
            onClick={onClear}
            disabled={!canClear}
            title="Clear search box"
          >
            Clear
          </button>
        )}
        <button type="button" className="topbar-search-btn" onClick={onSearch}>
          Search
        </button>
      </div>

      <div className="topbar-right">
        {/* ES status moved to settings panel */}
      </div>
    </header>
  );
}

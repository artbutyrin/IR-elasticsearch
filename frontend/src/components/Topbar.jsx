import { Link, useLocation } from "react-router-dom";

export default function Topbar({ query, onQueryChange, onSearch }) {
  const location = useLocation();

  return (
    <header id="topbar">
      <div className="logo">
        CineSearch <span className="logo-badge">ES</span>
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
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search movies..."
        />
        <button className="topbar-search-btn" onClick={onSearch}>
          Search
        </button>
      </div>

      <div className="topbar-right">
        {/* ES status moved to settings panel */}
      </div>
    </header>
  );
}

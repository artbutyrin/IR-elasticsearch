import { GENRES, QUICK_QUERIES } from "../constants";

export default function Sidebar({
  genre,
  yearFrom,
  yearTo,
  onGenreChange,
  onYearFromChange,
  onYearToChange,
  onQuickQuery,
}) {
  return (
    <aside id="sidebar">
      <div className="sidebar-block">
        <div className="sidebar-heading">Quick Queries</div>
        <div className="genre-cloud">
          {QUICK_QUERIES.map((item) => (
            <button key={item} className="genre-pill" onClick={() => onQuickQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-block">
        <div className="sidebar-heading">Filters</div>
        <div className="filter-group">
          <div className="filter-row">
            <div className="filter-label">Genre</div>
            <select className="filter-select" value={genre} onChange={(e) => onGenreChange(e.target.value)}>
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-row">
            <div className="filter-label">Year range</div>
            <div className="filter-range-row">
              <input
                className="filter-input"
                value={yearFrom}
                onChange={(e) => onYearFromChange(e.target.value)}
                placeholder="From"
              />
              <input
                className="filter-input"
                value={yearTo}
                onChange={(e) => onYearToChange(e.target.value)}
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-block">
        <div className="sidebar-heading">Genre Cloud</div>
        <div className="genre-cloud">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`genre-pill ${genre === g ? "on" : ""}`}
              onClick={() => onGenreChange(genre === g ? "" : g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

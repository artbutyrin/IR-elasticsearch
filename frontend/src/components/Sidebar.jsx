import { GENRES, QUICK_QUERIES } from "../constants";

export default function Sidebar({
  genre,
  yearFrom,
  yearTo,
  fuzzyEnabled,
  onGenreChange,
  onYearFromChange,
  onYearToChange,
  onFuzzyChange,
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

          <div className="filter-row filter-toggle-row">
            <label className="filter-toggle">
              <input
                type="checkbox"
                checked={fuzzyEnabled}
                onChange={(e) => onFuzzyChange(e.target.checked)}
              />
              <span>
                <strong>Fuzzy</strong> <span className="filter-toggle-hint">(AUTO vs off)</span>
              </span>
            </label>
            <p className="filter-microcopy">Typo-tolerant multi_match. Turn off to see strict token matching.</p>
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

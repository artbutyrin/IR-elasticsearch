import { useState } from "react";
import PaginationControls from "./PaginationControls";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function posterUrl(movie) {
  const p = movie.poster_path;
  if (!p) return null;
  if (String(p).startsWith("http")) return p;
  return `${TMDB_IMG}${p}`;
}

function displayRating(movie) {
  const v = movie.vote_average ?? movie.rating;
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(1);
}

function displayOverview(movie) {
  return movie.overview || movie.description || "";
}

function displayGenres(movie) {
  return movie.genres || movie.genre || "";
}

function cardKey(movie) {
  if (movie.id != null) return `movie-${movie.id}`;
  return `${movie.title}-${movie.year ?? "x"}`;
}

function genreTags(movie) {
  return displayGenres(movie)
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function MovieGridCard({ movie }) {
  const [imgBroken, setImgBroken] = useState(false);
  const poster = posterUrl(movie);
  const letter = (movie.title || "?")[0].toUpperCase();
  const showImg = Boolean(poster) && !imgBroken;

  return (
    <article className="card-grid">
      <div className="card-poster">
        {showImg ? (
          <img src={poster} alt="" loading="lazy" onError={() => setImgBroken(true)} />
        ) : (
          <div className="card-poster-ph">
            <div className="card-poster-ph-letter">{letter}</div>
          </div>
        )}
        <div className="card-score">★ {displayRating(movie)}</div>
      </div>
      <div className="card-body">
        <div className="card-year">{movie.year ?? "—"}</div>
        <div className="card-title">{movie.title}</div>
        <div className="card-genres">
          {genreTags(movie)
            .slice(0, 3)
            .map((g) => (
              <span key={g} className="card-genre-tag">
                {g}
              </span>
            ))}
        </div>
        <div className="card-overview">{displayOverview(movie)}</div>
      </div>
    </article>
  );
}

function MovieListCard({ movie }) {
  const [imgBroken, setImgBroken] = useState(false);
  const poster = posterUrl(movie);
  const letter = (movie.title || "?")[0].toUpperCase();
  const showImg = Boolean(poster) && !imgBroken;

  return (
    <article className="card-list">
      <div className="card-list-thumb">
        {showImg ? (
          <img src={poster} alt="" loading="lazy" onError={() => setImgBroken(true)} />
        ) : (
          <div className="card-list-thumb-ph">{letter}</div>
        )}
      </div>
      <div className="card-list-body">
        <div className="card-list-row1">
          <div className="card-list-title">{movie.title}</div>
          <div className="card-list-year">{movie.year ?? "—"}</div>
          <div className="card-list-score">★ {displayRating(movie)}</div>
        </div>
        <div className="card-list-genres">
          {genreTags(movie)
            .slice(0, 4)
            .map((g) => (
              <span key={g} className="card-genre-tag">
                {g}
              </span>
            ))}
        </div>
        <div className="card-list-overview">{displayOverview(movie)}</div>
        <div className="card-list-meta">
          <span>ES score: {movie._score != null ? Number(movie._score).toFixed(2) : "—"}</span>
        </div>
      </div>
    </article>
  );
}

/**
 * Pagination is rendered inside #cards-area (directly under the last row of cards)
 * so it always scrolls with results and is not lost to flex/layout outside the list.
 */
export default function MoviesView({ view, results, pagination, resultPage = 1 }) {
  if (!results.length) {
    return null;
  }

  const totalNum = pagination ? Number(pagination.total) || 0 : 0;
  const pageNum = pagination ? Number(pagination.page) || 1 : 1;
  // Include page in React keys so list items are not reused across pages (avoids stale card content).
  const rowKey = (movie) => `p${resultPage}-${cardKey(movie)}`;
  const pageSize = pagination ? Number(pagination.pageSize) || 24 : 24;
  const totalPagesNum = pagination ? Number(pagination.totalPages) || 0 : 0;
  const showPager = Boolean(pagination && totalPagesNum > 1 && pagination.onPageChange);

  return (
    <div id="cards-area">
      <div className={view === "grid" ? "cards-grid" : "cards-list"}>
        {results.map((movie) =>
          view === "grid" ? (
            <MovieGridCard key={rowKey(movie)} movie={movie} />
          ) : (
            <MovieListCard key={rowKey(movie)} movie={movie} />
          )
        )}
      </div>
      {showPager && (
        <footer className="pagination-footer pagination-footer--under-cards" aria-label="Next page">
          <div className="pagination-footer-title">More results</div>
          <PaginationControls
            page={pageNum}
            totalPages={totalPagesNum}
            onPageChange={pagination.onPageChange}
          />
          <p className="pagination-footer-hint">
            Showing {totalNum ? `${(pageNum - 1) * pageSize + 1}–${Math.min(pageNum * pageSize, totalNum)}` : "—"} of{" "}
            {totalNum.toLocaleString()} · use ‹ › or page numbers
          </p>
        </footer>
      )}
    </div>
  );
}

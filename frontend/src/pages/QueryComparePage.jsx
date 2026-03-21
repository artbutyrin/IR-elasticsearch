import { useState } from "react";
import { Link } from "react-router-dom";
import { compareQueries } from "../api/moviesApi";
import Topbar from "../components/Topbar";

export default function QueryComparePage() {
  const [q, setQ] = useState("interstllar");
  const [fuzzy, setFuzzy] = useState(true);
  const [topN, setTopN] = useState(8);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await compareQueries({
        q,
        topN: Number(topN) || 8,
        fuzzy,
      });
      setData(res);
    } catch {
      setError("Cannot load comparison. Start backend + Elasticsearch and try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const left = data?.multi_match_side;
  const right = data?.match_phrase_side;

  return (
    <>
      <Topbar query="" onQueryChange={() => {}} onSearch={() => {}} />
      <div className="compare-page">
        <p className="compare-back">
          <Link to="/how-elastic-works">← How ES works</Link>
          {" · "}
          <Link to="/">Search</Link>
        </p>
        <h1>Query comparison (side-by-side)</h1>
        <p className="compare-lead">
          Two Elasticsearch queries run with the <strong>same filters</strong>:{" "}
          <code>multi_match</code> (several text fields) vs <code>match_phrase</code> on <code>title</code> only.
          Typos illustrate how fuzzy token matching differs from strict phrase matching.
        </p>

        <div className="compare-controls">
          <div className="compare-controls-row">
            <label className="compare-label">
              Query
              <input
                className="compare-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try interstllar vs interstellar"
              />
            </label>
            <label className="compare-label compare-label-narrow">
              Top hits
              <input
                className="compare-input"
                type="number"
                min={1}
                max={24}
                value={topN}
                onChange={(e) => setTopN(e.target.value)}
              />
            </label>
            <button type="button" className="compare-run-btn" onClick={run} disabled={loading}>
              {loading ? "Running…" : "Run comparison"}
            </button>
          </div>
          <div className="compare-toggles">
            <label className="filter-toggle">
              <input type="checkbox" checked={fuzzy} onChange={(e) => setFuzzy(e.target.checked)} />
              <span>
                <strong>Fuzzy</strong> on multi_match side <span className="filter-toggle-hint">(AUTO vs 0)</span>
              </span>
            </label>
          </div>
        </div>

        {error && <p className="sample-error">{error}</p>}

        {left && right && (
          <div className="compare-grid">
            <section className="compare-col">
              <h2>{left.label}</h2>
              <p className="compare-desc">{left.description}</p>
              <p className="compare-total">
                Total hits: <strong>{left.total.toLocaleString()}</strong>
              </p>
              <pre className="compare-json">{JSON.stringify(left.elasticsearch_query, null, 2)}</pre>
              <h3 className="compare-h3">Top titles</h3>
              <ol className="compare-hit-list">
                {left.top_hits.map((h, i) => (
                  <li key={`L-${h.id ?? i}-${h.title}`}>
                    <span className="compare-hit-title">{h.title || "—"}</span>
                    <span className="compare-hit-meta">
                      {h.year != null ? `${h.year} · ` : ""}
                      score {h.score != null ? Number(h.score).toFixed(2) : "—"}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="compare-col">
              <h2>{right.label}</h2>
              <p className="compare-desc">{right.description}</p>
              <p className="compare-total">
                Total hits: <strong>{right.total.toLocaleString()}</strong>
              </p>
              <pre className="compare-json">{JSON.stringify(right.elasticsearch_query, null, 2)}</pre>
              <h3 className="compare-h3">Top titles</h3>
              <ol className="compare-hit-list">
                {right.top_hits.length === 0 ? (
                  <li className="compare-hit-empty">No phrase match — expected for typos.</li>
                ) : (
                  right.top_hits.map((h, i) => (
                    <li key={`R-${h.id ?? i}-${h.title}`}>
                      <span className="compare-hit-title">{h.title || "—"}</span>
                      <span className="compare-hit-meta">
                        {h.year != null ? `${h.year} · ` : ""}
                        score {h.score != null ? Number(h.score).toFixed(2) : "—"}
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </section>
          </div>
        )}

        <p className="compare-api-hint">
          API: <code>GET /search/compare?q=…&amp;top_n=8&amp;fuzzy=true|false</code>
        </p>
      </div>
    </>
  );
}

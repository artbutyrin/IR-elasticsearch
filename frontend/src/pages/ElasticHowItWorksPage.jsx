import { useState } from "react";
import { Link } from "react-router-dom";
import { searchMovies } from "../api/moviesApi";
import Topbar from "../components/Topbar";

export default function ElasticHowItWorksPage() {
  const [sampleQuery, setSampleQuery] = useState("interstllar");
  const [topQuery, setTopQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSample = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await searchMovies({ q: sampleQuery, genre: "", yearFrom: "", yearTo: "" });
      setResponse(data);
    } catch {
      setError("Cannot run sample query. Start backend first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar query={topQuery} onQueryChange={setTopQuery} onSearch={() => setSampleQuery(topQuery || sampleQuery)} />
      <div className="how-page">
        <h1>How Elasticsearch works in this project</h1>
        <p className="how-intro">
          <Link to="/query-compare">Open Query compare</Link> for side-by-side JSON: <code>multi_match</code> (fuzzy) vs{" "}
          <code>match_phrase</code> on the title.
        </p>
        <div className="flow-grid">
          <div className="flow-card">
            <h3>1) Indexing</h3>
            <p>
              <code>POST /seed-movies</code> or CSV import creates the <code>movies</code> index and stores documents (TMDB
              fields + <code>adult</code> when present).
            </p>
          </div>
          <div className="flow-card">
            <h3>2) Query parsing</h3>
            <p>
              The React UI sends <code>q</code>, filters, and <code>fuzzy</code> to FastAPI.
            </p>
          </div>
          <div className="flow-card">
            <h3>3) ES search</h3>
            <p>
              Backend builds a <code>bool</code> query: <code>multi_match</code> on several analyzed fields (optional
              fuzziness), plus <code>filter</code> clauses for genre/year.
            </p>
          </div>
          <div className="flow-card">
            <h3>4) Ranking</h3>
            <p>Elasticsearch scores hits by relevance (<code>_score</code>) and returns the requested page.</p>
          </div>
        </div>

        <div className="kibana-panel">
          <h2>Kibana (one slide + one live step)</h2>
          <p className="kibana-lead">
            Use Kibana to make the chain <strong>UI → API → index</strong> obvious. With Docker Compose, open{" "}
            <a href="http://localhost:5601" target="_blank" rel="noreferrer">
              http://localhost:5601
            </a>
            .
          </p>
          <ol className="kibana-steps">
            <li>
              <strong>Discover</strong> — create a data view for the <code>movies</code> index (or use the index pattern{" "}
              <code>movies*</code>).
            </li>
            <li>
              <strong>Browse documents</strong> — pick one hit and expand JSON: see <code>title</code>,{" "}
              <code>overview</code>, <code>genres_list</code>, <code>adult</code>, etc.
            </li>
            <li>
              <strong>Mapping</strong> — in Dev Tools: <code>GET movies/_mapping</code>. Point out{" "}
              <code>text</code> (analyzed full-text, e.g. <code>title</code>) vs <code>keyword</code> (exact filters, e.g.{" "}
              <code>genres_list</code>, <code>poster_path</code>).
            </li>
          </ol>
          <p className="kibana-note">
            Talking point: the search bar in the app issues HTTP to FastAPI; FastAPI translates that into the JSON query
            body you can also run or inspect in Kibana.
          </p>
        </div>

        <div className="sample-box">
          <h2>Live sample (full API response)</h2>
          <div className="sample-row">
            <input value={sampleQuery} onChange={(e) => setSampleQuery(e.target.value)} />
            <button type="button" onClick={runSample} disabled={loading}>
              {loading ? "Running..." : "Run query"}
            </button>
          </div>
          <p className="sample-hint">
            Try a typo with fuzzy on (default on main Search page): <code>interstllar</code>. Toggle <strong>Fuzzy</strong>{" "}
            off on the Search page to compare.
          </p>
          {error && <p className="sample-error">{error}</p>}
          {response && <pre className="sample-json">{JSON.stringify(response, null, 2)}</pre>}
        </div>
      </div>
    </>
  );
}

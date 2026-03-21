import { useState } from "react";
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
        <div className="flow-grid">
          <div className="flow-card">
            <h3>1) Indexing</h3>
            <p>`POST /seed-movies` creates the `movies` index and stores film documents.</p>
          </div>
          <div className="flow-card">
            <h3>2) Query parsing</h3>
            <p>Frontend sends `q`, `genre`, `year_from`, `year_to` to FastAPI.</p>
          </div>
          <div className="flow-card">
            <h3>3) ES search</h3>
            <p>Backend builds a `bool` query with `multi_match` + filters + highlight.</p>
          </div>
          <div className="flow-card">
            <h3>4) Ranking</h3>
            <p>Elasticsearch scores results by relevance and returns top matches.</p>
          </div>
        </div>

        <div className="sample-box">
          <h2>Live sample</h2>
          <div className="sample-row">
            <input value={sampleQuery} onChange={(e) => setSampleQuery(e.target.value)} />
            <button onClick={runSample} disabled={loading}>
              {loading ? "Running..." : "Run query"}
            </button>
          </div>
          <p className="sample-hint">
            Try typo query to show fuzzy search, for example: <code>interstllar</code>.
          </p>
          {error && <p className="sample-error">{error}</p>}
          {response && (
            <pre className="sample-json">{JSON.stringify(response, null, 2)}</pre>
          )}
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { checkBackendHealth, importTmdbCsv, searchMovies, seedMovies } from "../api/moviesApi";
import MoviesView from "../components/MoviesView";
import ResultsBar from "../components/ResultsBar";
import SettingsPanel from "../components/SettingsPanel";
import Sidebar from "../components/Sidebar";
import States from "../components/States";
import Topbar from "../components/Topbar";

const PAGE_SIZE = 24;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [view, setView] = useState("grid");
  const [hasSearch, setHasSearch] = useState(false);
  const [esOk, setEsOk] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fuzzyEnabled, setFuzzyEnabled] = useState(true);

  const searchAbortRef = useRef(null);
  const searchSeqRef = useRef(0);

  const fetchResults = async (nextPage, qOverride, opts = {}) => {
    const q = qOverride !== undefined && qOverride !== null ? qOverride : query;
    const pageToFetch = Number(nextPage);
    const safePage = Number.isFinite(pageToFetch) && pageToFetch >= 1 ? pageToFetch : 1;
    const useFuzzy = opts.fuzzy !== undefined ? opts.fuzzy : fuzzyEnabled;

    searchAbortRef.current?.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;
    const seq = ++searchSeqRef.current;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setHasSearch(true);

    try {
      const data = await searchMovies({
        q,
        genre,
        yearFrom,
        yearTo,
        page: safePage,
        pageSize: PAGE_SIZE,
        fuzzy: useFuzzy,
        signal: ac.signal,
      });
      if (seq !== searchSeqRef.current) return;

      const list = Array.isArray(data.results) ? data.results : [];
      setResults(list);
      setTotal(Number(data.total) || 0);
      setPage(Number(data.page) || safePage);
      setTotalPages(Number(data.total_pages) || 0);
    } catch (err) {
      if (err?.name === "AbortError") return;
      if (seq !== searchSeqRef.current) return;
      setErrorMessage("Cannot fetch search results. Is backend running?");
    } finally {
      if (seq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const runSearch = (overrideQuery) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    if (overrideQuery !== undefined) setQuery(overrideQuery);
    setPage(1);
    fetchResults(1, q, { fuzzy: fuzzyEnabled });
  };

  const goToPage = (nextPage) => {
    const n = Number(nextPage);
    if (!Number.isFinite(n)) return;
    const maxPages =
      totalPages > 0 ? totalPages : total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;
    if (n < 1 || n > maxPages) return;
    fetchResults(n, undefined, { fuzzy: fuzzyEnabled });
  };

  const seedData = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await seedMovies();
      setSuccessMessage(`Seed completed. Indexed documents: ${data.indexed_documents}`);
    } catch {
      setErrorMessage("Cannot seed index. Check backend and Elasticsearch.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportCsv = async (file) => {
    setImporting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await importTmdbCsv(file);
      setSuccessMessage(
        `Import done. Indexed ${data.indexed_documents} docs (rows read: ${data.rows_read}, skipped: ${data.skipped_rows}).`
      );
    } catch (err) {
      setErrorMessage(err.message || "CSV import failed.");
    } finally {
      setImporting(false);
    }
  };

  const resetFilters = () => {
    setGenre("");
    setYearFrom("");
    setYearTo("");
  };

  const handleFuzzyToggle = (checked) => {
    setFuzzyEnabled(checked);
    if (hasSearch) fetchResults(1, undefined, { fuzzy: checked });
  };

  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        const data = await checkBackendHealth();
        if (alive) setEsOk(Boolean(data.elasticsearch_reachable));
      } catch {
        if (alive) setEsOk(false);
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const totalNum = Number(total) || 0;
  const totalPagesNum = Number(totalPages) || 0;
  const effectiveTotalPages =
    totalPagesNum > 0 ? totalPagesNum : totalNum > 0 ? Math.max(1, Math.ceil(totalNum / PAGE_SIZE)) : 0;

  return (
    <>
      <SettingsPanel
        open={settingsOpen}
        onToggle={() => setSettingsOpen((v) => !v)}
        esOk={esOk}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onReset={resetFilters}
        onSeed={seedData}
        onImportCsv={handleImportCsv}
        importing={importing}
        loading={loading}
      />
      <Topbar query={query} onQueryChange={setQuery} onSearch={() => runSearch(undefined)} />

      <div id="app">
        <Sidebar
          genre={genre}
          yearFrom={yearFrom}
          yearTo={yearTo}
          fuzzyEnabled={fuzzyEnabled}
          onGenreChange={setGenre}
          onYearFromChange={setYearFrom}
          onYearToChange={setYearTo}
          onFuzzyChange={handleFuzzyToggle}
          onQuickQuery={(q) => runSearch(q)}
        />
        <main id="main">
          <ResultsBar
            total={total}
            query={query}
            view={view}
            onViewChange={setView}
            page={page}
            pageSize={PAGE_SIZE}
            totalPages={effectiveTotalPages}
            onPageChange={goToPage}
          />
          <States loading={loading} message={errorMessage} total={total} hasSearch={hasSearch} />
          {successMessage && <div className="inline-success">{successMessage}</div>}
          <MoviesView
            view={view}
            results={results}
            resultPage={page}
            pagination={
              hasSearch && effectiveTotalPages > 1
                ? {
                    page,
                    totalPages: effectiveTotalPages,
                    pageSize: PAGE_SIZE,
                    total: totalNum,
                    onPageChange: goToPage,
                  }
                : null
            }
          />
        </main>
      </div>
    </>
  );
}

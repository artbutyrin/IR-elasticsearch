const API_BASE = "http://localhost:8000";

export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE}/es-health`);
  if (!res.ok) {
    throw new Error("Backend health request failed");
  }
  return res.json();
}

export async function seedMovies() {
  const res = await fetch(`${API_BASE}/seed-movies`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Seed request failed");
  }
  return res.json();
}

export async function importTmdbCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/import-tmdb-csv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Import failed");
  }
  return res.json();
}

export async function searchMovies({ q, genre, yearFrom, yearTo, page = 1, pageSize = 24 }) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (genre) params.set("genre", genre);
  if (yearFrom) params.set("year_from", yearFrom);
  if (yearTo) params.set("year_to", yearTo);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Search request failed");
  }
  return res.json();
}

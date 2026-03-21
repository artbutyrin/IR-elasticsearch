# CineSearch · Elasticsearch demo

A small **full-stack** project for an **Information Retrieval** course: a movie search UI backed by **Elasticsearch 8**, **FastAPI**, and **React**.  

---

## English

### What it does

- **Search** across movie titles, original titles, overviews, keywords, and genres (with optional **fuzzy** matching for typos).
- **Filter** by TMDB-style genre and year range.
- **Query compare** page: side-by-side JSON and top hits for **`multi_match`** (fuzzy) vs **`match_phrase`** on `title`.
- **Paginate** results.
- **Import** the large `TMDB_movie_dataset_v11.csv` via the UI (Settings) or REST API — the server streams the file and bulk-indexes in chunks (low memory).
- **Seed** a tiny built-in JSON dataset for a quick smoke test, if not import dataset.
- **Kibana** included for exploring the cluster.

### Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Search       | Elasticsearch 8.13 (single-node)    |
| API          | FastAPI, `uvicorn`, `elasticsearch` Python client |
| UI           | React 18, Vite 5, React Router      |
| Dev UX       | CORS enabled for local Vite (`5173`) |
| Orchestration| Docker Compose                      |

### Architecture 

```
Browser (React)  →  FastAPI (:8000)  →  Elasticsearch (:9200)
                         ↑
                   Kibana (:5601)
```

### Requirements

- **Docker** & **Docker Compose** (recommended path), **or**
- **Python 3.11+** and **Node 20+** if you run backend/frontend locally.

### Quick start (Docker)

From this directory (`IR-elasticsearch`):

```bash
docker compose up --build
```

After **pulling new frontend changes**, force-rebuild the UI image:

```powershell
docker compose build --no-cache frontend; docker compose up
```

Wait until all services are healthy, then open:

| Service    | URL                     |
| ---------- | ----------------------- |
| Web UI     | http://localhost:3000   |
| API docs   | http://localhost:8000/docs |
| Health     | http://localhost:8000/health |
| ES health  | http://localhost:8000/es-health |
| Elasticsearch | http://localhost:9200 |
| Kibana     | http://localhost:5601   |

### Using the UI (demo script)

1. Open **http://localhost:3000**.
2. **Settings** (bottom-left):  
   - Check Elasticsearch connectivity.  
   - **Import TMDB CSV** — select your `csv`.  
   - Or use **Seed demo data** for 20 sample movies.
3. Search from the top bar; use **Quick queries** for safe demo phrases (fuzzy typo example: `interstllar`). Toggle **Fuzzy** off to show strict token matching.
4. Narrow with **genre** and **year** in the sidebar.
5. Open **Query compare** (top nav) for side-by-side `multi_match` vs `match_phrase` JSON and rankings.

### Local development 

Backend still expects Elasticsearch:

```bash
# Terminal 1 — only Elasticsearch (example)
docker compose up elasticsearch
```

```bash
# Terminal 2 — API
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Terminal 3 — Vite dev server
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the app calls the API at **http://localhost:8000**.

### REST API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/health` | API alive |
| `GET`  | `/es-health` | Ping Elasticsearch from API |
| `POST` | `/seed-movies` | Recreate `movies` index + 20 JSON docs |
| `POST` | `/import-tmdb-csv` | Multipart form field `file` = CSV |
| `GET`  | `/search` | Query params: `q`, `genre`, `year_from`, `year_to`, `page`, `page_size` (1–50), `fuzzy` (`true`/`false`); optional `exclude_adult` (API only) |
| `GET`  | `/search/compare` | Same filters as search + `top_n` (1–24): returns two ES bool queries + top hits for `multi_match` vs `match_phrase` |

Examples:

```http
GET /search?q=interstllar&page=1&page_size=24&fuzzy=true
GET /search?q=space&fuzzy=false
GET /search/compare?q=interstllar&top_n=8&fuzzy=true
GET /search?genre=Science+Fiction&year_from=2000&page=2
```

### Project layout

```
IR-elasticsearch/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── core          # config, ES client
│       ├── routers/       # health, movies
│       ├── schemas/       # Pydantic models
│       └── services/      # indexing, CSV import, search
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── constants.js
└── README.md
```

### Limits & notes

- Elasticsearch’s default **`index.max_result_window`** is **10 000**: you can paginate at most through the first 10k hits with `from` + `size`. Totals above that are still reported, but deep pages are not available without `search_after` / scroll (out of scope here).
- **Kibana** (see “How ES works” in the UI): one slide + live steps — Discover on `movies`, one document, then `GET movies/_mapping` for **text** vs **keyword**.
- **File upload** requires `python-multipart` (already listed in `requirements.txt`).

### License / course use

Built for educational use in an Information Retrieval course. TMDB data is subject to **TMDB’s terms** if you redistribute the dataset.

---

## Українська

### Що це за проєкт

Невеликий **фулстек**-застосунок для курсу **інформаційного пошуку**: веб-інтерфейс пошуку фільмів на **Elasticsearch 8** з **FastAPI** та **React**.  
Для **живої демонстрації** на лекції: індексація, релевантність, **fuzzy**-пошук, фільтри, підсвітка збігів, імпорт великого **TMDB CSV**.

### Можливості

- **Повнотекстовий пошук** по назві, оригінальній назві, опису, ключових словах і жанрах; **Fuzzy** увімкнено/вимкнено (AUTO vs 0).
- **Фільтри**: жанр (як у TMDB) і діапазон років.
- **Сторінка Query compare** — два JSON-запити поруч: `multi_match` vs `match_phrase` і різні топ-результати.
- **Пагінація** (за замовчуванням **24** картки на сторінку).
- **Імпорт CSV** `.csv` через **Налаштування** в UI або через API — файл обробляється **потоково**, індексація **пакетами** (економія пам’яті); поле **`adult`** індексується, якщо присутнє.
- **Seed** з невеликого JSON для швидкої перевірки.
- **Kibana** — сценарій у розділі **How ES works** у UI: Discover, один документ, `GET movies/_mapping` (text vs keyword).

### Технології

| Шар        | Технологія |
| ---------- | ---------- |
| Пошук      | Elasticsearch 8.13 (один вузол) |
| API        | FastAPI, uvicorn, офіційний Python-клієнт |
| Інтерфейс  | React 18, Vite 5, React Router |
| Запуск     | Docker Compose |

### Схема

```
Браузер (React)  →  FastAPI (:8000)  →  Elasticsearch (:9200)
                          ↑
                   Kibana (:5601)
```

### Запуск через Docker

У каталозі `IR-elasticsearch`:

```bash
docker compose up --build
```

Після старту сервісів:

| Сервіс | Адреса |
| ------ | ------ |
| Веб-інтерфейс | http://localhost:3000 |
| Swagger / OpenAPI | http://localhost:8000/docs |
| Перевірка API | http://localhost:8000/health |
| Зв’язок з ES | http://localhost:8000/es-health |
| Elasticsearch | http://localhost:9200 |
| Kibana | http://localhost:5601 |

### Сценарій демонстрації (UI)

1. Відкрити **http://localhost:3000**.
2. **Settings**: перевірити статус ES; **імпортувати CSV** TMDB або натиснути **Seed demo data** (20 фільмів).
3. Ввести запит у верхній панелі; для прикладу fuzzy — `interstllar`; вимкнути **Fuzzy**, щоб показати суворі токени.
4. Обмежити **жанром** і **роками**.
5. **Query compare** у верхньому меню — порівняння запитів і JSON.
6. Перемикати сторінки кнопками **‹ / ›** (24 результати на сторінку).
7. **How ES works** — ланцюжок UI → API → індекс + кроки для Kibana.

### Локальна розробка

- **Elasticsearch** зручно тримати в Docker, API і Vite — локально.
- Фронт у режимі `npm run dev` звертається до **http://localhost:8000** (див. `frontend/src/api/moviesApi.js`).

```bash
cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

Відкрити **http://localhost:5173**.

### API (коротко)

- `POST /seed-movies` — перестворити індекс `movies` і завантажити демо-дані.
- `POST /import-tmdb-csv` — тіло `multipart/form-data`, поле **`file`** (CSV).
- `GET /search` — параметри: `q`, `genre`, `year_from`, `year_to`, `page`, `page_size` (до 50), `fuzzy`; опційно `exclude_adult` (лише API).
- `GET /search/compare` — `q`, `top_n`, ті самі фільтри; відповідь з двома ES-запитами та топ-хітами.

Приклад:

```http
GET /search?q=Harry+Potter&page=1&page_size=24&fuzzy=true
GET /search/compare?q=interstllar&top_n=8
```

### Обмеження

- У Elasticsearch стандартне вікно **`max_result_window` = 10 000**: класична пагінація дозволяє переглянути лише перші **10 000** документів; загальна кількість збігів може бути більшою.

### Структура репозиторію

Див. розділ **Project layout** вище — та сама структура каталогів `backend/app/…` та `frontend/src/…`.

### Ліцензія та дані

Проєкт призначений для **навчання**. Дані TMDB використовуй відповідно до **умов TMDB**, якщо поширюєш датасет.

---

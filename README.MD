# React + Python + Flask Software Engineer Coding Assessment

✔️ Architecture is:

- Frontend: ReactJS | Vite | JavaScript | HTML | CSS | Fetch API | npm | Node.js
- Backend: Python | Flask | Flask-CORS | RESTful API | pip
- Testing: Pytest | Flask Test Client | vitest | React Testing Library
- API: RESTful endpoints
- Development: React on http://localhost:5173, Flask on localhost:5000

### Listing search API

`GET /api/listings` supports `minPrice`, `maxPrice`, `minBedrooms`, `city`,
`keyword`, `targetBudget`, `page`, and `pageSize`. City matching is
case-insensitive and partial; keywords are case-insensitive matches against the
listing description. Results are returned in relevance order with pagination
metadata:

```json
{
  "listings": [],
  "page": 1,
  "pageSize": 6,
  "total": 0,
  "totalPages": 0,
  "message": "No listings match the supplied filters."
}
```

Each result includes `relevanceScore`, `budgetFitScore`, and `recencyScore`
(0–100). Budget fit starts at 100 for an exact match and decreases linearly to
zero as the price differs by 100% of the target budget. Recency starts at 100
on the listing date and halves every 45 days. Relevance is 70% budget fit and
30% recency; ties favor more recent listings. Invalid numeric filters,
inconsistent price ranges, and page sizes outside 1–100 return a JSON error
with HTTP 400. A valid search with no matches returns an explicit empty result.

### Install for backend:

✔️ Create Virtual Environment:

```
python -m venv venv // Windows
sudo apt-get install python3-venv // Linux
```

✔️ Activate Virtual Environment:

```
venv\Scripts\activate // Windows
venv/bin/activate // Linux

```

✔️ Install the packages:

```
pip install Flask Flask-CORS pytest
or
✔️ Install the packages according to requirements:
$ pip install -r requirements.txt
```

### Install for frontend:

```
$ cd frontend
$ npm install
```

### Run the project:

✔️ Run Flask from the `backend` directory:

```
cd backend
venv\Scripts\activate
python app.py
```

✔️ Run the React UI in a second terminal:

```
cd frontend
npm run dev
```

### Run unit tests:

- Run frontend unit tests from `frontend` with `npm test`.
- Run backend unit tests from `backend` with `python -m pytest`.

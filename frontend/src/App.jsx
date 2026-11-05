import { useEffect, useState } from "react";
import "./App.css";

const INITIAL_FILTERS = {
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  city: "",
  keyword: "",
  targetBudget: "500000",
  pageSize: "6",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState({
    targetBudget: 500000,
    page: 1,
    pageSize: 6,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        params.set(key, value);
      }
    });

    async function fetchListings() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/listings?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load listings.");
        }
        setData(payload);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(
            fetchError.message || "Unable to connect to the listings service.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchListings();
    return () => controller.abort();
  }, [query]);

  function updateFilter(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setFormError("");
  }

  function submitSearch(event) {
    event.preventDefault();
    const minPrice =
      filters.minPrice === "" ? undefined : Number(filters.minPrice);
    const maxPrice =
      filters.maxPrice === "" ? undefined : Number(filters.maxPrice);
    const minBedrooms =
      filters.minBedrooms === "" ? undefined : Number(filters.minBedrooms);
    const targetBudget = Number(filters.targetBudget);
    const pageSize = Number(filters.pageSize);

    if (
      filters.minPrice !== "" &&
      (!Number.isFinite(minPrice) || minPrice < 0)
    ) {
      setFormError("Enter a valid minimum price of zero or more.");
      return;
    }
    if (
      filters.maxPrice !== "" &&
      (!Number.isFinite(maxPrice) || maxPrice < 0)
    ) {
      setFormError("Enter a valid maximum price of zero or more.");
      return;
    }
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      setFormError("Minimum price cannot be greater than maximum price.");
      return;
    }
    if (
      filters.minBedrooms !== "" &&
      (!Number.isInteger(minBedrooms) || minBedrooms < 0)
    ) {
      setFormError("Minimum bedrooms must be a whole number of zero or more.");
      return;
    }
    if (!Number.isFinite(targetBudget) || targetBudget <= 0) {
      setFormError("Target budget must be greater than zero.");
      return;
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      setFormError("Results per page must be a whole number from 1 to 100.");
      return;
    }

    setFormError("");
    setQuery({
      city: filters.city.trim(),
      keyword: filters.keyword.trim(),
      minPrice,
      maxPrice,
      minBedrooms,
      targetBudget,
      page: 1,
      pageSize,
    });
  }

  function changePage(page) {
    setQuery((current) => ({ ...current, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetSearch() {
    setFilters(INITIAL_FILTERS);
    setFormError("");
    setQuery({ targetBudget: 500000, page: 1, pageSize: 6 });
  }

  const listings = data?.listings || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="app-shell">
      <header className="topbar" id="top">
        <a className="brand" href="/" aria-label="Key & Co home">
          <span className="brand-mark" aria-hidden="true">
            ⌂
          </span>
          <span>
            key<span className="brand-amp">&</span>co
          </span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="nav-active" href="#search">
            Find a home
          </a>
          <a href="#results">Explore listings</a>
        </nav>
        {/* <div className="topbar-note"><span className="online-dot" /> Local listings</div> */}
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">
              <span /> YOUR NEXT CHAPTER STARTS HERE
            </p>
            <h1>
              Find a place
              <br />
              to <em>feel at home.</em>
            </h1>
            <p className="hero-copy">
              Thoughtful home search, made personal. Set your priorities and
              we’ll bring the best matches to the top.
            </p>
            <a className="hero-link" href="#search">
              Start exploring <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun" />
            <div className="hill hill-back" />
            <div className="hill hill-front" />
            <div className="hero-house">
              <div className="house-roof" />
              <div className="house-body">
                <i className="house-window window-one" />
                <i className="house-window window-two" />
                <i className="house-door" />
              </div>
            </div>
            <div className="hero-caption">
              A little more you, in every search.
            </div>
          </div>
          <div className="hero-counter">
            <strong>01</strong>
            <span> / 03</span>
          </div>
        </section>

        <section className="search-section" id="search">
          <div className="section-heading">
            <div>
              <p className="eyebrow dark-eyebrow">A BETTER WAY TO FIND HOME</p>
              <h2>Make your search yours.</h2>
            </div>
            <p>Tell us what matters. We'll take it from here.</p>
          </div>

          <form className="search-panel" onSubmit={submitSearch}>
            <div className="search-panel-top">
              <div className="search-intro">
                <span className="search-icon" aria-hidden="true">
                  ⌕
                </span>
                <div>
                  <strong>Let's find your place</strong>
                  <span>Refine your search with a few details</span>
                </div>
              </div>
              <button
                className="reset-button"
                type="button"
                onClick={resetSearch}
              >
                Reset filters
              </button>
            </div>
            <div className="filter-grid">
              <label className="filter-field">
                <span>City</span>
                <input
                  name="city"
                  value={filters.city}
                  onChange={updateFilter}
                  placeholder="Any city"
                />
              </label>
              <label className="filter-field filter-keyword">
                <span>What are you looking for?</span>
                <input
                  name="keyword"
                  value={filters.keyword}
                  onChange={updateFilter}
                  placeholder="Try “garden” or “transit”"
                />
              </label>
              <label className="filter-field">
                <span>Minimum price</span>
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    name="minPrice"
                    type="number"
                    min="0"
                    value={filters.minPrice}
                    onChange={updateFilter}
                    placeholder="No minimum"
                  />
                </div>
              </label>
              <label className="filter-field">
                <span>Maximum price</span>
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    name="maxPrice"
                    type="number"
                    min="0"
                    value={filters.maxPrice}
                    onChange={updateFilter}
                    placeholder="No maximum"
                  />
                </div>
              </label>
              <label className="filter-field">
                <span>Bedrooms, at least</span>
                <select
                  name="minBedrooms"
                  value={filters.minBedrooms}
                  onChange={updateFilter}
                >
                  <option value="">Any</option>
                  <option value="1">1+ bedroom</option>
                  <option value="2">2+ bedrooms</option>
                  <option value="3">3+ bedrooms</option>
                  <option value="4">4+ bedrooms</option>
                  <option value="5">5+ bedrooms</option>
                </select>
              </label>
              <label className="filter-field">
                <span>Target budget</span>
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    name="targetBudget"
                    type="number"
                    min="1"
                    value={filters.targetBudget}
                    onChange={updateFilter}
                    required
                  />
                </div>
              </label>
              <label className="filter-field">
                <span>Homes per page</span>
                <select
                  name="pageSize"
                  value={filters.pageSize}
                  onChange={updateFilter}
                >
                  <option value="3">3 homes</option>
                  <option value="6">6 homes</option>
                  <option value="9">9 homes</option>
                  <option value="12">12 homes</option>
                </select>
              </label>
              <button className="search-button" type="submit">
                <span aria-hidden="true">⌕</span> Search homes
              </button>
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="ranking-note">
              <span className="ranking-sparkle" aria-hidden="true">
                ✳
              </span>
              <span>
                <strong>Smarter matches</strong> are ranked by how close they
                are to your budget and how recently they were listed.
              </span>
            </div>
          </form>
        </section>

        <section className="results-section" id="results" aria-live="polite">
          <div className="results-heading">
            <div>
              <p className="eyebrow dark-eyebrow">CURATED FOR YOU</p>
              <h2>
                Your matches
                <span className="result-count">{data ? data.total : "—"}</span>
              </h2>
            </div>
            {data && data.total > 0 && (
              <p className="results-context">
                Sorted by relevance <span aria-hidden="true">↗</span>
              </p>
            )}
          </div>

          {loading && (
            <div className="state-card" role="status">
              <span className="loader" />
              <strong>Finding your best matches…</strong>
              <span>Good things take a moment.</span>
            </div>
          )}

          {!loading && error && (
            <div className="state-card error-state" role="alert">
              <span className="state-symbol">!</span>
              <strong>We couldn’t load the listings.</strong>
              <span>
                {error}. Check that the Flask API is running, then try again.
              </span>
              <button
                className="retry-button"
                type="button"
                onClick={() => setQuery((current) => ({ ...current }))}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && listings.length === 0 && (
            <div className="state-card empty-state">
              <span className="state-symbol">⌕</span>
              <strong>No homes found this time.</strong>
              <span>
                {data?.message ||
                  "Try a different city or relax one of your filters."}
              </span>
              <button
                className="retry-button"
                type="button"
                onClick={resetSearch}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && listings.length > 0 && (
            <>
              <div className="listing-grid">
                {listings.map((listing, index) => (
                  <article className="listing-card" key={listing.id}>
                    <div
                      className={`listing-art listing-art-${index % 4}`}
                      aria-hidden="true"
                    >
                      <span className="listing-status">{listing.status}</span>
                      <div className="mini-house">
                        <div className="mini-roof" />
                        <div className="mini-body">
                          <i />
                          <i />
                          <b />
                        </div>
                      </div>
                      <span className="art-location">
                        {listing.city}, {listing.state}
                      </span>
                    </div>
                    <div className="listing-info">
                      <div className="listing-title-row">
                        <div>
                          <h3>{listing.address}</h3>
                          <p className="listing-location">
                            {listing.city}, {listing.state} {listing.zip}
                          </p>
                        </div>
                        <span
                          className="match-score"
                          title="Relevance score out of 100"
                        >
                          <strong>{listing.relevanceScore}</strong>
                          <small>match</small>
                        </span>
                      </div>
                      <p className="listing-price">
                        {money.format(listing.price)}
                      </p>
                      <div className="listing-facts">
                        <span>
                          <strong>{listing.bedrooms}</strong> beds
                        </span>
                        <i />
                        <span>
                          <strong>{listing.bathrooms}</strong> baths
                        </span>
                        <i />
                        <span>
                          <strong>{listing.sqft.toLocaleString()}</strong> sqft
                        </span>
                      </div>
                      <div className="listing-footer">
                        <span>Listed {listing.listedDate}</span>
                        <span
                          className="score-hint"
                          title={`Budget fit ${listing.budgetFitScore}/100 · Recency ${listing.recencyScore}/100`}
                        >
                          Why this match <b>ⓘ</b>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="pagination">
                <span>
                  Page <strong>{data.page}</strong> of{" "}
                  <strong>{Math.max(data.totalPages, 1)}</strong>
                </span>
                <div className="page-controls">
                  <button
                    type="button"
                    onClick={() => changePage(data.page - 1)}
                    disabled={data.page <= 1 || loading}
                    aria-label="Previous page"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => changePage(data.page + 1)}
                    disabled={data.page >= totalPages || loading}
                    aria-label="Next page"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            ⌂
          </span>
          <span>
            key<span className="brand-amp">&</span>co
          </span>
        </a>
        <span>A little closer to home.</span>
        <span>Listings are for demonstration purposes.</span>
      </footer>
    </div>
  );
}

export default App;

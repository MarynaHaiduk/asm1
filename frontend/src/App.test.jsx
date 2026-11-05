import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

const listings = [
  {
    id: "A1",
    address: "123 Main St",
    city: "Springfield",
    state: "VA",
    zip: "22150",
    price: 450000,
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 980,
    status: "active",
    listedDate: "2026-09-04",
    relevanceScore: 98.2,
    budgetFitScore: 100,
    recencyScore: 94,
  },
];

function apiResponse(payload, ok = true) {
  return {
    ok,
    json: async () => payload,
  };
}

function paginatedResponse(overrides = {}) {
  return {
    listings,
    page: 1,
    pageSize: 6,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

describe("Listings search UI", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(apiResponse(paginatedResponse())),
    );
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads and displays listing details and relevance score", async () => {
    render(<App />);
    expect(await screen.findByText("123 Main St")).toBeTruthy();
    expect(screen.getByText("$450,000")).toBeTruthy();
    expect(screen.getByText("98.2")).toBeTruthy();
    expect(
      screen.getByText("2", { selector: ".listing-facts strong" }),
    ).toBeTruthy();
  });

  it("submits the search filters to the listings API", async () => {
    render(<App />);
    await screen.findByText("123 Main St");
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Fairfax" },
    });
    fireEvent.change(screen.getByPlaceholderText("Try “garden” or “transit”"), {
      target: { value: "yard" },
    });
    fireEvent.change(screen.getByPlaceholderText("No minimum"), {
      target: { value: "400000" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Bedrooms, at least" }),
      {
        target: { value: "3" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /search homes/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const requestUrl = fetch.mock.calls[1][0];
    const params = new URL(requestUrl, "http://localhost").searchParams;
    expect(params.get("city")).toBe("Fairfax");
    expect(params.get("keyword")).toBe("yard");
    expect(params.get("minPrice")).toBe("400000");
    expect(params.get("minBedrooms")).toBe("3");
    expect(params.get("targetBudget")).toBe("500000");
    expect(params.get("page")).toBe("1");
  });

  it("shows validation feedback and does not request an invalid price range", async () => {
    render(<App />);
    await screen.findByText("123 Main St");
    fireEvent.change(screen.getByPlaceholderText("No minimum"), {
      target: { value: "500000" },
    });
    fireEvent.change(screen.getByPlaceholderText("No maximum"), {
      target: { value: "400000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search homes/i }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Minimum price cannot be greater than maximum price.",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("moves to the next page and requests the corresponding results", async () => {
    fetch
      .mockResolvedValueOnce(
        apiResponse(
          paginatedResponse({
            total: 8,
            totalPages: 2,
          }),
        ),
      )
      .mockResolvedValueOnce(
        apiResponse(
          paginatedResponse({
            page: 2,
            pageSize: 6,
            total: 8,
            totalPages: 2,
          }),
        ),
      );
    render(<App />);
    await screen.findByText("123 Main St");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const requestUrl = fetch.mock.calls[1][0];
    expect(
      new URL(requestUrl, "http://localhost").searchParams.get("page"),
    ).toBe("2");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Previous page" }).disabled,
      ).toBe(false);
    });
  });

  it("shows the no-results message returned by the API", async () => {
    fetch.mockResolvedValue(
      apiResponse({
        listings: [],
        page: 1,
        pageSize: 6,
        total: 0,
        totalPages: 0,
        message: "No listings match the supplied filters.",
      }),
    );
    render(<App />);
    expect(await screen.findByText("No homes found this time.")).toBeTruthy();
    expect(
      screen.getByText("No listings match the supplied filters."),
    ).toBeTruthy();
  });

  it("shows an API error state", async () => {
    fetch.mockResolvedValue(
      apiResponse({ error: "Search service unavailable" }, false),
    );
    render(<App />);
    expect(
      await screen.findByText("We couldn't load the listings."),
    ).toBeTruthy();
    expect(screen.getByText(/Search service unavailable/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

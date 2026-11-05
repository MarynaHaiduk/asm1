import app as listings_api


client = listings_api.app.test_client()


def test_listings_endpoint_returns_paginated_ranked_results():
    response = client.get("/api/listings?pageSize=3&targetBudget=450000")
    data = response.get_json()
    assert response.status_code == 200
    assert len(data["listings"]) == 3
    assert data["total"] == len(listings_api.listings)
    assert data["totalPages"] == 4
    assert data["page"] == 1
    assert all("relevanceScore" in listing for listing in data["listings"])
    assert data["listings"][0]["id"] == "A1"


def test_listings_endpoint_filters_by_price_bedrooms_city_and_keyword():
    response = client.get(
        "/api/listings?minPrice=400000&maxPrice=500000"
        "&minBedrooms=2&city=sPrInGfIeLd&keyword=pet"
    )
    assert response.status_code == 200
    assert {listing["id"] for listing in response.get_json()["listings"]} == {"A1", "B7"}


def test_listings_endpoint_returns_explicit_empty_result_for_no_city_matches():
    response = client.get("/api/listings?city=Atlantis")
    data = response.get_json()
    assert response.status_code == 200
    assert data["listings"] == []
    assert data["total"] == 0
    assert data["message"] == "No listings match the supplied filters."


def test_listings_endpoint_rejects_invalid_ranges_and_page_sizes():
    for query in (
        "?minPrice=500000&maxPrice=450000",
        "?pageSize=0",
        "?pageSize=-1",
        "?pageSize=101",
        "?minBedrooms=2.5",
        "?targetBudget=NaN",
    ):
        response = client.get("/api/listings" + query)
        assert response.status_code == 400
        assert "error" in response.get_json()


def test_listings_endpoint_paginates_to_requested_page():
    first_page = client.get("/api/listings?page=1&pageSize=4").get_json()
    second_page = client.get("/api/listings?page=2&pageSize=4").get_json()
    assert len(second_page["listings"]) == 4
    assert not {
        listing["id"] for listing in first_page["listings"]
    }.intersection(listing["id"] for listing in second_page["listings"])


def test_listing_endpoint_returns_listing_or_404():
    assert client.get("/api/listings/A1").get_json()["address"] == "123 Main St, Apt 4B"
    assert client.get("/api/listings/missing").status_code == 404

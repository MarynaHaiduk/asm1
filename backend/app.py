import os
import json
import math

from datetime import date
from flask import Flask, jsonify, request
from flask_cors import CORS

HOST = os.getenv("FLASK_HOST", "0.0.0.0")
PORT = int(os.getenv("FLASK_PORT", "5000"))
DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
DATA_FILE = os.path.join(os.path.dirname(__file__), "sample_listings.json")
MAX_PAGE_SIZE = 100


def load_listings():
    with open(DATA_FILE, encoding="utf-8") as data_file:
        data = json.load(data_file)
    if not isinstance(data, list) or any(
        not isinstance(listing, dict) or not listing.get("id")
        for listing in data
    ):
        raise ValueError("sample_listings.json must contain a list of listings with IDs")
    return data

def parse_number(name, default=None):
    value = request.args.get(name)
    if value is None:
        return default
    try:
        number = float(value)
    except ValueError:
        raise ValueError("{} must be a valid number".format(name))
    if not math.isfinite(number):
        raise ValueError("{} must be a finite number".format(name))
    return number

def parse_integer(name, default):
    value = request.args.get(name)
    if value is None:
        return default
    try:
        number = int(value)
    except ValueError:
        raise ValueError("{} must be a whole number".format(name))
    return number

def rank_listing(listing, target_budget, today):
    budget_difference = abs(listing["price"] - target_budget) / target_budget
    budget_score = max(0, 100 * (1 - budget_difference))
    days_since_listed = max(0, (today - date.fromisoformat(listing["listedDate"])).days)
    recency_score = 100 * (0.5 ** (days_since_listed / 45))
    relevance_score = 0.7 * budget_score + 0.3 * recency_score
    return {
        **listing,
        "relevanceScore": round(relevance_score, 1),
        "budgetFitScore": round(budget_score, 1),
        "recencyScore": round(recency_score, 1),
    }

app = Flask(__name__)
CORS(app)
listings = load_listings()

@app.route("/")
def home():
    return "Flask API is running!"


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "OK",
        "environment": os.getenv("FLASK_ENV", "development")
    })


@app.route("/api/listings", methods=["GET"])
def get_listings():
    allowed_filters = {
        "minPrice", "maxPrice", "minBedrooms", "city", "keyword",
        "targetBudget", "page", "pageSize",
    }
    unknown_filters = set(request.args) - allowed_filters
    if unknown_filters:
        return jsonify({
            "error": "Unsupported query parameter",
            "parameters": sorted(unknown_filters),
        }), 400
    try:
        min_price = parse_number("minPrice")
        max_price = parse_number("maxPrice")
        target_budget = parse_number("targetBudget", 500000)
        min_bedrooms = parse_integer("minBedrooms", None)
        page = parse_integer("page", 1)
        page_size = parse_integer("pageSize", 6)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if min_price is not None and min_price < 0:
        return jsonify({"error": "minPrice cannot be negative"}), 400
    if max_price is not None and max_price < 0:
        return jsonify({"error": "maxPrice cannot be negative"}), 400
    if min_price is not None and max_price is not None and min_price > max_price:
        return jsonify({"error": "minPrice cannot exceed maxPrice"}), 400
    if min_bedrooms is not None and min_bedrooms < 0:
        return jsonify({"error": "minBedrooms cannot be negative"}), 400
    if target_budget <= 0:
        return jsonify({"error": "targetBudget must be greater than zero"}), 400
    if page < 1:
        return jsonify({"error": "page must be at least 1"}), 400
    if page_size < 1 or page_size > MAX_PAGE_SIZE:
        return jsonify({
            "error": "pageSize must be between 1 and {}".format(MAX_PAGE_SIZE)
        }), 400
    city = request.args.get("city", "").strip().casefold()
    keyword = request.args.get("keyword", "").strip().casefold()
    filtered = []
    for listing in listings:
        if min_price is not None and listing["price"] < min_price:
            continue
        if max_price is not None and listing["price"] > max_price:
            continue
        if min_bedrooms is not None and listing["bedrooms"] < min_bedrooms:
            continue
        if city and city not in listing["city"].casefold():
            continue
        if keyword and keyword not in listing["description"].casefold():
            continue
        filtered.append(listing)
    today = date.today()
    ranked = [
        rank_listing(listing, target_budget, today)
        for listing in filtered
    ]
    ranked.sort(
        key=lambda listing: (
            -listing["relevanceScore"],
            -listing["recencyScore"],
            listing["id"],
        )
    )
    total = len(ranked)
    total_pages = math.ceil(total / page_size)
    start = (page - 1) * page_size
    page_results = ranked[start:start + page_size]
    response = {
        "listings": page_results,
        "page": page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
    }
    if total == 0:
        response["message"] = "No listings match the supplied filters."
    return jsonify(response)


@app.route("/api/listings/<listing_id>", methods=["GET"])
def get_listing(listing_id):
    listing = next((item for item in listings if item["id"] == listing_id), None)
    if listing is None:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify(listing)


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)

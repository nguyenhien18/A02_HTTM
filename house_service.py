from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "house_price_pipeline.joblib"
DATA_PATH = BASE_DIR / "data" / "house" / "house.csv"

ARTIFACT = joblib.load(MODEL_PATH)
MODEL = ARTIFACT["pipeline"]
MODEL_NAME = ARTIFACT.get("model_name", "Random Forest")
RAW_FEATURES = ARTIFACT["raw_feature_names"]
NUMERICAL_FEATURES = ARTIFACT["numerical_features"]
CATEGORICAL_FEATURES = ARTIFACT["categorical_features"]
METRICS = ARTIFACT.get("test_metrics", {})

DATA = pd.read_csv(DATA_PATH, usecols=RAW_FEATURES)
DATA["city_name"] = DATA["city_name"].astype("string")
CITIES = sorted(DATA["city_name"].dropna().unique().tolist())

OPTIONS = {
    "offer_types": sorted(DATA["offer_type"].dropna().unique().tolist()),
    "building_types": sorted(DATA["offer_type_of_building"].dropna().unique().tolist()),
    "markets": sorted(DATA["market"].dropna().unique().tolist()),
    "months": sorted(DATA["month"].dropna().unique().tolist()),
}

CITY_PROFILES = DATA.groupby("city_name", dropna=True).agg(
    population=("population", "median"),
    longitude=("longitude", "median"),
    latitude=("latitude", "median"),
    reference_count=("city_name", "size"),
)


def first_mode(series, fallback):
    modes = series.dropna().mode()
    return modes.iloc[0] if not modes.empty else fallback


DEFAULT_VOIVODESHIP = first_mode(DATA["voivodeship"], "")
CITY_REGIONS = DATA.groupby("city_name", dropna=True)["voivodeship"].agg(
    lambda values: first_mode(values, DEFAULT_VOIVODESHIP)
)
DEFAULTS = {
    "offer_type": "Private" if "Private" in OPTIONS["offer_types"] else OPTIONS["offer_types"][0],
    "offer_type_of_building": "Housing Block" if "Housing Block" in OPTIONS["building_types"] else OPTIONS["building_types"][0],
    "market": "aftermarket" if "aftermarket" in OPTIONS["markets"] else OPTIONS["markets"][0],
    "month": "March" if "March" in OPTIONS["months"] else OPTIONS["months"][0],
}

NUMERIC_RANGES = {
    "floor": (-1, 20),
    "area": (1, 399000),
    "rooms": (1, 20),
}

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    allowed_origins = {
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    }
    origin = request.headers.get("Origin")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


def as_number(payload, name):
    value = payload.get(name)
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if np.isfinite(number) else None


def validate_payload(payload):
    if not isinstance(payload, dict):
        return "Request body must be a JSON object."

    if payload.get("city_name") not in CITIES:
        return "Vui lòng chọn thành phố có trong dữ liệu huấn luyện."

    for name in NUMERIC_RANGES:
        value = as_number(payload, name)
        if value is None:
            return f"{name} phải là số hợp lệ."
        lower, upper = NUMERIC_RANGES[name]
        if not lower <= value <= upper:
            return f"{name} phải nằm trong khoảng {lower} đến {upper}."

    allowed_categories = {
        "offer_type": OPTIONS["offer_types"],
        "offer_type_of_building": OPTIONS["building_types"],
        "market": OPTIONS["markets"],
        "month": OPTIONS["months"],
    }
    for name, values in allowed_categories.items():
        if payload.get(name) not in values:
            return f"Giá trị {name} không hợp lệ."

    return None


def make_model_row(payload):
    city = payload["city_name"]
    profile = CITY_PROFILES.loc[city]
    row = {
        "offer_type": payload["offer_type"],
        "floor": as_number(payload, "floor"),
        "area": as_number(payload, "area"),
        "rooms": as_number(payload, "rooms"),
        "offer_type_of_building": payload["offer_type_of_building"],
        "market": payload["market"],
        "city_name": city,
        "voivodeship": CITY_REGIONS.get(city, DEFAULT_VOIVODESHIP),
        "month": payload["month"],
        "population": profile["population"],
        "longitude": profile["longitude"],
        "latitude": profile["latitude"],
    }
    return pd.DataFrame([{feature: row[feature] for feature in RAW_FEATURES}])


@app.get("/")
def home():
    return jsonify({"message": "House Price Prediction API is running", "model": MODEL_NAME})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "metrics": METRICS})


@app.get("/api/options")
def options():
    return jsonify({"cities": CITIES, **OPTIONS, "defaults": DEFAULTS})


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True)
    error = validate_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    model_row = make_model_row(payload)
    price = float(MODEL.predict(model_row)[0])
    area = float(payload["area"])
    profile = CITY_PROFILES.loc[payload["city_name"]]

    return jsonify({
        "price": round(price, 2),
        "price_per_sqm": round(price / area, 2) if area else None,
        "unit": "PLN",
        "model": MODEL_NAME,
        "city_name": payload["city_name"],
        "reference_count": int(profile["reference_count"]),
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=False)

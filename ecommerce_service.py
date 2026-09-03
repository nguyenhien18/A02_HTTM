from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "ecommerce_purchase_pipeline.joblib"

ARTIFACT = joblib.load(MODEL_PATH)
MODEL = ARTIFACT["pipeline"]
MODEL_NAME = ARTIFACT.get("model_name", "Logistic Regression")
FEATURES = ARTIFACT["raw_feature_names"]
NUMERICAL_FEATURES = ARTIFACT["numerical_features"]
BINARY_FEATURES = ARTIFACT["binary_features"]
CATEGORICAL_FEATURES = ARTIFACT["categorical_features"]
METRICS = ARTIFACT.get("test_metrics", {})

OPTIONS = {
    "Gender": ["Female", "Male"],
    "ProductCategory": ["Electronics", "Fashion", "Furniture", "Groceries", "Kitchen"],
    "PreferredDevice": ["Desktop", "Mobile", "Tablet"],
    "Region": ["East", "North", "South", "West"],
    "ReferralSource": ["Email", "Organic", "Paid Ads", "Referral", "Social"],
    "CustomerSegment": ["Premium", "Regular", "VIP"],
    "LoyaltyProgram": [0, 1],
}

DEFAULTS = {
    "Age": 35,
    "AnnualIncome": 65000,
    "NumberOfPurchases": 8,
    "TimeSpentOnWebsite": 24,
    "CustomerTenureYears": 3,
    "LastPurchaseDaysAgo": 18,
    "Gender": "Female",
    "ProductCategory": "Electronics",
    "PreferredDevice": "Mobile",
    "Region": "South",
    "ReferralSource": "Organic",
    "CustomerSegment": "Regular",
    "LoyaltyProgram": 1,
    "DiscountsAvailed": 2,
    "SessionCount": 5,
    "CustomerSatisfaction": 4,
}

NUMERIC_RANGES = {
    "Age": (15, 81),
    "AnnualIncome": (10000, 250000),
    "NumberOfPurchases": (0, 50),
    "TimeSpentOnWebsite": (0, 100),
    "CustomerTenureYears": (0, 20),
    "LastPurchaseDaysAgo": (0, 250),
    "DiscountsAvailed": (0, 10),
    "SessionCount": (1, 20),
    "CustomerSatisfaction": (1, 5),
}

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    local_origin = (
        origin in {"http://localhost", "http://127.0.0.1"}
        or origin.startswith("http://localhost:")
        or origin.startswith("http://127.0.0.1:")
        or origin.startswith("http://[::1]:")
    ) if origin else False
    if local_origin:
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

    missing = [feature for feature in FEATURES if feature not in payload]
    if missing:
        return f"Thiếu trường dữ liệu: {', '.join(missing)}."

    for name, (lower, upper) in NUMERIC_RANGES.items():
        value = as_number(payload, name)
        if value is None:
            return f"{name} phải là số hợp lệ."
        if not lower <= value <= upper:
            return f"{name} phải nằm trong khoảng {lower} đến {upper}."

    for name in BINARY_FEATURES:
        value = as_number(payload, name)
        if value not in (0, 1):
            return f"{name} phải có giá trị 0 hoặc 1."

    for name in CATEGORICAL_FEATURES:
        if payload[name] not in OPTIONS[name]:
            return f"Giá trị {name} không hợp lệ."

    return None


@app.get("/")
def home():
    return jsonify({"message": "E-commerce Purchase Prediction API is running", "model": MODEL_NAME})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "metrics": METRICS})


@app.get("/api/options")
def options():
    return jsonify({"options": OPTIONS, "defaults": DEFAULTS, "features": FEATURES, "metrics": METRICS})


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True)
    error = validate_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    input_frame = pd.DataFrame([{feature: payload[feature] for feature in FEATURES}])
    prediction = int(MODEL.predict(input_frame)[0])
    probability = None
    if hasattr(MODEL, "predict_proba"):
        probability = float(MODEL.predict_proba(input_frame)[0, 1])

    return jsonify({
        "prediction": prediction,
        "label": "Có khả năng mua" if prediction == 1 else "Chưa có khả năng mua",
        "purchase_probability": round(probability, 4) if probability is not None else None,
        "confidence": round(max(probability, 1 - probability), 4) if probability is not None else None,
        "model": MODEL_NAME,
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5003, debug=False)

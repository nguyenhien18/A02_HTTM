from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "diabetes_pipeline.joblib"

FEATURES = [
    "HighBP",
    "HighChol",
    "CholCheck",
    "BMI",
    "Smoker",
    "Stroke",
    "HeartDiseaseorAttack",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "GenHlth",
    "MentHlth",
    "PhysHlth",
    "DiffWalk",
    "Sex",
    "Age",
    "Education",
    "Income",
]

BINARY_FEATURES = {
    "HighBP",
    "HighChol",
    "CholCheck",
    "Smoker",
    "Stroke",
    "HeartDiseaseorAttack",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "DiffWalk",
    "Sex",
}

RANGES = {
    "BMI": (1, 100),
    "GenHlth": (1, 5),
    "MentHlth": (0, 30),
    "PhysHlth": (0, 30),
    "Age": (1, 13),
    "Education": (1, 6),
    "Income": (1, 8),
}

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    allowed_origins = {"http://localhost:5173", "http://127.0.0.1:5173"}
    origin = request.headers.get("Origin")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

try:
    artifact = joblib.load(MODEL_PATH)
    model = artifact["pipeline"]
    model_name = artifact.get("model_name", "Diabetes model")
except (FileNotFoundError, KeyError, EOFError) as exc:
    raise RuntimeError(f"Could not load model from {MODEL_PATH}") from exc


def validate_input(payload):
    if not isinstance(payload, dict):
        return "Request body must be a JSON object."

    missing = [feature for feature in FEATURES if feature not in payload]
    if missing:
        return f"Missing fields: {', '.join(missing)}"

    for feature in FEATURES:
        value = payload[feature]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return f"{feature} must be numeric."

        if feature in BINARY_FEATURES and value not in (0, 1):
            return f"{feature} must be 0 or 1."

        if feature in RANGES:
            lower, upper = RANGES[feature]
            if not lower <= value <= upper:
                return f"{feature} must be between {lower} and {upper}."

    return None


@app.get("/")
def home():
    return jsonify({"message": "Diabetes Prediction API is running", "model": model_name})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "model": model_name})


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True)
    error = validate_input(payload)
    if error:
        return jsonify({"error": error}), 400

    input_frame = pd.DataFrame([{feature: payload[feature] for feature in FEATURES}])
    prediction = int(model.predict(input_frame)[0])

    response = {
        "prediction": prediction,
        "label": "Có nguy cơ tiểu đường" if prediction == 1 else "Không phát hiện nguy cơ",
        "model": model_name,
    }

    if hasattr(model, "predict_proba"):
        score = float(model.predict_proba(input_frame)[0, 1])
        response["probability_estimate"] = round(score, 4)
        response["score_label"] = "Điểm mô hình, không thay thế chẩn đoán y tế"
    elif hasattr(model, "decision_function"):
        response["decision_score"] = round(float(model.decision_function(input_frame)[0]), 4)

    return jsonify(response)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)

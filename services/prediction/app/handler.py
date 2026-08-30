import json
import re
from datetime import datetime
from pathlib import Path


MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
EXPECTED_NUMERIC_FEATURES = 13

rf_model = None
scaler = None
word2idx = None
embedding_layer = None


def _cors_response(status_code, body=None):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": "" if body is None else json.dumps(body),
    }


def _load_models():
    global rf_model, scaler, word2idx, embedding_layer

    if rf_model is not None:
        return

    import joblib
    import numpy as np
    import torch
    import torch.nn as nn

    rf_model = joblib.load(MODEL_DIR / "random_forest_model.pkl")
    scaler = joblib.load(MODEL_DIR / "scaler.pkl")
    word2idx = joblib.load(MODEL_DIR / "word2idx.pkl")

    embedding_layer = nn.Embedding(len(word2idx), 32, padding_idx=0)
    embedding_layer.load_state_dict(
        torch.load(MODEL_DIR / "embedding_layer.pt", map_location="cpu")
    )
    embedding_layer.eval()

    globals()["np"] = np
    globals()["torch"] = torch


def _parse_payload(event):
    raw_body = event.get("body", "{}")
    payload = json.loads(raw_body) if isinstance(raw_body, str) else raw_body

    date_string = payload["date"]
    menu = payload["menu"]
    numeric_features = payload["numeric_features"]

    if len(numeric_features) != EXPECTED_NUMERIC_FEATURES:
        raise ValueError(
            f"numeric_features must contain {EXPECTED_NUMERIC_FEATURES} values"
        )

    return date_string, menu, numeric_features


def _semester_progress(date_string):
    date = datetime.strptime(date_string, "%Y-%m-%d")
    month = date.month
    year = date.year

    if month <= 2:
        semester_start, semester_end = datetime(year, 1, 1), datetime(year, 2, 28)
    elif month <= 6:
        semester_start, semester_end = datetime(year, 3, 1), datetime(year, 6, 30)
    elif month <= 8:
        semester_start, semester_end = datetime(year, 7, 1), datetime(year, 8, 31)
    else:
        semester_start, semester_end = datetime(year, 9, 1), datetime(year, 12, 31)

    return np.clip(
        (date - semester_start).days / (semester_end - semester_start).days,
        0,
        1,
    )


def _extract_nutrition(menu):
    energy_match = re.search(r"에너지\s*:\s*(\d+(?:\.\d+)?)", menu)
    protein_match = re.search(r"단백질\s*:\s*(\d+(?:\.\d+)?)", menu)

    if energy_match is None or protein_match is None:
        raise ValueError("menu must include energy and protein values")

    return float(energy_match.group(1)), float(protein_match.group(1))


def _predict(date_string, menu, numeric_features):
    progress = _semester_progress(date_string)
    energy, protein = _extract_nutrition(menu)
    energy_scaled, protein_scaled, progress_scaled = scaler.transform(
        [[energy, protein, progress]]
    )[0]

    token_indexes = [word2idx.get(token, 0) for token in menu.split()][:20]
    token_indexes += [0] * (20 - len(token_indexes))

    with torch.no_grad():
        menu_embedding = embedding_layer(torch.tensor(token_indexes))
        menu_average = menu_embedding.mean(dim=0).numpy()

    model_input = np.array(
        numeric_features
        + [energy_scaled, protein_scaled, progress_scaled]
        + menu_average.tolist()
    ).reshape(1, -1)

    return float(rf_model.predict(model_input)[0])


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return _cors_response(200)

    try:
        _load_models()
        date_string, menu, numeric_features = _parse_payload(event)
        prediction = _predict(date_string, menu, numeric_features)
        return _cors_response(200, {"prediction": prediction})
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"Invalid prediction request: {error}")
        return _cors_response(400, {"error": str(error)})
    except Exception as error:
        print(f"Prediction failed: {error}")
        return _cors_response(500, {"error": "Prediction failed"})

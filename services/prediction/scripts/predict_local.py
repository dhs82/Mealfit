import json
import sys
from pathlib import Path


SERVICE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_DIR))

from app.handler import lambda_handler  # noqa: E402


event = {
    "httpMethod": "POST",
    "body": json.dumps(
        {
            "date": "2023-10-16",
            "menu": (
                "흰밥, 근대된장국, 로스팜구이, 두부샐러드, "
                "에너지:326 Kcal, 단백질:12 g"
            ),
            "numeric_features": [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        },
        ensure_ascii=False,
    ),
}

print(lambda_handler(event, None)["body"])

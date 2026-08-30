import json
import sys
import unittest
from pathlib import Path


APP_DIR = Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(APP_DIR))

from handler import lambda_handler  # noqa: E402


class HandlerTest(unittest.TestCase):
    def test_options_request_returns_cors_response(self):
        response = lambda_handler({"httpMethod": "OPTIONS"}, None)

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(response["body"], "")
        self.assertEqual(
            response["headers"]["Access-Control-Allow-Methods"],
            "OPTIONS,POST",
        )

    def test_cors_response_is_json_compatible(self):
        response = lambda_handler({"httpMethod": "OPTIONS"}, None)

        json.dumps(response)


if __name__ == "__main__":
    unittest.main()

const getPredictionApiUrl = () => {
  const url = process.env.REACT_APP_PREDICTION_API_URL?.trim();

  if (!url) {
    throw new Error(
      "REACT_APP_PREDICTION_API_URL 환경변수가 설정되지 않았습니다."
    );
  }

  return url;
};

export async function predictMeal(input) {
  const response = await fetch(getPredictionApiUrl(), {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Prediction API error: ${response.status}`);
  }

  const data = await response.json();

  if (typeof data?.prediction !== "number") {
    throw new Error("Prediction API returned an invalid response.");
  }

  return data.prediction;
}

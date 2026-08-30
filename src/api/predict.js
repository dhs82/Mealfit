// src/api/predict.js
export async function predictMeal(input) {
  const res = await fetch('https://qv4bwtokvj.execute-api.ap-northeast-2.amazonaws.com/dev', {
    method: 'POST',
    mode: 'cors', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.prediction;
}
# lambda/handler.py

import json
import re

# 전역에는 정말 가벼운 심볼만 남깁니다
rf_model = None
scaler = None
word2idx = None
embedding_layer = None

def _cors_response(status_code, body=None):
    headers = {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    }
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": "" if body is None else json.dumps(body)
    }

def lambda_handler(event, context):
    print("▶ Lambda invoked, HTTP method:", event.get("httpMethod"))

    # OPTIONS 프리플라이트 즉시 응답
    if event.get("httpMethod") == "OPTIONS":
        print("▶ Preflight OPTIONS")
        return _cors_response(200)

    # 첫 호출일 때만 heavy 라이브러리·모델 로드
    global rf_model, scaler, word2idx, embedding_layer
    if rf_model is None:
        print("▶ Lazy-loading model artifacts and libraries")
        import joblib
        import pandas as _pd
        import numpy as _np
        import torch as _torch
        import torch.nn as _nn

        # 전역에서 편하게 쓰도록 바인딩
        globals()['pd']    = _pd
        globals()['np']    = _np
        globals()['torch'] = _torch
        globals()['nn']    = _nn

        # 모델·전처리 로드
        rf_model = joblib.load("random_forest_model.pkl")
        print("   • rf_model loaded")
        scaler   = joblib.load("scaler.pkl")
        print("   • scaler loaded")
        word2idx = joblib.load("word2idx.pkl")
        print("   • word2idx loaded")

        embedding_layer = nn.Embedding(len(word2idx), 32, padding_idx=0)
        embedding_layer.load_state_dict(
            torch.load("embedding_layer.pt", map_location="cpu")
        )
        embedding_layer.eval()
        print("   • embedding_layer loaded")
        print("▶ Model artifacts ready")

    try:
        # 요청 파싱
        raw = event.get("body", "{}")
        print("▶ Raw body:", raw)
        payload  = json.loads(raw)
        date_str = payload["date"]
        menu     = payload["menu"]
        numeric  = payload["numeric_features"]
        print(f"▶ Parsed payload: date={date_str}, numeric={numeric}")

        # 학기 진행률
        print("▶ Calculating progress")
        from datetime import datetime
        date = datetime.strptime(date_str, "%Y-%m-%d")
        m, y = date.month, date.year
        if   m <= 2: sem_start, sem_end = datetime(y,1,1), datetime(y,2,28)
        elif m <= 6: sem_start, sem_end = datetime(y,3,1), datetime(y,6,30)
        elif m <= 8: sem_start, sem_end = datetime(y,7,1), datetime(y,8,31)
        else:        sem_start, sem_end = datetime(y,9,1), datetime(y,12,31)
        progress = np.clip((date - sem_start).days / (sem_end - sem_start).days, 0, 1)
        print(f"   • progress={progress:.4f}")

        # 에너지·단백질
        print("▶ Extract & scale energy/protein")
        energy  = float(re.search(r'에너지:(\d+)', menu).group(1))
        protein = float(re.search(r'단백질:(\d+)', menu).group(1))
        en_scl, pr_scl, pg_scl = scaler.transform([[energy, protein, progress]])[0]
        print(f"   • en_scl={en_scl:.4f}, pr_scl={pr_scl:.4f}, pg_scl={pg_scl:.4f}")

        # 메뉴 임베딩
        print("▶ Embedding menu")
        tokens = menu.split()
        idxs   = [word2idx.get(w,0) for w in tokens][:20]
        idxs  += [0]*(20-len(idxs))
        print(f"   • token idxs={idxs[:5]}")
        with torch.no_grad():
            emb = embedding_layer(torch.tensor(idxs))
            menu_avg = emb.mean(dim=0).numpy()
        print(f"   • menu_avg first3={menu_avg[:3]}")

        # 예측
        print("▶ Predicting")
        final_input = np.array(
            numeric + [en_scl, pr_scl, pg_scl] + menu_avg.tolist()
        ).reshape(1,-1)
        print(f"   • final_input.shape={final_input.shape}")
        pred = float(rf_model.predict(final_input)[0])
        print(f"▶ Prediction={pred:.4f}")

        return _cors_response(200, {"prediction": pred})

    except Exception as e:
        print("‼ Error occurred:", e)
        return _cors_response(500, {"error": str(e)})

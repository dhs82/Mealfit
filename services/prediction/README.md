# Prediction service

AWS Lambda 컨테이너로 배포되는 급식 수요 예측 서비스입니다.

## 구성

- `app/handler.py`: API Gateway 요청 처리와 추론 로직
- `models/`: 운영 추론에 사용하는 모델 아티팩트, 버전 정보, 체크섬
- `requirements.txt`: 재현 가능한 Python 의존성
- `tests/`: 외부 서비스 없이 실행 가능한 단위 테스트
- `scripts/predict_local.py`: 로컬 예측 확인 스크립트

## 테스트

```bash
python3 -m unittest discover -s services/prediction/tests
cd services/prediction/models && sha256sum --check checksums.sha256
```

## 컨테이너 빌드

저장소 루트에서 실행합니다.

```bash
docker build -t mealfit-prediction services/prediction
```

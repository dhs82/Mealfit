# Machine learning workspace

모델 실험과 재현 검증을 위한 영역입니다. 운영 요청 처리는 `services/prediction`에서 담당합니다.

- `notebooks/`: 탐색과 모델 검증 노트북
- 운영 모델: `services/prediction/models/`

현재 보존된 노트북은 학습 전체 파이프라인이 아니라 저장된 모델의 추론 검증 코드입니다. 향후 데이터 준비, 학습, 평가, 아티팩트 내보내기를 별도 스크립트로 추가해야 완전한 재학습이 가능합니다.

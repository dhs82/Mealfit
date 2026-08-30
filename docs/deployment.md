# Deployment

## Web and Amplify backend

1. AWS 자격증명을 설정합니다.
2. 저장소 루트에서 `amplify pull`로 대상 환경을 연결합니다.
3. `amplify status`로 백엔드 변경을 확인합니다.
4. 스키마 변경이 있으면 `amplify codegen`을 실행합니다.
5. `npm run build`로 프론트엔드를 검증합니다.
6. 검토된 인프라 변경만 `amplify push`로 배포합니다.

`amplify/#current-cloud-backend`, `src/aws-exports.js`, 로컬 AWS 설정은 커밋하지 않습니다.

## Prediction service

저장소 루트에서 컨테이너를 빌드합니다.

```bash
docker build -t mealfit-prediction services/prediction
```

이미지를 ECR에 푸시하고 Lambda 함수의 컨테이너 이미지 URI를 새 digest로 갱신합니다. 프론트엔드 환경의 `REACT_APP_PREDICTION_API_URL`에는 해당 Lambda와 연결된 API Gateway POST 경로를 설정합니다.

## Release checklist

- `npm run check` 성공
- GraphQL 스키마와 생성 코드 일치
- 모델 파일 체크섬 및 모델 버전 확인
- 개발·스테이징 환경에서 예측 API 확인
- 운영 배포 후 AppSync와 Lambda 오류율 확인

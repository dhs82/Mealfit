# Architecture

## 목표

Mealfit은 하나의 저장소를 유지하되 독립적으로 변경·배포되는 영역의 경계를 분명히 합니다. 현재 규모에서는 마이크로서비스를 추가하기보다 프론트엔드, 인프라, AI 추론, 모델 실험을 모듈로 분리하는 편이 운영 비용이 낮습니다.

## 컨텍스트

```text
사용자
  │
  ▼
React web app
  ├── AppSync GraphQL ── DynamoDB
  └── API Gateway ── Prediction Lambda container ── Model artifacts
```

## 디렉터리 책임

### `src/app`

애플리케이션 부트스트랩, 라우팅, 전역 Provider만 둡니다. 비즈니스 로직이나 직접적인 GraphQL 호출은 두지 않습니다.

### `src/features`

화면과 로직을 기능 단위로 묶습니다.

- `auth`: 로그인 상태와 보호 라우트
- `dashboard`: 대시보드 화면과 전용 카드
- `meals`: 식단 등록, 파일 업로드, 직접 예측
- `people`: 학기별 학생 수
- `prediction`: 예측 API 클라이언트
- `reports`: 통계 리포트

### `src/shared`

둘 이상의 기능에서 사용하는 캘린더, 내비게이션, 날짜 유틸리티를 둡니다. 특정 기능의 비즈니스 규칙은 이곳에 추가하지 않습니다.

### `src/graphql`

Amplify codegen의 생성 결과입니다. 수동 편집보다 `amplify codegen`으로 갱신합니다.

### `amplify`

AppSync, DynamoDB 등 Amplify Gen 1 백엔드 정의입니다. CLI 호환성을 위해 저장소 루트에 유지합니다. `#current-cloud-backend`와 로컬 환경 파일은 버전 관리하지 않습니다.

### `services/prediction`

API Gateway 뒤에서 실행되는 AI 추론 Lambda의 독립 빌드 컨텍스트입니다. 운영 코드, 고정된 의존성, 모델 아티팩트, 테스트를 함께 관리합니다. 로컬에 설치된 Python 패키지와 빌드 ZIP은 커밋하지 않습니다.

### `ml`

운영 요청을 처리하지 않는 실험·검증 영역입니다. 노트북에서 검증된 모델만 명시적인 버전과 함께 prediction 서비스로 승격합니다.

## 설정 원칙

- 예측 API 주소는 `REACT_APP_PREDICTION_API_URL`로 주입합니다.
- AWS 클라이언트 설정은 `amplify pull`이 생성한 `src/aws-exports.js`를 사용합니다.
- 비밀값은 Git에 커밋하지 않습니다.
- GraphQL 스키마 변경 후 생성 코드를 함께 갱신합니다.

## 알려진 개선 과제

1. 데모용 로컬 인증을 Amazon Cognito로 교체
2. GraphQL 호출을 기능별 API 모듈로 추가 분리
3. 모델 바이너리를 S3 또는 모델 레지스트리로 이전하고 체크섬 기반 배포 도입
4. Prediction 컨테이너 통합 테스트와 배포 파이프라인 추가

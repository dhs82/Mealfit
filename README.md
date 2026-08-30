# Mealfit

대학 급식 메뉴와 학기별 인원 정보를 관리하고 AI 모델로 예상 식수 인원을 계산하는 웹 애플리케이션입니다.

## 시스템 구성

- React: 관리자 화면과 리포트
- AWS Amplify Gen 1: AppSync GraphQL API와 백엔드 인프라
- AWS Lambda 컨테이너: 급식 수요 예측
- Random Forest + 메뉴 임베딩: 식사 비율 예측 모델

자세한 책임과 데이터 흐름은 [`docs/architecture.md`](docs/architecture.md)를 참고하세요.

## 로컬 실행

요구 사항:

- Node.js 20 이상
- npm
- AWS 연결이 필요하면 Amplify CLI와 해당 AWS 환경 접근 권한

```bash
npm ci
cp .env.example .env.local
npm start
```

`.env.local`의 `REACT_APP_PREDICTION_API_URL`을 실제 API Gateway 주소로 바꿔야 예측 기능이 동작합니다. `src/aws-exports.js`가 없다면 `amplify pull`로 연결된 환경의 설정을 생성합니다.

## 검증

```bash
npm run check
```

## 주요 디렉터리

```text
src/                         React 애플리케이션
  app/                       라우팅과 최상위 Provider
  features/                  도메인별 화면·컴포넌트·API
  shared/                    여러 기능이 함께 쓰는 UI와 유틸
  graphql/                   Amplify가 생성한 GraphQL 코드
amplify/                     AWS 인프라 정의
services/prediction/         AI 추론 Lambda 서비스
ml/                          모델 실험과 노트북
docs/                        아키텍처와 배포 문서
```

프론트엔드 import는 `jsconfig.json`의 `src` 기준 절대 경로를 사용합니다.

## 보안 주의사항

현재 로그인은 프론트엔드 로컬 상태를 이용한 데모 구현입니다. 운영 배포 전 Cognito 같은 서버 검증형 인증으로 교체해야 합니다.

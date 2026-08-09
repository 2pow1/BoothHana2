# BoothHana2

행사 부스 운영자와 방문자를 위한 Lean CRUD MVP입니다.

## Approved plan

- [Booth Platform Lean CRUD Plan](docs/plans/2026-08-07-booth-platform-lean-crud-plan.md)

## Approved stack

- Frontend: React, Vite, Vercel Preview
- Backend: Java, Spring Boot, Gradle, Render
- Database: Supabase PostgreSQL
- Image storage: Cloudflare R2

구현은 승인된 계획의 포함 범위만 따릅니다.

## Local run

1. PostgreSQL에 [초기 스키마](database/001_initial_schema.sql)와 번호순 후속 마이그레이션을 적용합니다.
2. `frontend/.env.example`, `backend/.env.example`을 복사해 로컬 환경 변수를 채웁니다.
3. `frontend`에서 `pnpm install` 후 `pnpm dev`를 실행합니다.
4. `backend`에서 Java 21로 `gradlew.bat bootRun`을 실행합니다.

프런트는 기본적으로 `http://localhost:5173`, API는 `http://localhost:8080`을 사용합니다. 카카오 개발자 앱의 Redirect URI에는 백엔드의 `/login/oauth2/code/kakao` 주소가 필요합니다.

## Development mock data

카카오 로그인으로 `app_user`가 생성된 뒤 [개발용 mock seed](database/dev/001_seed_mock_data.sql)를 Supabase SQL Editor에서 한 번 실행할 수 있습니다. 최신 로그인 사용자를 부스 소유자와 예약자로 연결하며, `[MOCK]` 또는 `MOCK-` 표식이 붙은 개발 데이터만 추가합니다. 이 파일은 운영 마이그레이션이나 애플리케이션 시작 시 자동 실행되지 않습니다.

## Deployment

- Vercel: Root Directory를 `frontend`로 지정하고 `VITE_API_BASE_URL`을 백엔드 공개 주소로 설정합니다.
- Render: 루트의 `render.yaml`과 `backend/Dockerfile`을 사용하고 `backend/.env.example`에 나열된 비밀 환경 변수를 등록합니다.
- Supabase: `database`의 SQL 파일을 번호순으로 SQL Editor에서 실행합니다.
- Cloudflare R2: 버킷 CORS에서 프런트 도메인의 `PUT`을 허용하고 공개 이미지 URL을 `R2_PUBLIC_URL`에 지정합니다.

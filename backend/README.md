# BoothHana2 backend

BoothHana2의 카카오 로그인, 팬·크리에이터·관리자 API, Supabase PostgreSQL 저장과 Cloudflare R2 업로드 서명을 제공하는 Spring Boot 애플리케이션입니다. 전체 로컬 설정 순서는 [루트 README](../README.md)를 확인합니다.

## Requirements

- Java 21
- 개발용 Supabase 프로젝트와 PostgreSQL 연결 정보
- 개발용 Kakao Developers 앱
- 이미지 업로드를 확인할 경우 Cloudflare R2 버킷과 API 토큰

## Environment

`backend/.env.example`을 `backend/.env`로 복사하고 개발용 값을 입력합니다. Spring Boot는 `.env`를 직접 읽지 않으므로 로컬에서는 `run-dev.ps1`을 사용합니다.

```powershell
cd backend
.\run-dev.ps1
```

서버는 기본적으로 `http://localhost:8080`에서 실행됩니다. 카카오 Redirect URI는 `http://localhost:8080/login/oauth2/code/kakao`입니다.

## Tests

환경 변수를 불러온 뒤 전체 Gradle 테스트를 실행합니다.

```powershell
cd backend
.\run-dev.ps1 test
```

## API areas

- `/api/public/**`: 공개 행사·부스·상품 조회
- `/api/me`, `/api/me/reservations/**`: 로그인 사용자와 자신의 예약
- `/api/creator/**`: 부스, 참가 신청, 상품, 공지, 예약 수령, POS
- `/api/admin/**`: 지정 관리자 계정의 행사와 참가 신청 관리
- `/api/creator/uploads/presign`: Cloudflare R2 직접 업로드용 서명 URL 발급

정확한 엔드포인트와 요청 형식은 `src/main/java/com/boothhana/api`의 Controller와 DTO를 기준으로 합니다.

## Local troubleshooting

- `.env` 변경 후에는 백엔드를 재기동합니다.
- 관리자 권한 변경 후에는 카카오 로그아웃·재로그인으로 `/api/me`를 다시 확인합니다.
- 8080 포트가 이미 사용 중이면 기존 백엔드 프로세스를 먼저 종료합니다.
- 프런트 요청이 CORS로 차단되면 `ALLOWED_ORIGINS`에 실제 프런트 주소가 있는지 확인합니다.

Spring Boot와 Gradle 자체 사용법은 [Spring Boot 공식 문서](https://docs.spring.io/spring-boot/)와 [Gradle 공식 문서](https://docs.gradle.org/)를 참고합니다.

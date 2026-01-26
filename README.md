# Google Tasks 매트릭스 앱

Google Tasks와 연동되는 아이젠하워 매트릭스 기반 태스크 관리 웹 애플리케이션입니다. Next.js 14+와 TypeScript로 개발되었습니다.

## 주요 기능

- **Google Tasks 통합**: OAuth 2.0 로그인, 실시간 태스크 동기화
- **아이젠하워 매트릭스**: 긴급/중요 4분면 뷰
- **마인드맵 뷰**: React Flow 기반 계층형 시각화
- **태그 시스템**: 태그 생성, 수정, 삭제, 태스크에 할당
- **드래그 앤 드롭**: 분면 간 태스크 이동
- **Optimistic UI**: 빠른 사용자 경험

## 기술 스택

- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **인증**: NextAuth.js v5 (Google OAuth 2.0)
- **데이터베이스**: PostgreSQL + Prisma ORM
- **시각화**: React Flow (마인드맵)
- **드래그 앤 드롭**: dnd-kit
- **테스트**: Jest (단위/통합), Playwright (E2E)

## 시작하기

### 필수 조건

- Node.js 18+
- PostgreSQL 데이터베이스
- Google Cloud 프로젝트 (OAuth 클라이언트)

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
cp .env.example .env.local
```

`.env.local`:
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=openssl-rand-base64-32로-생성
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/google_tasks
```

### 2. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **Tasks API** 활성화
3. **OAuth 2.0 클라이언트 ID** 생성:
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`
4. 생성된 클라이언트 ID와 시크릿을 `.env.local`에 추가

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# Prisma Studio (선택사항)
npm run prisma:studio
```

### 4. 개발 서버 시작

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 앱을 확인하세요.

## 프로젝트 구조

```
google-tasks-app/
├── app/
│   ├── (auth)/login/page.tsx           # 로그인 페이지
│   ├── (dashboard)/dashboard/page.tsx  # 대시보드
│   └── api/
│       ├── auth/[...nextauth]/route.ts # NextAuth 설정
│       ├── tasks/route.ts              # 태스크 CRUD
│       └── tags/route.ts               # 태그 CRUD
├── lib/
│   ├── google-tasks/
│   │   ├── client.ts                   # Google Tasks API 클라이언트
│   │   └── types.ts                    # 타입 정의
│   ├── db/
│   │   ├── schema.ts                   # Prisma 스키마
│   │   └── client.ts                   # DB 클라이언트
│   └── validators/
│       ├── task.ts                     # 태스크 검증
│       └── tag.ts                      # 태그 검증
├── hooks/
│   ├── useAuth.ts                      # 인증 상태 관리
│   ├── useTasks.ts                     # 태스크 상태 관리
│   └── useTags.ts                      # 태그 상태 관리
├── components/
│   ├── EisenhowerMatrix.tsx            # 아이젠하워 매트릭스
│   ├── MindMap.tsx                     # 마인드맵
│   ├── TaskCard.tsx                    # 태스크 카드
│   ├── TaskForm.tsx                    # 태스크 폼
│   └── TagManager.tsx                  # 태그 관리
└── __tests__/
    ├── unit/                           # 단위 테스트
    └── e2e/                            # E2E 테스트
```

## 테스트

```bash
# 단위/통합 테스트
npm test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 사용 방법

### 1. 로그인
1. `/login` 페이지 접속
2. Google 계정으로 OAuth 로그인
3. Google Tasks API 접근 권한 허용

### 2. 태스크 생성
1. **새 태스크** 버튼 클릭
2. 제목, 메모, 마감일 입력
3. 긴급/중요 체크박스 선택
4. 태그 선택 (선택사항)

### 3. 아이젠하워 매트릭스
- **Q1 (긴급+중요)**: 즉시 처리
- **Q2 (비긴급+중요)**: 계획적으로 처리
- **Q3 (긴급+비중요)**: 위임 가능
- **Q4 (비긴급+비중요)**: 나중에 처리
- 드래그 앤 드롭으로 분면 이동

### 4. 마인드맵 뷰
- **마인드맵** 버튼 클릭
- 계층형 트리 구조로 태스크 확인
- 확대/축소, 패닝 가능

## API 엔드포인트

### 태스크
- `GET /api/tasks` - 태스크 목록 조회
- `POST /api/tasks` - 태스크 생성
- `GET /api/tasks/[id]` - 태스크 조회
- `PUT /api/tasks/[id]` - 태스크 수정
- `DELETE /api/tasks/[id]` - 태스크 삭제
- `PATCH /api/tasks/[id]` - 완료 상태 토글

### 태그
- `GET /api/tags` - 태그 목록 조회
- `POST /api/tags` - 태그 생성
- `GET /api/tags/[id]` - 태그 조회
- `PUT /api/tags/[id]` - 태그 수정
- `DELETE /api/tags/[id]` - 태그 삭제

## 보안

- 모든 API 라우트는 인증 필요
- Zod를 통한 입력 검증
- SQL 인젝션 방지 (Prisma)
- CSRF 보호 (NextAuth.js)
- 환경 변수로 시크릿 관리

## 배포

### Vercel 배포

1. 환경 변수 설정
2. Vercel에 연결
3. 자동 배포

### 배포 전 체크리스트
- [ ] `.env.local`이 Git에 포함되지 않았는지
- [ ] `DATABASE_URL`이 프로덕션 DB로 설정되었는지
- [ ] Google OAuth 리디렉션 URI에 배포 도메인이 포함되었는지
- [ ] `NEXTAUTH_URL`이 실제 도메인으로 설정되었는지
- [ ] `NEXTAUTH_SECRET`이 안전하게 생성되었는지

## 라이선스

MIT

## 기여

이 프로젝트에 기여하고 싶으시다면 Pull Request를 제출해주세요.

## 문제 신고

버그나 기능 요청은 [GitHub Issues](https://github.com/your-repo/issues)에 등록해주세요.

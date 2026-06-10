# html-archive

작업 계획서·개발 히스토리 HTML 문서를 카테고리로 탐색하는 **다크모드 Next.js 정적 사이트** (BRICS 개발 아카이브).

## 콘텐츠는 CI가 자동 주입한다 — `public/docs/` 수동 편집 금지

`public/docs/` 폴더는 외부 레포(`zenterprise-inc/claude-teams-brics`)의 GitHub Actions가
자동으로 채운다. **이 폴더 안의 파일을 직접 만들거나 수정하지 마라** (CI가 덮어쓴다 → 충돌).

```
public/docs/
  entries.json   ← 메타데이터 매니페스트 (앱이 읽는 단일 소스)
  plans/{feature,bugfix,refactor}/YYYYMMDD-*.html
  history/<서비스>/YYYYMMDD-*.html
```

- 각 `.html` 은 자체 완결형 다크테마 페이지다. 앱은 다시 렌더링하지 않고 새 탭으로 링크만 한다.
- 목록/카드 메타데이터는 전부 `entries.json` 에서 읽는다 (HTML 직접 파싱 안 함).
- 파일이 없거나 비어 있어도 앱은 빈 목록으로 정상 동작한다.
- 리포의 `public/docs/entries.json` 은 로컬 개발용 **샘플**이다. CI가 실제 콘텐츠로 덮어쓴다.

## 개발

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # 정적 빌드
```

## 구조

| 경로 | 역할 |
| --- | --- |
| `app/page.tsx` | 서버 컴포넌트 — 빌드 시 `entries.json` 을 파일시스템으로 읽어 props 전달 |
| `lib/entries.ts` | `Entry` 타입 + 안전한 reader (없으면 `[]`, 최신순 정렬) |
| `components/Archive.tsx` | 클라이언트 — 탭/카테고리 칩/검색/카드 그리드 |
| `app/globals.css` | BRICS 다크 팔레트(`:root` 변수) · Pretendard |

## 배포 (Vercel)

Framework 자동 감지(Next.js). 별도 빌드 설정 불필요.

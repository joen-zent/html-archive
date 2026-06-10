# html-archive 웹앱 구축 명령서 (Next.js · 다크모드)

> 이 문서를 `joen-zent/html-archive` 레포에서 새 Claude Code 세션에 그대로 붙여넣어 작업을 지시하세요.
> (이 레포가 곧 Vercel로 배포되는 "개발 아카이브 블로그"입니다.)

---

## 0. 한 줄 목표

작업 계획서·개발 히스토리 **HTML 문서들을 카테고리 메뉴로 탐색**하고, 카드를 클릭하면 해당 HTML 문서를 볼 수 있는 **다크모드 Next.js 정적 사이트**를 만든다. 콘텐츠 파일은 다른 레포에서 **CI가 자동으로 채워 넣으므로** 앱은 그걸 읽어 목록만 그려주면 된다.

---

## 1. 가장 중요한 전제 — 콘텐츠는 자동 주입된다 (직접 만들지 마라)

다른 레포(`zenterprise-inc/claude-teams-brics`)의 GitHub Actions가 이 레포의 **`public/docs/`** 폴더를 자동으로 채운다. 구조는 다음과 같다:

```
public/
  docs/
    entries.json                 ← 메타데이터 매니페스트 (앱이 읽는 단일 소스)
    plans/
      feature/  YYYYMMDD-*.html   ← 작업 문서 (자체 완결형 HTML, 자체 스타일 포함)
      bugfix/   YYYYMMDD-*.html
    history/
      <서비스>/ YYYYMMDD-*.html    ← 개발 히스토리
```

**규칙:**

- `public/docs/` 안의 파일은 **CI가 덮어쓴다. 절대 직접 수정/생성하지 마라.** (앱 빌드 시 비어 있을 수 있으니 빈 배열도 정상 처리할 것)
- 각 `.html` 문서는 **이미 완결된 다크테마 페이지**다. 앱이 다시 렌더링하지 말고 **그대로 보여주기만** 하면 된다 (새 탭 링크 또는 라우트에서 노출).
- 목록/카드에 필요한 메타데이터는 전부 `entries.json`에 있다. **HTML을 직접 파싱하지 마라.**

### `entries.json` 스키마

`Entry[]` 배열. 각 항목:

```ts
type Entry = {
  kind: "plan" | "history"; // 탭 구분
  href: string; // 예: "/docs/plans/bugfix/20260605-foo.html" (그대로 링크)
  title: string;
  summary: string;
  category: string; // plan: 'feature'|'bugfix'|'refactor'  / history: 서비스명
  categoryLabel: string; // 사람이 읽는 라벨 (예: '버그·개선', '환급')
  scope: string; // plan 한정: 'API'|'프론트'|'양쪽' (없으면 '')
  status: string; // plan: 'planning'|'in-progress'|'done' / history: 보통 ''
  dateIso: string; // "2026-06-05"
  dateLabel: string; // "2026.06.05"
};
```

실제 예시 1건:

```json
{
  "kind": "plan",
  "href": "/docs/plans/bugfix/20260605-message-preview-placeholder.html",
  "title": "환급 상세 > 메세지 전송 모달 > 미리보기 영역 UX 개선",
  "summary": "메세지 유형 미선택 상태에서 미리보기에 로딩(skeleton)이 뜨는 문제를 안내 문구로 교체한다. (P3)",
  "category": "bugfix",
  "categoryLabel": "버그·개선",
  "scope": "프론트",
  "status": "planning",
  "dateIso": "2026-06-05",
  "dateLabel": "2026.06.05"
}
```

---

## 2. 만들 것 — 화면 사양

### 2-1. 메인 페이지 (`/`)

- **상단 헤더(hero)**: 사이트 제목 "BRICS 개발 아카이브" + 한 줄 설명 + 통계 칩(작업 N건 / 완료 N건 / 히스토리 N건)
- **카테고리 메뉴(탭) 2개**:
  - `📋 작업` (kind === 'plan')
  - `📚 개발 히스토리` (kind === 'history')
- **서브 필터(칩)**: 선택된 탭에 존재하는 `category` 들을 동적으로 칩으로 노출 + "전체"
  - 작업 탭 → 신규 기능 / 버그·개선 / 리팩터링
  - 히스토리 탭 → 서비스명들(환급/분류/…)
- **검색창**: 제목·요약 부분일치 (클라이언트 필터)
- **카드 그리드**: 각 카드에
  - 배지: `categoryLabel`, 상태 배지(`status` 있을 때), `scope`(있을 때)
  - 제목, 요약(2줄 말줄임), 날짜(`dateLabel`)
  - 클릭 → `href`로 이동 (해당 HTML 문서 열기). **새 탭(`target="_blank"`) 권장** — 문서가 자체 완결형이라 앱 셸로 감쌀 필요 없음.
- 정렬: `dateIso` 내림차순(최신순). `entries.json`이 이미 최신순 정렬돼 있지만 앱에서도 보장할 것.
- 항목 0건이면 "표시할 항목이 없습니다" 빈 상태.

### 2-2. 상태 배지 매핑

```
planning     → "🟡 계획"   (warn 색)
in-progress  → "🔵 진행중"  (primary 색)
done         → "🟢 완료"   (good 색)
```

### 2-3. 카테고리 배지 색

- feature → primary(파랑) 계열
- bugfix → danger(빨강) 계열
- refactor / history → purple 계열

---

## 3. 디자인 — 다크모드 (필수 톤앤매너)

아래 CSS 변수 팔레트를 그대로 쓴다. (BRICS 표준 다크테마 — HTML 문서들과 톤 일치)

```css
--bg: #0b0d12;
--surface: #11141b;
--surface-soft: #161a23;
--border: #232836;
--border-strong: #2e3444;
--text: #e6e9ef;
--text-soft: #c8cee0;
--muted: #a4adbd;
--muted-soft: #6b7280;
--primary: #7aa2ff;
--primary-strong: #9bb6ff;
--primary-grad: linear-gradient(135deg, #7aa2ff 0%, #9c7aff 100%);
--primary-weak: rgba(122, 162, 255, 0.12);
--primary-border: #35406b;
--good: #4ade80;
--good-strong: #86efac;
--good-weak: rgba(74, 222, 128, 0.12);
--good-border: #2b5a3f;
--warn: #fbbf24;
--warn-weak: rgba(251, 191, 36, 0.1);
--warn-border: #5c4715;
--danger: #f87171;
--danger-weak: rgba(248, 113, 113, 0.1);
--danger-border: #5c2b2d;
--radius-lg: 18px;
--radius: 14px;
--radius-sm: 11px;
```

- 폰트: **Pretendard** (`@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css")`)
- 배경: `radial-gradient(1200px 600px at 50% -10%, #11141b, #0b0d12)` 고정
- 카드: 라운드(`--radius`), 얇은 보더, hover 시 살짝 떠오르고(`translateY(-2px)`) 보더 강조
- 헤더 상단에 그라데이션 4px 라인(`--primary-grad`)
- 다크모드 **단일 테마**면 충분 (라이트 토글 불필요)
- 모바일 반응형(그리드 `auto-fill, minmax(290px,1fr)`)

> 참고: `claude-teams-brics` 레포의 `scripts/build-archive-index.mjs` 안에 동일 팔레트로 만든 **순수 HTML 버전 index 디자인**이 들어 있다. 레이아웃/색 감각이 막히면 그 마크업을 디자인 레퍼런스로 참고해도 좋다(그대로 복붙 말고 Next 컴포넌트로 재구성).

---

## 4. 기술 스택 / 구현 지침

- **Next.js (App Router) + TypeScript**, 정적 생성(SSG) 지향. Vercel 무빌드설정 배포.
- 데이터 읽기: 빌드 시 `public/docs/entries.json`을 **파일시스템으로 읽어** props로 전달
  (`import { readFileSync } from 'fs'` + `path.join(process.cwd(),'public/docs/entries.json')`).
  파일이 없거나 비면 `[]`로 처리.
- 탭/필터/검색은 **클라이언트 컴포넌트**에서 상태로 처리(전체 entries를 받아 클라에서 필터링 — 양 적어 충분).
- 스타일: CSS Modules 또는 전역 CSS 어느 쪽이든 OK. 위 변수는 `:root`에 선언.
- 외부 UI 라이브러리 없이 가볍게. (필요시 최소한만)
- `public/docs/`는 `.gitignore` 하지 **말 것** (CI가 커밋해서 넣는다). 단, 로컬엔 없을 수 있으니 빈 상태를 견딜 것.
- HTML 문서 보기: `href`가 `/docs/...` 정적 파일이므로 `<a href={entry.href} target="_blank" rel="noreferrer">`로 충분. (iframe 라우트로 감싸고 싶으면 `/view?src=` 같은 페이지를 추가해도 되지만 필수 아님)

---

## 5. 레포에 이미 들어오는/들어올 파일과의 관계

- 너(이 세션)는 **Next 앱 소스**(`app/`, `components/`, `package.json`, `next.config.*`, 전역 CSS 등)만 만든다.
- `public/docs/` 디렉터리는 **비워두거나 `.gitkeep`만** 둔다. 실제 내용은 외부 CI가 push한다.
- README에 "콘텐츠는 CI 자동 주입, public/docs 수동 편집 금지"를 적어둘 것.

---

## 6. 완료 기준 (체크리스트)

- [ ] `pnpm dev`로 로컬 구동, `public/docs/entries.json`이 없어도 에러 없이 빈 목록 표시
- [ ] 샘플 `entries.json`(아래) 넣었을 때 탭/필터/검색/카드/날짜/배지 모두 정상
- [ ] 카드 클릭 시 `href`의 HTML 문서가 열림
- [ ] 다크 팔레트·Pretendard·반응형 적용
- [ ] Vercel 배포 시 빌드 설정 없이 동작 (Framework: Next.js 자동 감지)

### 로컬 테스트용 샘플 entries.json

```json
[
  {
    "kind": "plan",
    "href": "/docs/plans/bugfix/20260605-message-preview-placeholder.html",
    "title": "환급 상세 > 메세지 전송 모달 미리보기 UX 개선",
    "summary": "미선택 시 skeleton 대신 안내 문구 표시.",
    "category": "bugfix",
    "categoryLabel": "버그·개선",
    "scope": "프론트",
    "status": "done",
    "dateIso": "2026-06-05",
    "dateLabel": "2026.06.05"
  },
  {
    "kind": "plan",
    "href": "/docs/plans/feature/20260605-classification-url-filter-normalize.html",
    "title": "분류 근로자 내역 URL 필터 정규화",
    "summary": "필터 상태를 URL로 정규화.",
    "category": "feature",
    "categoryLabel": "신규 기능",
    "scope": "양쪽",
    "status": "in-progress",
    "dateIso": "2026-06-05",
    "dateLabel": "2026.06.05"
  },
  {
    "kind": "history",
    "href": "/docs/history/refund/20260601-refund-module-overview.html",
    "title": "환급 모듈 구조 개요",
    "summary": "환급 도메인 데이터 흐름과 주요 컬렉션 정리.",
    "category": "refund",
    "categoryLabel": "환급",
    "scope": "",
    "status": "",
    "dateIso": "2026-06-01",
    "dateLabel": "2026.06.01"
  }
]
```

---

## 7. 하지 말 것 (자주 하는 실수)

- ❌ `public/docs/` 안에 콘텐츠를 직접 만들거나 커밋 (CI가 덮어씀 → 충돌)
- ❌ HTML 문서를 Next 컴포넌트로 다시 파싱/렌더 (자체 완결형이라 불필요)
- ❌ 라이트모드 토글, 무거운 UI 라이브러리, DB/백엔드 (정적 사이트로 충분)
- ❌ `entries.json`이 항상 존재한다고 가정 (없을 때 빈 배열 처리 필수)

import { readFileSync } from "fs";
import path from "path";

export type Entry = {
  kind: "plan" | "history";
  href: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  scope: string;
  status: string;
  priority: string;
  dateIso: string;
  dateLabel: string;
};

/**
 * 빌드 시 public/docs/entries.json 을 파일시스템으로 읽는다.
 * 파일이 없거나 비어 있거나 형식이 깨졌으면 빈 배열을 반환한다.
 * (콘텐츠는 외부 CI가 채우므로 로컬/초기 빌드에서는 없을 수 있다.)
 */
export function getEntries(): Entry[] {
  try {
    const file = path.join(process.cwd(), "public", "docs", "entries.json");
    const raw = readFileSync(file, "utf-8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Entry[])
      .slice()
      .sort((a, b) => (a.dateIso < b.dateIso ? 1 : a.dateIso > b.dateIso ? -1 : 0));
  } catch {
    return [];
  }
}

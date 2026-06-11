"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/lib/entries";
import styles from "./Archive.module.css";

type Kind = "plan" | "history";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  planning: { label: "🟡 할 일", cls: styles.badgeWarn },
  "in-progress": { label: "🔵 진행중", cls: styles.badgePrimary },
  done: { label: "🟢 완료", cls: styles.badgeGood },
};

const PRIORITIES = new Set(["P1", "P2", "P3"]);

const PRIORITY_ORDER: Record<string, number> = { P1: 0, P2: 1, P3: 2 };

function categoryBadgeClass(entry: Entry): string {
  if (entry.kind === "history") return styles.badgePurple;
  switch (entry.category) {
    case "feature":
      return styles.badgePrimary;
    case "bugfix":
      return styles.badgeDanger;
    case "refactor":
      return styles.badgePurple;
    default:
      return styles.badgePrimary;
  }
}

export default function Archive({ entries }: { entries: Entry[] }) {
  const [tab, setTab] = useState<Kind>("plan");
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const planCount = useMemo(
    () => entries.filter((e) => e.kind === "plan").length,
    [entries],
  );
  const doneCount = useMemo(
    () =>
      entries.filter((e) => e.kind === "plan" && e.status === "done").length,
    [entries],
  );
  const historyCount = useMemo(
    () => entries.filter((e) => e.kind === "history").length,
    [entries],
  );

  // 현재 탭에 존재하는 카테고리 칩 (등장 순서 유지)
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      if (e.kind !== tab) continue;
      if (!seen.has(e.category))
        seen.set(e.category, e.categoryLabel || e.category);
    }
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [entries, tab]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((e) => {
      if (e.kind !== tab) return false;
      if (category !== "all" && e.category !== category) return false;
      if (q) {
        const hay = `${e.title} ${e.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (tab === "plan") {
      filtered.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return a.dateIso < b.dateIso ? 1 : a.dateIso > b.dateIso ? -1 : 0;
      });
    }
    return filtered;
  }, [entries, tab, category, query]);

  function switchTab(next: Kind) {
    setTab(next);
    setCategory("all");
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <span className={styles.eyebrow}>DEV ARCHIVE</span>
        <h1 className={styles.title}>
          BRICS <span className={styles.titleAccent}>개발 아카이브</span>
        </h1>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={`${styles.statDot} ${styles.dotPrimary}`} />
            <span className={styles.statNum}>{planCount}</span>
            <span className={styles.statLabel}>할 일</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statDot} ${styles.dotGood}`} />
            <span className={styles.statNum}>{doneCount}</span>
            <span className={styles.statLabel}>완료</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statDot} ${styles.dotPurple}`} />
            <span className={styles.statNum}>{historyCount}</span>
            <span className={styles.statLabel}>히스토리</span>
          </span>
        </div>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "plan" ? styles.tabActive : ""}`}
          onClick={() => switchTab("plan")}
        >
          📋 작업
        </button>
        <button
          className={`${styles.tab} ${tab === "history" ? styles.tabActive : ""}`}
          onClick={() => switchTab("history")}
        >
          📚 개발 히스토리
        </button>
      </nav>

      <div className={styles.toolbar}>
        <div className={styles.chips}>
          <button
            className={`${styles.chip} ${category === "all" ? styles.chipActive : ""}`}
            onClick={() => setCategory("all")}
          >
            전체
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              className={`${styles.chip} ${
                category === c.value ? styles.chipActive : ""
              }`}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          className={styles.search}
          type="search"
          placeholder="제목·요약 검색…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>표시할 항목이 없습니다.</div>
      ) : (
        <section className={styles.list}>
          {visible.map((e) => {
            const status = STATUS_MAP[e.status];
            return (
              <a
                key={e.href}
                className={styles.row}
                href={e.href}
                target="_blank"
                rel="noreferrer"
              >
                <div className={styles.rowMain}>
                  <div className={styles.rowHead}>
                    <span className={styles.badges}>
                      <span
                        className={`${styles.badge} ${categoryBadgeClass(e)}`}
                      >
                        {e.categoryLabel || e.category}
                      </span>
                      {status && (
                        <span className={`${styles.badge} ${status.cls}`}>
                          {status.label}
                        </span>
                      )}
                      {PRIORITIES.has(e.priority) && (
                        <span className={`${styles.badge} ${styles.badgePriority}`}>
                          {e.priority}
                        </span>
                      )}
                    </span>
                    <h2 className={styles.rowTitle}>{e.title}</h2>
                  </div>
                  <p className={styles.rowSummary}>{e.summary}</p>
                </div>
                <div className={styles.rowMeta}>
                  <span className={styles.date}>{e.dateLabel}</span>
                  <span className={styles.open}>문서 열기 →</span>
                </div>
              </a>
            );
          })}
        </section>
      )}
    </main>
  );
}

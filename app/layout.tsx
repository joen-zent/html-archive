import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRICS 개발 아카이브",
  description: "작업 계획서와 개발 히스토리 문서를 카테고리로 탐색하는 개발 아카이브",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

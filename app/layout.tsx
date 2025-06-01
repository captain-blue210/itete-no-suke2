import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'いててのすけ',
  description: '痛みを記録・管理するスマートフォン向けWebアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
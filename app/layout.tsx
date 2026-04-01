import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Holiday Bosnia',
  description: 'Holiday Bosnia planner and operations platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

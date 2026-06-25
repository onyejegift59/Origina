'use client';

import { Sidebar } from '@/components/sidebar/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main id="main-content" role="main">
        {children}
      </main>
    </>
  );
}

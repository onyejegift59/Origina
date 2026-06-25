'use client';

import { Sidebar } from '@/components/sidebar/Sidebar';

export default function ArtifactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}

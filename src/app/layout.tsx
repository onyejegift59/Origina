import type { Metadata } from 'next';
import '@/styles/globals.css';
import { SkipLink } from '@/components/ui/SkipLink';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://origina.app';

export const metadata: Metadata = {
  title: 'Origina — AI-Powered Product Planning Workspace',
  description: 'Turn startup ideas into structured product plans. Generate user personas, MVP scope, roadmaps, and more with AI.',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icon32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Origina — AI-Powered Product Planning Workspace',
    description: 'Turn startup ideas into structured product plans. Generate user personas, MVP scope, roadmaps, and more with AI.',
    url: BASE_URL,
    siteName: 'Origina',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Origina — AI-Powered Product Planning Workspace',
    description: 'Turn startup ideas into structured product plans. Generate user personas, MVP scope, roadmaps, and more with AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        <ThemeProvider>
          <div id="main-content">
            {children}
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

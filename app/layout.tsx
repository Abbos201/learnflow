import type { Metadata, Viewport } from 'next';
import { Public_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const font = Public_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'LearnFlow', template: '%s | LearnFlow' },
  description: 'Watch every lesson step by step and track your progress.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

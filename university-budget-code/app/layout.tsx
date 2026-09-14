import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'University Budget 2026–27',
  description: 'Your private university budget, monthly payment details, audited figures and document downloads.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

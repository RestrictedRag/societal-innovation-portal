import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Civic Innovation Marketplace',
  description: 'Civic problem-solving, research collaboration, and innovation marketplace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

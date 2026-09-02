import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/use-auth';
import { ChatWidget } from '@/components/chat/ChatWidget';

export const metadata: Metadata = {
  title: 'Civic Innovation Marketplace',
  description: 'Civic problem-solving, research collaboration, and innovation marketplace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}

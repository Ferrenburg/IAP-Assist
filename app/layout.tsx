import './globals.css';
import { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'OpPeriod IAP Assist',
  description: 'Incident Action Plan management for public safety operational periods.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

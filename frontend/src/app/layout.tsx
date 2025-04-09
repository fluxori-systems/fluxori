import type { Metadata, Viewport } from 'next';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@/styles/globals.css';
import { ThemeProvider } from '@/lib/design-system';
import { AppProvider } from './app-provider';

export const metadata: Metadata = {
  title: 'Fluxori - Inventory & Marketplace Management Platform',
  description: 'Streamline your inventory management and marketplace operations',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultColorMode="light">
          <MantineProvider defaultColorScheme="light">
            <AppProvider>
              <Notifications position="top-right" zIndex={1000} />
              {children}
            </AppProvider>
          </MantineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
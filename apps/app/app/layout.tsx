import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";

import { Gabarito, Geist_Mono } from "next/font/google";
import "@workspace/ui/globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "@workspace/ui/components/sonner";
import NextTopLoader from "nextjs-toploader";

import { siteMetadata } from "@/lib/site-metadata";

const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${gabarito.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <NextTopLoader showSpinner={false} color="var(--loader-bar)" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

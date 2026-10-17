import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DiagnoraX AI — Your Personal AI Health Companion",
  description:
    "AI symptom checking, body metrics and a private health history — a mobile health companion that keeps your data on your device.",
  keywords: [
    "DiagnoraX",
    "AI health",
    "symptom checker",
    "BMI",
    "health companion",
    "mobile health app",
  ],
  authors: [{ name: "Somesh M" }],
  applicationName: "DiagnoraX AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-1024.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/icon-1024.png", sizes: "1024x1024" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DiagnoraX AI",
  },
  openGraph: {
    title: "DiagnoraX AI",
    description: "Your Personal AI Health Companion — private by design.",
    siteName: "DiagnoraX AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F8F6" },
    { media: "(prefers-color-scheme: dark)", color: "#131916" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

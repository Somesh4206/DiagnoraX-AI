import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
    "Describe symptoms in plain language and get a structured informational analysis with clear next steps. Health information, not medical advice. Data stays local.",
  keywords: [
    "DiagnoraX AI",
    "health companion",
    "AI symptom checker",
    "BMI calculator",
    "health history",
    "local-first health app",
    "mobile health app",
  ],
  authors: [{ name: "Somesh M", email: "someshm7662@gmail.com" }],
  applicationName: "DiagnoraX AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-1024.png", type: "image/png", sizes: "1024x1024" }],
    apple: [{ url: "/icon-1024.png", sizes: "1024x1024" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DiagnoraX AI",
  },
  openGraph: {
    title: "DiagnoraX AI",
    description: "Your personal AI health companion. Information you can act on — not a diagnosis.",
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
  themeColor: "#050807",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}

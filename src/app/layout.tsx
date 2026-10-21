import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/pwa-register";

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
    "A private, dark-neon mobile health app: AI symptom guidance, body metrics and a health history that never leaves your device. Health information, not medical advice.",
  keywords: [
    "DiagnoraX AI",
    "health companion",
    "AI symptom checker",
    "BMI calculator",
    "health history",
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
        <PwaRegister />
        <Toaster />
      </body>
    </html>
  );
}

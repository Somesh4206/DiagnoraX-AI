import type { Metadata } from "next";
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
  ],
  authors: [{ name: "Somesh M", email: "someshm7662@gmail.com" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "DiagnoraX AI",
    description: "Your personal AI health companion. Information you can act on — not a diagnosis.",
    siteName: "DiagnoraX AI",
    type: "website",
  },
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

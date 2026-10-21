import type { NextConfig } from "next";

/* Two build targets from one codebase:
 *  - default    : Next.js server build (web app with cloud AI backend)
 *  - BUILD_TARGET=apk : fully static export → bundled into the Android APK
 *    via Capacitor. The app then runs 100% on-device (offline engine +
 *    localStorage history), optionally calling a remote DiagnoraX server. */
const isApk = process.env.BUILD_TARGET === "apk";

const nextConfig: NextConfig = {
  ...(isApk
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

import type { CapacitorConfig } from '@capacitor/cli'

/* DiagnoraX AI — Capacitor configuration.
 * Wraps the static Next.js export (out/) in a native Android shell.
 * Build: BUILD_TARGET=apk bun run build:apk && bunx cap sync android */

const config: CapacitorConfig = {
  appId: 'com.somesh.diagnorax',
  appName: 'DiagnoraX AI',
  webDir: 'out',
  android: {
    backgroundColor: '#050807',
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config

import { NextResponse } from 'next/server'

/* CORS helpers — the API is credential-free health information, so a
 * permissive policy is safe and lets the Android APK (and any deployed
 * copy of this app) call a remote DiagnoraX server cross-origin. */

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function corsJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

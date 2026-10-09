import "server-only";
import { NextResponse, type NextRequest } from "next/server";

export const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export function json(body: unknown, init: { status?: number; headers?: HeadersInit } = {}) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { ...NO_STORE, ...(init.headers as Record<string, string> | undefined) },
  });
}

/**
 * CSRF / cross-site protection for state-changing requests: the Origin (or Referer)
 * must match the host that served the request. Browsers always send Origin on POST.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return request.headers.get("x-real-ip");
}

export async function readJson(request: NextRequest, maxBytes = 2048): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("payload_too_large");
  return text ? JSON.parse(text) : {};
}

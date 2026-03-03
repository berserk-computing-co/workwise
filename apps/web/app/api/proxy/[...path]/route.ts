import { getAccessToken } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getBearerToken(): Promise<string> {
  if (process.env.DEV_SKIP_AUTH === "true") {
    return process.env.DEV_JWT_TOKEN!;
  }
  const { accessToken } = await getAccessToken();
  return accessToken!;
}

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const accessToken = await getBearerToken();
  const path = "/" + params.path.join("/");
  const url = new URL(path, API_BASE);

  // Forward query params
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (req.method !== "GET") {
    headers["Content-Type"] =
      req.headers.get("content-type") || "application/json";
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    fetchOptions.body = await req.text();
  }

  const res = await fetch(url.toString(), fetchOptions);

  const responseBody = res.status === 204 ? null : await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;

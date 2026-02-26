import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const material = searchParams.get("material");
  if (!material || !material.trim()) {
    return NextResponse.json(
      { error: "material query param is required" },
      { status: 400 },
    );
  }

  const zip = searchParams.get("zip") || "84111";

  const url = new URL("/pricing/lookup", API_BASE);
  url.searchParams.set("description", material.trim());
  url.searchParams.set("zip", zip);

  const res = await fetch(url.toString());

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch pricing data" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

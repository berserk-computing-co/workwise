import { NextRequest, NextResponse } from "next/server";
import { fetchSourceItems } from "./one_build_client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const material = searchParams.get("material");
  if (!material || !material.trim()) {
    return NextResponse.json({ error: "material query param is required" }, { status: 400 });
  }

  const response = await fetchSourceItems({
    state: "UT",
    zipcode: "84111",
    searchTerm: material.trim(),
  });

  if (!response) {
    return NextResponse.json({ error: "Failed to fetch pricing data" }, { status: 502 });
  }

  return NextResponse.json(response.data.sources.nodes);
}

import { NextRequest, NextResponse } from "next/server";
import { type Bid } from "@/app/types";
import { analyzeBid } from "@/app/lib/openai/bids";

export async function POST(request: NextRequest) {
  let bid: Partial<Bid>;
  try {
    bid = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const anomalies = await analyzeBid(bid);
    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error("Bid analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze bid" }, { status: 500 });
  }
}

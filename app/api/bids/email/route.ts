import { NextRequest, NextResponse } from "next/server";
import { type Bid } from "@/app/types";
import { generateBidEmailMessage } from "@/app/lib/openai/bids";

export async function POST(request: NextRequest) {
  let bid: Partial<Bid>;
  try {
    bid = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const message = await generateBidEmailMessage(bid);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Email generation error:", error);
    return NextResponse.json({ error: "Failed to generate email draft" }, { status: 500 });
  }
}

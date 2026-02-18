import { NextRequest, NextResponse } from "next/server";
import { type Bid } from "@/app/types";
import { generateBidDocumentSpec } from "@/app/lib/openai/bids";
import { renderBidPdf } from "@/app/lib/pdf/bid_pdf";

export async function POST(request: NextRequest) {
  let bid: Partial<Bid>;
  try {
    bid = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!bid.name) {
    return NextResponse.json({ error: "Bid name is required" }, { status: 422 });
  }

  try {
    const docSpec = await generateBidDocumentSpec(bid);
    const pdfBuffer = await renderBidPdf(bid, docSpec);
    const filename = `bid-${(bid.name ?? "document").replace(/\s+/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

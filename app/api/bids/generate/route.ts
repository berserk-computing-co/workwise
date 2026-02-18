import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/app/lib/openai/client";
import { runMaterialsAgent } from "@/app/lib/openai/materials_agent";
import { generateBidDocumentSpec } from "@/app/lib/openai/bids";
import { renderBidPdf } from "@/app/lib/pdf/bid_pdf";
import { sendBidEmail } from "@/app/lib/email/resend";
import { type Bid } from "@/app/types";

// Allow up to 5 minutes for Vercel serverless functions
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const description = formData.get("description");
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 422 });
  }

  const email = formData.get("email");
  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "email is invalid" }, { status: 422 });
  }

  // Handle optional image upload
  let imageBase64: string | undefined;
  let mimeType: string | undefined;
  const imageField = formData.get("image");
  if (imageField && imageField instanceof Blob && imageField.size > 0) {
    const arrayBuffer = await imageField.arrayBuffer();
    imageBase64 = Buffer.from(arrayBuffer).toString("base64");
    mimeType = imageField.type || "image/jpeg";
  }

  try {
    // 1. Run the materials agent to produce line items with real 1Build prices
    const estimateItems = await runMaterialsAgent(description.trim(), imageBase64, mimeType);

    // 2. Generate a short project name via gpt-4o-mini
    const nameResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `Generate a short (3-5 word) project name for this construction project: "${description.trim()}". Respond with only the name, no punctuation.`,
        },
      ],
    });
    const projectName = nameResponse.choices[0].message.content?.trim() ?? "Construction Bid";

    // 3. Compute total cost
    const estimatedCost = estimateItems.reduce((sum, item) => sum + item.total_cost, 0);

    // 4. Build a Partial<Bid> for the PDF pipeline
    const bid: Partial<Bid> = {
      name: projectName,
      description: description.trim(),
      estimated_cost: estimatedCost,
      estimates: [
        {
          estimateItems,
        },
      ],
    };

    // 5. Generate the document spec via LLM
    const docSpec = await generateBidDocumentSpec(bid);

    // 6. Render the PDF
    const pdfBuffer = await renderBidPdf(bid, docSpec);
    const filename = `bid-${projectName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    // 7. Email the PDF (non-fatal — log on failure but still return the download)
    try {
      await sendBidEmail(email.trim(), projectName, pdfBuffer);
    } catch (emailError) {
      console.error("Failed to send bid email:", emailError);
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Bid generation error:", error);
    return NextResponse.json({ error: "Failed to generate bid" }, { status: 500 });
  }
}

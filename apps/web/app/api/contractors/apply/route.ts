import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { full_name, email, phone, zip } = body;

  if (!full_name || typeof full_name !== "string" || !full_name.trim()) {
    return NextResponse.json({ error: "full_name is required" }, { status: 422 });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 422 });
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 422 });
  }
  if (!zip || typeof zip !== "string" || !/^\d{5}$/.test(zip.trim())) {
    return NextResponse.json({ error: "A valid 5-digit ZIP code is required" }, { status: 422 });
  }

  const workwiseUrl = process.env.WORKWISE_URL ?? "http://localhost:5000";

  let upstream: Response;
  try {
    upstream = await fetch(`${workwiseUrl}/contractors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Failed to reach Rails backend:", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 502 });
  }

  if (upstream.ok) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  let errorMessage = "Application failed";
  try {
    const data = await upstream.json();
    errorMessage = data?.error ?? data?.message ?? errorMessage;
  } catch {
    // ignore parse errors
  }

  return NextResponse.json({ error: errorMessage }, { status: upstream.status });
}

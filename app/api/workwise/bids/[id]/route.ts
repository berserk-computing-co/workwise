import { NextResponse, NextRequest } from "next/server";
import { getAccessToken } from "@/app/lib/auth/utills";

async function getBid(_: NextRequest, { params }: { params: { id: string } }) {
  if (!params.id) {
    return new NextResponse(JSON.stringify({ message: 'Missing ID' }), {
      status: 400
    });
  }
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new NextResponse(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }

  const bid = await fetch(`${process.env.WORKWISE_URL}/bids/${params.id}`, {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
  }).then((result) => result.json());

  console.log('bid', bid);

  return NextResponse.json({ bid });
}

export { getBid as GET };
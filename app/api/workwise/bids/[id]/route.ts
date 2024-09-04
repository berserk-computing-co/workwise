import { NextResponse } from "next/server";
import { getAccessToken } from "../route";

async function getBid() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new NextResponse(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }

  const bidData = await fetch(`${process.env.WORKWISE_URL}/bids`, {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
  }).then((result) => result.json());

  return NextResponse.json({ bids: bidData });
}

export { getBid as GET };
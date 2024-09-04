import { Bid, Estimate } from "@/app/types";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const getAccessToken = async () => {
  const session = await getServerSession({
    callbacks: {
      async session({ session, token }) {
        if (typeof token.accessToken === "string") {
          session.access_token = token.accessToken;
        }
        return session;
      },
    },
  });

  return session?.access_token;
};

async function getBids() {
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

async function createBid(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new NextResponse(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }
  const bid: Partial<Bid> = await request.json();
  if (!bid.estimates || bid.estimates.some((estimate) => !estimate)) {
    return new NextResponse(JSON.stringify({ message: 'Estimates are required' }), {
      status: 422,
    });
  }
  const estimates = bid.estimates.map((estimate: Partial<Estimate>) => {
    return {
      completion_date: new Date(),
      expiration_date: new Date(),
      estimate_items_attributes: []
    }
  });

  return await fetch(`${process.env.WORKWISE_URL}/bids`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bid: {
        name: bid.name,
        description: bid.description,
        estimates_attributes: estimates
      }
    })
  });
}

export { getBids as GET, createBid as POST };

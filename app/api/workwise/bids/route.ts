import { Bid, Estimate } from "@/app/types";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {getAccessToken} from "@/app/lib/auth/utills";
import {workwiseFetch} from "@/app/lib/workwise_api/utils";

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
      estimate_items_attributes: estimate.estimateItems?.map((item) => ({
        name: item.name,
        price_per_unit: item.pricePerUnit,
        quantity: item.quantity,
        total_cost: item.totalCost
      })),
    }
  });

  return await workwiseFetch('bids', accessToken, {
    method: "POST",
    body: {
      bid: {
        name: bid.name,
        description: bid.description,
        address_attributes: bid.address,
        estimates_attributes: estimates
      }
    }
  });
}

export { getBids as GET, createBid as POST };

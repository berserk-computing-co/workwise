import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const getAccessToken = async () => {
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
  return await fetch(`${process.env.WORKWISE_URL}/bids`, {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
  });
}

async function createBid(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new NextResponse(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }
  const bid = await request.json();
  console.log('bid', bid);
  return await fetch(`${process.env.WORKWISE_URL}/bids`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bid
    })
  });
}

export { getBids as GET, createBid as POST };

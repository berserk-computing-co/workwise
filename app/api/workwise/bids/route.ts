import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function getBids() {
  const session = await getServerSession({
    callbacks: {
      async session({ session, token, user }) {
        console.log(user);
        session.access_token = token.accessToken;
        return session;
      },
    },
  });
  console.log("session:", session);
  if (!session?.access_token) {
    return new NextResponse(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }

  return await fetch(`${process.env.WORKWISE_URL}/bids`, {
    headers: {
      Authorization: "Bearer " + session?.access_token,
      "Content-Type": "application/json",
    },
  });
}

export { getBids as GET };

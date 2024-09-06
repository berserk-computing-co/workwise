import { NextResponse } from "next/server";
import { getAccessToken } from "../route";
import { NextApiRequest } from "next";

async function getBid(_: NextApiRequest, { params }: { params: { id: string } }) {
  console.log('params', +params.id);
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

  return NextResponse.json({ bid });
}

export { getBid as GET };
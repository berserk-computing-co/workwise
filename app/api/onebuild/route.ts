import { NextResponse } from "next/server";
import { fetchSourceItems } from "./one_build_client";

async function getOneBuildResults(request: Request) {
  const { searchParams } = new URL(request.url)
  const material = searchParams.get('material');
  const variables = {
    state: 'UT',
    zipcode: '84111',
    searchTerm: material,
  };


  const response = await fetchSourceItems(variables);

  return new NextResponse(JSON.stringify(response?.data?.sources?.nodes) ?? []);
}

export { getOneBuildResults as GET };
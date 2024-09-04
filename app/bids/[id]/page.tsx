'use client'
import { Card } from "flowbite-react";
import { NextResponse } from "next/server";
import { useEffect } from "react";

export default function Bid({ params: { id } }) {
  if (!id) {
    return NextResponse.error();
  }
  console.log(id);
  useEffect(() => {
    fetch(`/api/workwise/bids/${id}`)
      .then((response) => response.json())
      .then(({ bid }) => {
        console.log('bid', bid);
      });
  }, []);

  return (
    <Card>
      <h1>
      </h1>
    </Card>
  );
}
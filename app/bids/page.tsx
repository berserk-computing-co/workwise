"use client";
import { Card } from "flowbite-react";
import { useEffect } from "react";

const bids: any[] = [
  {
    name: "Basement Finish",
    status: "Pending",
  },
];
const bidCard = (bid: any) => {
  return (
    <Card className="bg-blue-100 flex justify-center w-full h-14 shadow-lg rounded-md">
      <div className="flex justify-between h-full">
        <div className="flex flex-1 justify-center items-center">
          {bid.name}
        </div>
        <div className="flex flex-1 justify-center items-center">
          {bid.status}
        </div>
      </div>
    </Card>
  );
};

export default function Bids() {
  useEffect(() => {
    const fetchBids = async () => {
      const data = await fetch("/api/workwise/bids");
      console.log("fetch bids", data);
    };
    fetchBids();
  }, []);
  return (
    <Card className="bg-black-200 w-full">
      <div>{bids.map(bidCard)}</div>
      <a
        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        href="/bids/create"
      >
        + New Bid
      </a>
    </Card>
  );
}

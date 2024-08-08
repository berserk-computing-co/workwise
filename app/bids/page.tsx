"use client";
import { Card, Spinner } from "flowbite-react";
import { useEffect, useState } from "react";

const bidCard = (bid: any) => {
  return (
    <Card className="bg-blue-600 flex justify-center w-full h-14 shadow-lg rounded-md">
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
  const [bids, setBids] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setFetching(true);
    fetch("/api/workwise/bids")
      .then((response) => response.json())
      .then(({ bids }) => {
        console.log('data', bids);
        setBids(bids ?? []);
        setFetching(false);
      }).catch(() => setFetching(false));
  }, []);

  return (
    <Card className="bg-black-200 w-full">
      <div>{fetching ? <Spinner /> : bids.map(bidCard)}</div>
      <a
        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        href="/bids/create"
      >
        + New Bid
      </a>
    </Card>
  );
}

"use client";
import { Card, ListGroup, Spinner } from "flowbite-react";
import { useEffect, useState } from "react";
import { Bid } from "../types";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import { useStytch, useStytchUser } from "@stytch/nextjs";
import { useSearchParams } from "next/navigation";

const MAGIC_LINKS_TOKEN = "magic_links";

const bidCard = (bid: Bid) => {
  const { completion_date, expiration_date } = bid.estimates?.[0] ?? {};
  return (
    <div className="grid grid-rows-4 grid-flow-col gap-4 w-full">
      <h5 className="flex items-center text-2xl font-bold tracking-tight row-span-3">
        {bid.name}
      </h5>
      <div className="flex flex-1 justify-center items-center">
        {bid.status}
      </div>
      <div className="size-5 text-lightblue-500 justify-self-end">
        <a href={`/bids/${bid.id}`}>
          <ArrowTopRightOnSquareIcon />
        </a>
      </div>
      <div>
        <div>
          Estimated Revenue: ${bid.estimated_cost}
        </div>
      </div>
      {
        completion_date && (
          <div className="flex flex-1 justify-center items-center">
            Completion: {new Date(completion_date).toDateString()}
          </div>
        )
      }
      {
        expiration_date && (
          <div>
            Bid Expires {new Date(expiration_date).toDateString()}
          </div>
        )
      }
    </div >
  );
};

export default function Bids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [fetching, setFetching] = useState(false);
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (stytch && !user && isInitialized) {
      const token = searchParams.get("token");
      const stytch_token_type = searchParams.get("stytch_token_type");

      if (token && stytch_token_type === MAGIC_LINKS_TOKEN) {
        stytch.magicLinks.authenticate(token, {
          session_duration_minutes: 60,
        });
      }
    }
  }, [isInitialized, searchParams, stytch, user]);

  useEffect(() => {
    setFetching(true);
    fetch("/api/workwise/bids")
      .then((response) => response.json())
      .then(({ bids }) => {
        setBids(bids ?? []);
        setFetching(false);
      }).catch(() => setFetching(false));
  }, []);

  return (
    <>
      <Card className="dark:bg-slate-800">
        {fetching ?
          <Spinner /> :
          <ListGroup>
            {bids.map((bid) => (
              <ListGroup.Item key={bid.id}>
                {bidCard(bid)}
              </ListGroup.Item>
            ))}
          </ListGroup>
        }
        <a
          className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          href="/bids/create"
        >
          + New Bid
        </a>
      </Card >
    </>
  );
}

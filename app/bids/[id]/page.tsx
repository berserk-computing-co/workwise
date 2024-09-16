'use client'
import { Bid as BidType, EstimateItem } from "@/app/types";
import { Button, Card, Spinner } from "flowbite-react";
import { NextResponse } from "next/server";
import { useEffect, useMemo, useState } from "react";

export default function Bid({ params: { id } }: { params: { id: number } }) {
  if (!id) {
    return NextResponse.error();
  }
  const [bid, setBid] = useState<BidType>();
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workwise/bids/${id}`)
      .then((response) => response.json())
      .then(({ bid }) => {
        setBid(bid);
        setLoading(false);
      });
  }, []);

  const onAccept = () => {
    setAccepting(true);
    setTimeout(() => { setAccepting(false) }, 1000);
  };

  const renderBidDetails = useMemo(() => {
    const estimateItems = bid?.estimates[0].estimate_items ?? [];
    console.log(estimateItems);
    return (bid && (
      <>
        <h1 className="text-slate-900">{bid?.name}</h1>
        <div className="text-slate-600">{bid.description}</div>
        <div className="text-slate-700">AI Generated Content Goes here</div>
        {estimateItems && (
          <table className="table-fixed">
            <thead>
              <tr className="text-slate-700">
                <th>
                  Estimate Item
                </th>
                <th>
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {estimateItems.map((item: EstimateItem) => (
                <tr className="text-slate-700">
                  <td>{item.name}</td>
                  <td>{item.total_cost}</td>
                </tr>
              ))}
              <tr className="text-slate-700">
                <td>
                  Total
                </td>
                <td>
                  {bid.estimated_cost}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="text-slate-500">By accepting this bid, I understand that the final amount billed may change. I also accept that there is a 10 year limited warranty on workmanship provided by the contractor.</div>
        <Button onClick={onAccept}>{accepting ? <Spinner /> : 'Accept Bid'}</Button>
      </>
    ))
  }, [bid, accepting]);

  return (
    <Card>{loading ? <Spinner /> : renderBidDetails}</Card>
  );
}
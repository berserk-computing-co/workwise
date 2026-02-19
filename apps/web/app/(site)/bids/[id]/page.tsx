'use client'
import { Bid as BidType, EstimateItem } from "@/app/types";
import { Button, Card, Spinner } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";

export default function Bid({ params: { id } }: { params: { id: string } }) {
  const [bid, setBid] = useState<BidType>();
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workwise/bids/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch bid");
        return response.json();
      })
      .then(({ bid }) => {
        setBid(bid);
      })
      .catch(() => {
        // TODO: show error state
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onAccept = () => {
    setAccepting(true);
    setTimeout(() => { setAccepting(false) }, 1000);
  };

  const renderBidDetails = useMemo(() => {
    const estimateItems = bid?.estimates?.[0]?.estimate_items ?? [];
    return (bid && (
      <>
        <h1 className="text-slate-900 dark:text-slate-100">{bid?.name}</h1>
        <div className="text-slate-600 dark:text-slate-300">{bid.description}</div>
        <div className="text-slate-700 dark:text-slate-200">AI Generated Content Goes here</div>
        {estimateItems && (
          <table className="table-fixed">
            <thead>
              <tr className="text-slate-700 dark:text-slate-200">
                <th>
                  Estimate Item
                </th>
                <th>
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {estimateItems.map((item: EstimateItem, index: number) => (
                <tr key={item.name ?? index} className="text-slate-700 dark:text-slate-200">
                  <td>{item.name}</td>
                  <td className="text-green-700 dark:text-green-400">{item.total_cost}</td>
                </tr>
              ))}
              <tr className="text-slate-700 dark:text-slate-200">
                <td>
                  Total
                </td>
                <td className="text-green-700 dark:text-green-400">
                  {bid.estimated_cost}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="text-slate-600 dark:text-slate-400">By accepting this bid, I understand that the final amount billed may change. I also accept that there is a 10 year limited warranty on workmanship provided by the contractor.</div>
        <Button onClick={onAccept}>{accepting ? <Spinner /> : 'Accept Bid'}</Button>
      </>
    ))
  }, [bid, accepting]);

  return (
    <Card className="dark:bg-slate-800">{loading ? <Spinner /> : renderBidDetails}</Card>
  );
}

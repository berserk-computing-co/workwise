import React from 'react';
import { Bid } from "@/app/types"
import { Card } from "flowbite-react";

export const useEstimateItems = (bid: Partial<Bid>) => {
  const estimates = bid.estimates ?? [];
  const currentEstimateItems = estimates[0] && estimates[0].estimateItems
    ? estimates[0].estimateItems : [];

  const projectCost = currentEstimateItems
    .reduce((prev, current) => prev + current.totalCost, 0);

  const rows = currentEstimateItems.map(
    ({ name, totalCost }) => {
      return (
        <Card>
          <div className="flex flex-row space-x-3" >
            <div className="text-slate-800" >
              {name}
            </div>
            <div className="text-green-300" > ${totalCost} </div>
          </div>
        </Card>
      );
    });

  return {
    projectCost,
    rows
  };
};

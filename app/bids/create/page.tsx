"use client";

import React, { useState } from "react";
import { CreateBidStepContext } from "./forms/create_bid_step_context";
import { DetailsForm } from "./forms/details_form";
import { EstimateItemsForm } from "./forms/estimate_items_form";
import { Card } from "flowbite-react";
import { Bid } from "@/app/types";
import { TimelineForm } from "./forms/timeline_form";
import { useRouter } from "next/navigation";

type Step = "details" | "estimate-items" | "timeline";

export default function CreateBid() {
  const [step, setStep] = useState<Step>("details");
  const [bid, setBid] = useState<Partial<Bid>>({});
  const router = useRouter();

  const setStepWithBid = (step: Step, bid: Partial<Bid> = {}) => {
    setBid(bid);
    setStep(step);
  }

  return (
    <div className="flex justify-center">
      <Card className="bg-blue-100 w-6/12 p-10 m-10">
        <CreateBidStepContext.Provider
          value={{
            step,
            setStep: setStepWithBid,
            bid,
            setBid
          }}
        >
          {step === "details" && <DetailsForm />}
          {step === "estimate-items" && <EstimateItemsForm />}
          {step === "timeline" && <TimelineForm onComplete={() => router.push('/bids')} />}
        </CreateBidStepContext.Provider>
      </Card>
    </div>
  );
}

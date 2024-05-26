"use client";
import { useState } from "react";
import { CreateBidStepContext } from "./forms/create_bid_step_context";
import { DetailsForm } from "./forms/details_form";
import { EstimateItemsForm } from "./forms/estimate_items_form";
import { Card } from "flowbite-react";
import { NewBidContext } from "./forms/new_bid_context";
import { Bid } from "@/app/types";

export default function CreateBid() {
  const [step, setStep] = useState<"details" | "estimate-items" | "timeline">(
    "details"
  );
  const [bid, setBid] = useState<Partial<Bid>>({});

  return (
    <div className="flex justify-center">
      <Card className="bg-blue-100 w-6/12 p-10 m-10">
        <CreateBidStepContext.Provider value={{ step, setStep }}>
          <NewBidContext.Provider value={{ bid, setBid }}>
            {step === "details" && <DetailsForm />}
            {step === "estimate-items" && <EstimateItemsForm />}
          </NewBidContext.Provider>
        </CreateBidStepContext.Provider>
      </Card>
    </div>
  );
}

import { Bid } from "@/app/types";
import { createContext, useContext } from "react";

export interface CreateBidStep {
  bid?: Partial<Bid>;
  setBid: (bid: Partial<Bid>) => void;
  step: "details" | "estimate-items" | "timeline";
  setStep: (step: "details" | "estimate-items" | "timeline", bid?: Partial<Bid>) => void;
}

export const CreateBidStepContext = createContext<CreateBidStep>({
  bid: {},
  setBid: () => { },
  step: "details",
  setStep: () => { },
});

export const useStepContext = () => useContext(CreateBidStepContext);

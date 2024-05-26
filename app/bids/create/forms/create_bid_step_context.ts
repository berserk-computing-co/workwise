import { createContext, useContext } from "react";

export interface CreateBidStep {
  step: "details" | "estimate-items" | "timeline";
  setStep: (step: string) => void;
}

export const CreateBidStepContext = createContext<CreateBidStep>({
  step: "details",
  setStep: (step: "details" | "estimate-items" | "timeline") => {},
});

export const useStepContext = () => useContext(CreateBidStepContext);

import { Bid } from "@/app/types";
import { createContext, useContext } from "react";

interface NewBidContextType {
  bid: Partial<Bid>;
  setBid: (bid: Partial<Bid>) => void;
}

export const NewBidContext = createContext<NewBidContextType>({
  bid: {},
  setBid: () => {},
});

export const useNewBidContext = () => useContext(NewBidContext);

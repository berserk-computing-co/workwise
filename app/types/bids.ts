import { type BidStatus } from "./api/bids";
import {
  type Address,
  type BidRequest,
  type BidResponse,
  type Estimate,
  type EstimateAttributes,
  isAddress,
  type UpdateBidRequest,
} from "./api/interfaces";
import { type Client, isClient } from "./client";
import { type Project } from "./jobs";

export const toBidRequest = (bid: Bid): Partial<BidRequest> => ({
  addressAttributes: bid.address,
  estimatesAttributes: [toEstimateAttributes(bid.estimates[0])],
  clientId: bid.client?.id,
  name: bid.name,
  description: bid.description,
});

export const toUpdateBidRequest = (
  bid: Bid,
  body: Partial<UpdateBidRequest> = {}
): Partial<UpdateBidRequest> => ({
  estimatesAttributes: bid.estimates.map(toEstimateAttributes),
  ...body,
});

const toEstimateAttributes = ({
  estimateItems,
  estimate_items,
  ...otherAttributes
}: Partial<Estimate>): Partial<EstimateAttributes> => ({
  ...otherAttributes,
  estimateItemsAttributes: estimateItems ?? estimate_items ?? [],
});

export const toUpdateBidRequestNewEstimate = (
  bid: Bid,
  body: Partial<UpdateBidRequest> = {}
): Partial<UpdateBidRequest> => ({
  estimatesAttributes: bid.estimates.map(toEstimateAttributesWithoutId),
  ...body,
});

const toEstimateAttributesWithoutId = ({
  estimateItems,
  estimate_items,
  ...otherAttributes
}: Partial<Estimate>): Partial<Omit<EstimateAttributes, "id">> => ({
  ...otherAttributes,
  estimateItemsAttributes: estimateItems ?? estimate_items ?? [],
});

export const toBid = (bidResponse: Partial<BidResponse>): Bid => {
  const {
    id,
    name,
    latestEstimate,
    estimatedCost,
    description,
    address,
    client,
    project,
    status,
    estimates,
  } = bidResponse;
  return {
    id: id ?? 0,
    description: description ?? "",
    name: name ?? "",
    ...(latestEstimate ? { estimate: latestEstimate } : { estimate: {} as Partial<Estimate> }),
    ...(address && { address }),
    ...(client && { client }),
    ...(project && { project }),
    ...(status && { status }),
    ...(estimatedCost && { estimated_cost: estimatedCost }),
    ...(estimates && { estimates }),
  };
};

export interface Bid {
  id: number;
  name: string;
  description: string;
  client: Client | undefined;
  address: Partial<Address>;
  project: Partial<Project>;
  status: BidStatus;
  estimated_cost: number;
  estimates: Array<Partial<Estimate>>;
}

export const isBid = (bid: Partial<Bid>): bid is Bid =>
  (bid as Bid).name !== undefined &&
  (bid as Bid).estimates &&
  (bid as Bid).estimates.length > 0 &&
  isClient((bid as Bid).client) &&
  isAddress((bid as Bid).address);

export const BidStatusColorMap = new Map<BidStatus, string>([
  ["draft", "grey"],
  ["submitted", "green"],
  ["accepted", "darkgreen"],
  ["rejected", "red"],
  ["revise", "orange"],
  ["withdrawn", "purple"],
  ["expired", "darkred"],
]);

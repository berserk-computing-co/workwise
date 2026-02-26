"use client";

import { BidGenerator } from "@/app/components/bid_generator";

export default function WidgetPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent px-6">
      <BidGenerator />
    </div>
  );
}
